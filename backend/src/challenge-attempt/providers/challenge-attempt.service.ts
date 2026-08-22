import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { ChallengeAttempt } from '../entities/challenge-attempt.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { UserProgress } from '../../progress/entities/progress.entity';
import { GameSession } from '../../game-sessions/entities/game-session.entity';
import { XpLevelService } from '../../users/providers/xp-level.service';
import { AttemptStatus } from '../enums/attempt-status.enum';
import { CreateChallengeAttemptDto } from '../dtos/create-challenge-attempt.dto';
import { SubmitAttemptDto } from '../dtos/submit-attempt.dto';
import { RevealSolutionDto } from '../dtos/reveal-solution.dto';
import { UseHintDto } from '../dtos/use-hint.dto';
import {
  PuzzleSummaryDto,
  SubmitAttemptResponseDto,
} from '../dtos/submit-attempt-response.dto';
import { ChallengeValidationService } from './challenge-validation.service';

/** Terminal states where no further mutations are allowed. */
const TERMINAL_STATES = new Set<AttemptStatus>([
  AttemptStatus.CORRECT,
  AttemptStatus.INCORRECT,
  AttemptStatus.EXPIRED,
]);

/** Terminal states that represent a graded (submitted) answer, for session-progress counting. */
const GRADED_STATES = [AttemptStatus.CORRECT, AttemptStatus.INCORRECT];

/** Matches a UUID (any RFC 4122 version) — used to guard queries against the uuid-typed GameSession.id column. */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ChallengeAttemptService {
  /**
   * Fallback session-length target, used only when `attempt.sessionId`
   * doesn't resolve to a real `GameSession` row (e.g. legacy callers that
   * mint their own sessionId without creating one via `POST
   * /game-sessions` — see `useCreateGameSession.ts` on the frontend).
   * When a real `GameSession` exists, its `challengeCount` is the actual
   * target instead — that's the authoritative source of truth for session
   * length now that `GameSessionsModule` owns session lifecycle end to end.
   */
  private readonly DEFAULT_SESSION_LENGTH = 5;

  constructor(
    @InjectRepository(ChallengeAttempt)
    private readonly attemptRepository: Repository<ChallengeAttempt>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    private readonly challengeValidationService: ChallengeValidationService,
    private readonly xpLevelService: XpLevelService,
    private readonly dataSource: DataSource,
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
    userId: string,
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
      userId,
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
   * Submits an answer for an existing attempt and runs the full
   * post-submission pipeline: validate → persist → update progress →
   * calculate score/XP → select next challenge → detect session completion.
   *
   * Idempotent: a repeat submit on an attempt that's already terminal
   * (CORRECT/INCORRECT/EXPIRED) does not re-grade, re-award XP, or
   * re-select a next challenge — it returns the originally-persisted result
   * with `isDuplicateReplay: true`. A pessimistic write lock on the attempt
   * row also prevents two concurrent first-time submits from double-awarding.
   */
  async submitAttempt(
    dto: SubmitAttemptDto,
    userId: string,
  ): Promise<SubmitAttemptResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const attempt = await manager.findOne(ChallengeAttempt, {
        where: { id: dto.attemptId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!attempt) {
        throw new NotFoundException(
          `Attempt with ID ${dto.attemptId} not found`,
        );
      }

      if (attempt.userId !== userId) {
        throw new ForbiddenException(
          'This attempt does not belong to the authenticated user',
        );
      }

      // Idempotent replay: duplicate submissions never re-run the pipeline.
      if (TERMINAL_STATES.has(attempt.status)) {
        return this.buildReplayResponse(manager, attempt);
      }

      const puzzle = await manager.findOne(Puzzle, {
        where: { id: attempt.challengeId },
      });
      if (!puzzle) {
        throw new NotFoundException(
          `Challenge with ID ${attempt.challengeId} not found`,
        );
      }

      // Step 1 — validate.
      const isCorrect = this.challengeValidationService.validateAnswer(
        dto.answer,
        puzzle.correctAnswer,
      );

      // Step 2 — persist the attempt.
      attempt.answer = dto.answer;
      attempt.timeSpent = dto.timeSpent;
      attempt.submittedAt = new Date();

      if (attempt.solutionRevealed) {
        attempt.status = AttemptStatus.INCORRECT;
        attempt.score = 0;
      } else if (isCorrect) {
        attempt.status = AttemptStatus.CORRECT;
        attempt.score = this.challengeValidationService.calculateScore(
          puzzle.points,
          dto.timeSpent,
          puzzle.timeLimit,
        );
      } else {
        attempt.status = AttemptStatus.INCORRECT;
        attempt.score = 0;
      }

      const graded = attempt.status === AttemptStatus.CORRECT;

      // Step 5 — calculate + award XP (only for genuinely correct, non-revealed answers).
      let xpResult: {
        awarded: number;
        levelUp: boolean;
        currentLevel: number;
        currentXp: number;
      } | null = null;

      if (graded) {
        const xp = await this.xpLevelService.addXp(userId, attempt.score);
        xpResult = {
          awarded: attempt.score,
          levelUp: xp.levelUp,
          currentLevel: xp.currentLevel,
          currentXp: xp.currentXp,
        };
        attempt.xpAwarded = attempt.score;
      } else {
        attempt.xpAwarded = 0;
      }

      // Step 3 — update progress: one UserProgress row per graded submission.
      const progressRow = manager.create(UserProgress, {
        userId,
        puzzleId: attempt.challengeId,
        categoryId: puzzle.categoryId,
        isCorrect,
        userAnswer: dto.answer,
        pointsEarned: attempt.score,
        timeSpent: dto.timeSpent,
        attemptedAt: new Date(),
      });
      await manager.save(UserProgress, progressRow);

      // Step 6 — select the next challenge.
      let attemptsInSession = 1;
      let nextPuzzle: Puzzle | null = null;
      let sessionTarget = this.DEFAULT_SESSION_LENGTH;

      if (attempt.sessionId) {
        sessionTarget = await this.resolveSessionTarget(
          manager,
          attempt.sessionId,
        );

        attemptsInSession = await manager.count(ChallengeAttempt, {
          where: {
            userId,
            sessionId: attempt.sessionId,
            status: In(GRADED_STATES),
          },
        });

        const sessionTargetReached = attemptsInSession >= sessionTarget;

        if (!sessionTargetReached) {
          const attemptedInSession = await manager.find(ChallengeAttempt, {
            where: { userId, sessionId: attempt.sessionId },
            select: ['challengeId'],
          });
          const excludeIds = Array.from(
            new Set([
              ...attemptedInSession.map((a) => a.challengeId),
              attempt.challengeId,
            ]),
          );
          nextPuzzle = await this.selectNextChallenge(
            manager,
            puzzle,
            excludeIds,
          );
        }

        // Step 7 — detect session completion: target reached, or the
        // challenge pool for this difficulty is exhausted.
        attempt.sessionCompleted = sessionTargetReached || nextPuzzle === null;
      } else {
        // No session grouping was ever set on this attempt (e.g. the client
        // called the API directly without going through session creation).
        // There is no session to complete; still surface a next challenge
        // of the same difficulty with no exclusion.
        nextPuzzle = await this.selectNextChallenge(manager, puzzle, [
          attempt.challengeId,
        ]);
        attempt.sessionCompleted = false;
      }

      attempt.nextChallengeId = nextPuzzle?.id;

      await manager.save(ChallengeAttempt, attempt);

      return {
        attempt,
        isCorrect: graded,
        feedback: graded
          ? 'Correct!'
          : attempt.solutionRevealed
            ? 'Solution was revealed — no score awarded.'
            : 'Not quite — try the next one.',
        xp: xpResult,
        progress: {
          attemptsInSession,
          sessionTarget,
          sessionCompleted: attempt.sessionCompleted,
        },
        nextChallenge: this.toPuzzleSummary(nextPuzzle),
        isDuplicateReplay: false,
      };
    });
  }

  /**
   * Resolves how many graded attempts complete this session: the real
   * `GameSession.challengeCount` when `sessionId` refers to an actual
   * session row, or `DEFAULT_SESSION_LENGTH` as a fallback for callers that
   * mint their own sessionId without creating one via `POST /game-sessions`.
   *
   * `ChallengeAttempt.sessionId` is a free-text varchar (no format
   * enforcement), but `GameSession.id` is a `uuid` column — querying it with
   * a non-UUID string would throw at the driver level, so the format is
   * checked first rather than relying on the query to just return nothing.
   */
  private async resolveSessionTarget(
    manager: EntityManager,
    sessionId: string,
  ): Promise<number> {
    if (!UUID_V4_REGEX.test(sessionId)) {
      return this.DEFAULT_SESSION_LENGTH;
    }
    const gameSession = await manager.findOne(GameSession, {
      where: { id: sessionId },
    });
    return gameSession?.challengeCount || this.DEFAULT_SESSION_LENGTH;
  }

  /**
   * Reconstructs the response for a duplicate/replayed submit from the
   * already-persisted attempt fields, without re-running any of the
   * scoring/XP/progress/next-challenge steps.
   */
  private async buildReplayResponse(
    manager: EntityManager,
    attempt: ChallengeAttempt,
  ): Promise<SubmitAttemptResponseDto> {
    const nextPuzzle = attempt.nextChallengeId
      ? await manager.findOne(Puzzle, {
          where: { id: attempt.nextChallengeId },
        })
      : null;

    let attemptsInSession = 1;
    let sessionTarget = this.DEFAULT_SESSION_LENGTH;
    if (attempt.sessionId) {
      sessionTarget = await this.resolveSessionTarget(
        manager,
        attempt.sessionId,
      );
      attemptsInSession = await manager.count(ChallengeAttempt, {
        where: {
          userId: attempt.userId,
          sessionId: attempt.sessionId,
          status: In(GRADED_STATES),
        },
      });
    }

    const graded = attempt.status === AttemptStatus.CORRECT;

    return {
      attempt,
      isCorrect: graded,
      feedback: graded
        ? 'Correct!'
        : attempt.solutionRevealed
          ? 'Solution was revealed — no score awarded.'
          : 'Not quite — try the next one.',
      xp:
        attempt.xpAwarded && attempt.xpAwarded > 0
          ? {
              awarded: attempt.xpAwarded,
              levelUp: false,
              currentLevel: 0,
              currentXp: 0,
            }
          : null,
      progress: {
        attemptsInSession,
        sessionTarget,
        sessionCompleted: attempt.sessionCompleted,
      },
      nextChallenge: this.toPuzzleSummary(nextPuzzle),
      isDuplicateReplay: true,
    };
  }

  /**
   * Picks a pseudo-random puzzle of the same difficulty as `currentPuzzle`,
   * excluding `excludeIds`. Returns null if none remain. Uses an in-memory
   * Fisher-Yates shuffle for randomization, mirroring the existing pattern
   * in `PuzzlesService.getDailyQuestPuzzles`.
   */
  private async selectNextChallenge(
    manager: EntityManager,
    currentPuzzle: Puzzle,
    excludeIds: string[],
  ): Promise<Puzzle | null> {
    const candidates = await manager.find(Puzzle, {
      where: {
        difficulty: currentPuzzle.difficulty,
        id: Not(In(excludeIds)),
      },
    });

    if (candidates.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  private toPuzzleSummary(puzzle: Puzzle | null): PuzzleSummaryDto | null {
    if (!puzzle) {
      return null;
    }
    return {
      id: puzzle.id,
      question: puzzle.question,
      options: puzzle.options,
      difficulty: puzzle.difficulty,
      points: puzzle.points,
      timeLimit: puzzle.timeLimit,
      categoryId: puzzle.categoryId,
    };
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
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
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
