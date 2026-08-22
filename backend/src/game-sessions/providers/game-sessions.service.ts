import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from '../entities/game-session.entity';
import { GameSessionStatus } from '../enums/game-session-status.enum';
import { CreateGameSessionDto } from '../dtos/create-game-session.dto';
import { UpdateGameSessionStatusDto } from '../dtos/update-game-session-status.dto';
import { SessionTransitionMap } from '../interfaces/game-session.interface';
import { SessionSummaryProvider } from './session-summary.provider';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

/**
 * Valid state transitions for a GameSession.
 *
 * CREATED  → ACTIVE
 * ACTIVE   → PAUSED | COMPLETED | ABANDONED | EXPIRED
 * PAUSED   → ACTIVE | ABANDONED | EXPIRED
 * COMPLETED, EXPIRED, ABANDONED are terminal – no further transitions allowed.
 */
export const SESSION_TRANSITIONS: SessionTransitionMap = {
  [GameSessionStatus.CREATED]: [GameSessionStatus.ACTIVE],
  [GameSessionStatus.ACTIVE]: [
    GameSessionStatus.PAUSED,
    GameSessionStatus.COMPLETED,
    GameSessionStatus.ABANDONED,
    GameSessionStatus.EXPIRED,
  ],
  [GameSessionStatus.PAUSED]: [
    GameSessionStatus.ACTIVE,
    GameSessionStatus.ABANDONED,
    GameSessionStatus.EXPIRED,
  ],
  [GameSessionStatus.COMPLETED]: [],
  [GameSessionStatus.EXPIRED]: [],
  [GameSessionStatus.ABANDONED]: [],
};

/** Terminal states – no mutations are allowed once reached. */
const TERMINAL_STATES = new Set<GameSessionStatus>([
  GameSessionStatus.COMPLETED,
  GameSessionStatus.EXPIRED,
  GameSessionStatus.ABANDONED,
]);

@Injectable()
export class GameSessionsService {
  private readonly logger = new Logger(GameSessionsService.name);

  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepository: Repository<GameSession>,
    private readonly sessionSummaryProvider: SessionSummaryProvider,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Creation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Creates a new game session in CREATED state.
   *
   * @param dto      Creation parameters (difficulty, categories, challenge count, …)
   * @param userId   Authenticated user ID, or null for guest sessions.
   */
  async create(
    dto: CreateGameSessionDto,
    userId: string | null,
  ): Promise<GameSession> {
    if (!userId && !dto.guestId) {
      throw new BadRequestException(
        'Either an authenticated user or a guestId is required to create a session.',
      );
    }

    const session = this.sessionRepository.create({
      userId: userId ?? null,
      guestId: dto.guestId ?? null,
      status: GameSessionStatus.CREATED,
      difficulty: dto.difficulty ?? null,
      selectedCategories: dto.selectedCategories ?? null,
      challengeCount: dto.challengeCount,
      currentChallenge: 0,
      score: 0,
      xpEarned: 0,
      startedAt: null,
      completedAt: null,
    });

    return this.sessionRepository.save(session);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Retrieval
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns all sessions belonging to a user, ordered by most recent first.
   */
  async findAllByUser(userId: string): Promise<GameSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns the single active session for a user (if any).
   * A user may have only one ACTIVE session at a time.
   */
  async findActiveSession(userId: string): Promise<GameSession | null> {
    return this.sessionRepository.findOneBy({
      userId,
      status: GameSessionStatus.ACTIVE,
    });
  }

  /**
   * Returns a session by its ID. Throws 404 if not found.
   */
  async findById(id: string): Promise<GameSession> {
    const session = await this.sessionRepository.findOneBy({ id });
    if (!session) {
      throw new NotFoundException(`Game session with ID "${id}" not found.`);
    }
    return session;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Ownership Enforcement
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns a session after verifying the requesting user owns it.
   *
   * @param id     Session ID
   * @param userId The authenticated user's ID (or null for guest checks via guestId).
   * @param guestId Optional guest identifier.
   */
  async findAndVerifyOwnership(
    id: string,
    userId: string | null,
    guestId?: string,
  ): Promise<GameSession> {
    const session = await this.findById(id);

    const isOwner =
      (userId && session.userId === userId) ||
      (guestId && session.guestId === guestId);

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to access this game session.',
      );
    }

    return session;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Status / State Machine
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Transitions a session to the requested status.
   *
   * Rules:
   * - The caller must own the session.
   * - The transition must be valid according to SESSION_TRANSITIONS.
   * - Score and xpEarned are only persisted when moving to COMPLETED.
   * - startedAt is stamped when moving to ACTIVE (for the first time).
   * - completedAt is stamped when reaching a terminal state.
   *
   * @param id     Session ID
   * @param dto    Target status + optional completion payload
   * @param userId Requesting user's ID (null for guest)
   * @param guestId Guest identifier (if applicable)
   */
  async updateStatus(
    id: string,
    dto: UpdateGameSessionStatusDto,
    userId: string | null,
    guestId?: string,
  ): Promise<GameSession> {
    const session = await this.findAndVerifyOwnership(id, userId, guestId);

    this.assertValidTransition(session.status, dto.status);

    // Session completion is idempotent — the session ID is the key.
    // This prevents double-completion from race conditions, retries,
    // or browser refreshes, which would otherwise double-award XP,
    // streak updates, and reward eligibility.
    if (dto.status === GameSessionStatus.COMPLETED) {
      const { duplicate, data: completedSession } =
        await this.idempotencyService.execute<GameSession>(
          `session-complete:${id}`,
          () => this.processSessionCompletion(session, dto),
        );

      if (duplicate) {
        this.logger.log(
          `Duplicate completion detected for session ${id}. Returning cached result.`,
        );
      }

      return completedSession;
    }

    return this.processStatusUpdate(session, dto);
  }

  /**
   * Internal method that performs session completion logic.
   * Called inside an idempotency guard — only executes once per session ID.
   */
  private async processSessionCompletion(
    session: GameSession,
    dto: UpdateGameSessionStatusDto,
  ): Promise<GameSession> {
    session.completedAt = new Date();

    const stats = await this.sessionSummaryProvider.buildCompletionStats(
      session.id,
      session.userId,
      dto.userTimezone,
    );

    // Statistics are calculated server-side from persisted challenge
    // attempts. Client-supplied score/xpEarned are only used as a
    // fallback when the session has no tracked attempts (e.g. legacy
    // or externally-managed sessions), so completion never regresses
    // to an unscored state.
    const hasTrackedAttempts = stats.challengesCompleted > 0;
    session.score = hasTrackedAttempts ? stats.totalScore : dto.score ?? 0;
    session.xpEarned = hasTrackedAttempts
      ? stats.xpEarned
      : dto.xpEarned ?? 0;
    session.accuracy = stats.accuracy;
    session.timeSpentSeconds = stats.timeSpentSeconds;
    session.categoryPerformance = stats.categoryPerformance;
    session.previousStreak = stats.previousStreak;
    session.currentStreak = stats.currentStreak;
    session.rewardEligible = stats.rewardEligible;
    session.rewardReason = stats.rewardReason;
    session.status = dto.status;

    return this.sessionRepository.save(session);
  }

  /**
   * Handles non-completion status updates (ACTIVE, PAUSED, ABANDONED, EXPIRED).
   */
  private async processStatusUpdate(
    session: GameSession,
    dto: UpdateGameSessionStatusDto,
  ): Promise<GameSession> {
    // Apply state-specific side-effects
    if (
      dto.status === GameSessionStatus.ACTIVE &&
      session.startedAt === null
    ) {
      session.startedAt = new Date();
    }

    if (TERMINAL_STATES.has(dto.status)) {
      session.completedAt = new Date();
    }

    session.status = dto.status;

    return this.sessionRepository.save(session);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Completion
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convenience method to mark a session as COMPLETED with a final score/XP.
   */
  async completeSession(
    id: string,
    score: number,
    xpEarned: number,
    userId: string | null,
  ): Promise<GameSession> {
    return this.updateStatus(
      id,
      { status: GameSessionStatus.COMPLETED, score, xpEarned },
      userId,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Session Expiration
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Marks all sessions that are in ACTIVE or PAUSED state and were last updated
   * more than `maxIdleMinutes` minutes ago as EXPIRED.
   *
   * This method is intended to be called by a scheduled job.
   *
   * @param maxIdleMinutes  Number of minutes of inactivity after which a session expires.
   * @returns Number of sessions that were expired.
   */
  async expireIdleSessions(maxIdleMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - maxIdleMinutes * 60 * 1_000);

    const staleSessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.status IN (:...statuses)', {
        statuses: [GameSessionStatus.ACTIVE, GameSessionStatus.PAUSED],
      })
      .andWhere('session.updated_at < :cutoff', { cutoff })
      .getMany();

    if (staleSessions.length === 0) return 0;

    const now = new Date();
    for (const session of staleSessions) {
      session.status = GameSessionStatus.EXPIRED;
      session.completedAt = now;
    }

    await this.sessionRepository.save(staleSessions);
    return staleSessions.length;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Asserts that a transition from `current` to `next` is valid.
   * Throws BadRequestException if the transition is not permitted.
   */
  private assertValidTransition(
    current: GameSessionStatus,
    next: GameSessionStatus,
  ): void {
    if (TERMINAL_STATES.has(current)) {
      throw new BadRequestException(
        `Session is in a terminal state (${current}) and cannot be transitioned.`,
      );
    }

    const allowed = SESSION_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} → ${next}. ` +
          `Allowed transitions from ${current}: [${allowed.join(', ')}].`,
      );
    }
  }
}
