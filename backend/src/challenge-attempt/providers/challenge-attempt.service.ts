import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ChallengeAttempt } from '../entities/challenge-attempt.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { AttemptStatus } from '../enums/attempt-status.enum';
import { CreateChallengeAttemptDto } from '../dtos/create-challenge-attempt.dto';
import { SubmitAttemptDto } from '../dtos/submit-attempt.dto';
import { RevealSolutionDto } from '../dtos/reveal-solution.dto';
import { UseHintDto } from '../dtos/use-hint.dto';
import { ChallengeValidationService } from './challenge-validation.service';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

/** Terminal states where no further mutations are allowed. */
const TERMINAL_STATES = new Set<AttemptStatus>([
  AttemptStatus.CORRECT,
  AttemptStatus.INCORRECT,
  AttemptStatus.EXPIRED,
]);

@Injectable()
export class ChallengeAttemptService {
  private readonly logger = new Logger(ChallengeAttemptService.name);

  constructor(
    @InjectRepository(ChallengeAttempt)
    private readonly attemptRepository: Repository<ChallengeAttempt>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly challengeValidationService: ChallengeValidationService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Attempt Creation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Starts a new challenge attempt for a user.
   *
   * Creates a record in STARTED state. The user can then submit an answer,
   * use hints, or reveal the solution.
   */
  async createAttempt(
    dto: CreateChallengeAttemptDto,
  ): Promise<ChallengeAttempt> {
    const challengeExists = await this.puzzleRepository.existsBy({
      id: dto.challengeId,
    });
    if (!challengeExists) {
      throw new NotFoundException(
        `Challenge with ID ${dto.challengeId} not found`,
      );
    }

    const attempt = this.attemptRepository.create({
      userId: dto.userId,
      challengeId: dto.challengeId,
      sessionId: dto.sessionId,
      status: AttemptStatus.STARTED,
      score: 0,
      timeSpent: 0,
      hintsUsed: 0,
      solutionRevealed: false,
    });

    return this.attemptRepository.save(attempt);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Answer Submission & Result Recording
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Submits an answer for an existing attempt.
   *
   * - Validates the attempt exists and is in a submittable state.
   * - Compares the answer against the puzzle's correct answer (case-insensitive
   *   with whitespace trimming).
   * - Sets status to CORRECT or INCORRECT, records timeSpent and submittedAt.
   * - Awards score only on correct answers (unless solution was already
   *   revealed, which forfeits scoring).
   *
   * If an idempotencyKey is provided (or can be derived), duplicate
   * submissions are detected and the original result is returned without
   * re-processing — preventing double XP awards, double session advances,
   * and duplicate reward eligibility.
   */
  async submitAttempt(dto: SubmitAttemptDto): Promise<ChallengeAttempt> {
    const idempotencyKey =
      dto.idempotencyKey ?? this.deriveIdempotencyKey(dto);

    const { duplicate, data: attempt } =
      await this.idempotencyService.execute<ChallengeAttempt>(
        `attempt-submit:${idempotencyKey}`,
        () => this.processSubmitAttempt(dto),
      );

    if (duplicate) {
      this.logger.log(
        `Duplicate submission detected for key: ${idempotencyKey}. Returning cached result.`,
      );
    }

    return attempt;
  }

  /**
   * Internal method that performs the actual submission logic.
   * Called inside an idempotency guard — only executes once per key.
   */
  private async processSubmitAttempt(
    dto: SubmitAttemptDto,
  ): Promise<ChallengeAttempt> {
    const attempt = await this.findAttemptOrFail(dto.attemptId);
    this.assertMutable(attempt);

    const puzzle = await this.puzzleRepository.findOneBy({
      id: attempt.challengeId,
    });
    if (!puzzle) {
      throw new NotFoundException(
        `Challenge with ID ${attempt.challengeId} not found`,
      );
    }

    const isCorrect = this.challengeValidationService.validateAnswer(
      dto.answer,
      puzzle.correctAnswer,
    );

    attempt.answer = dto.answer;
    attempt.timeSpent = dto.timeSpent;
    attempt.submittedAt = new Date();
    attempt.status = AttemptStatus.SUBMITTED;

    // Final grading — solution reveals forfeit any score
    if (attempt.solutionRevealed) {
      attempt.status = AttemptStatus.INCORRECT;
      attempt.score = 0;
    } else if (isCorrect) {
      attempt.status = AttemptStatus.CORRECT;
      attempt.score =
        this.challengeValidationService.calculateScore(
          puzzle.points,
          dto.timeSpent,
          puzzle.timeLimit,
        );
    } else {
      attempt.status = AttemptStatus.INCORRECT;
      attempt.score = 0;
    }

    return this.attemptRepository.save(attempt);
  }

  /**
   * Derives a deterministic idempotency key from the request parameters
   * when the client doesn't provide one. This prevents double-processing
   * of the exact same logical request, but does NOT protect against
   * retries with a different answer (which is correct — a retry with a
   * different answer is a new submission attempt).
   */
  private deriveIdempotencyKey(dto: SubmitAttemptDto): string {
    const payload = `${dto.attemptId}:${dto.answer}:${dto.timeSpent}`;
    return createHash('sha256').update(payload).digest('hex').slice(0, 32);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Hint Tracking
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Records that the player used a hint for this attempt.
   *
   * Increments hintsUsed. The actual hint content is retrieved from the
   * puzzle by the caller; this method only tracks the usage count.
   *
   * Hints cannot be used after an attempt has reached a terminal state.
   */
  async useHint(dto: UseHintDto): Promise<ChallengeAttempt> {
    const attempt = await this.findAttemptOrFail(dto.attemptId);
    this.assertMutable(attempt);

    attempt.hintsUsed += 1;
    return this.attemptRepository.save(attempt);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Solution Reveal Tracking
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Records that the player revealed the solution for this attempt.
   *
   * Sets solutionRevealed = true. If the attempt is still STARTED it is
   * immediately moved to INCORRECT because the player chose not to attempt
   * it honestly. If the attempt has already been SUBMITTED it keeps its
   * status unchanged (the status was already set during submission).
   *
   * Either way, the score is zeroed out.
   */
  async revealSolution(dto: RevealSolutionDto): Promise<ChallengeAttempt> {
    const attempt = await this.findAttemptOrFail(dto.attemptId);

    if (TERMINAL_STATES.has(attempt.status)) {
      throw new BadRequestException(
        `Cannot reveal solution for an attempt that is already ${attempt.status}`,
      );
    }

    attempt.solutionRevealed = true;
    attempt.score = 0;

    if (attempt.status === AttemptStatus.STARTED) {
      attempt.status = AttemptStatus.INCORRECT;
      attempt.submittedAt = new Date();
    }

    return this.attemptRepository.save(attempt);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Expiry
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Marks an attempt as EXPIRED (e.g. when the time limit elapses).
   *
   * Can only transition from STARTED or SUBMITTED states.
   */
  async expireAttempt(attemptId: string): Promise<ChallengeAttempt> {
    const attempt = await this.findAttemptOrFail(attemptId);
    this.assertMutable(attempt);

    attempt.status = AttemptStatus.EXPIRED;
    attempt.submittedAt = attempt.submittedAt ?? new Date();
    return this.attemptRepository.save(attempt);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns a single attempt by ID.
   */
  async findById(attemptId: string): Promise<ChallengeAttempt> {
    return this.findAttemptOrFail(attemptId);
  }

  /**
   * Returns all attempts for a given user, ordered newest-first.
   */
  async findByUser(userId: string): Promise<ChallengeAttempt[]> {
    return this.attemptRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Returns all attempts belonging to a specific session.
   */
  async findBySession(sessionId: string): Promise<ChallengeAttempt[]> {
    return this.attemptRepository.find({
      where: { sessionId },
      order: { startedAt: 'ASC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Retrieves an attempt by ID and throws NotFoundException if missing.
   */
  async findAttemptOrFail(attemptId: string): Promise<ChallengeAttempt> {
    const attempt = await this.attemptRepository.findOneBy({ id: attemptId });
    if (!attempt) {
      throw new NotFoundException(
        `Attempt with ID ${attemptId} not found`,
      );
    }
    return attempt;
  }

  /**
   * Throws BadRequestException if the attempt is in a terminal state.
   */
  private assertMutable(attempt: ChallengeAttempt): void {
    if (TERMINAL_STATES.has(attempt.status)) {
      throw new BadRequestException(
        `Attempt ${attempt.id} is already in terminal state ${attempt.status} and cannot be modified`,
      );
    }
  }
}
