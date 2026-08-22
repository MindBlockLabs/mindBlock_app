import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  GameSessionsService,
  SESSION_TRANSITIONS,
} from './game-sessions.service';
import { GameSession } from '../entities/game-session.entity';
import { GameSessionStatus } from '../enums/game-session-status.enum';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';
import { CreateGameSessionDto } from '../dtos/create-game-session.dto';
import { UpdateGameSessionStatusDto } from '../dtos/update-game-session-status.dto';
import { SessionSummaryProvider } from './session-summary.provider';
import { SessionCompletionStats } from '../interfaces/game-session.interface';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 'session-uuid-1',
    userId: 'user-uuid-1',
    guestId: null,
    user: null as any,
    status: GameSessionStatus.CREATED,
    difficulty: PuzzleDifficulty.BEGINNER,
    selectedCategories: ['coding'],
    challengeCount: 5,
    currentChallenge: 0,
    score: 0,
    xpEarned: 0,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-08-01T10:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
    accuracy: null,
    timeSpentSeconds: null,
    categoryPerformance: null,
    previousStreak: null,
    currentStreak: null,
    rewardEligible: null,
    rewardReason: null,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

/** Default stats stub: no tracked attempts, so completion falls back to
 *  client-supplied score/xp — matches the pre-existing test fixtures below,
 *  which don't set up any ChallengeAttempt records. */
function makeStatsStub(
  overrides: Partial<SessionCompletionStats> = {},
): SessionCompletionStats {
  return {
    totalScore: 0,
    xpEarned: 0,
    challengesCompleted: 0,
    accuracy: 0,
    timeSpentSeconds: 0,
    categoryPerformance: [],
    previousStreak: null,
    currentStreak: null,
    rewardEligible: null,
    rewardReason: null,
    ...overrides,
  };
}

describe('GameSessionsService', () => {
  let service: GameSessionsService;
  let repo: jest.Mocked<Repository<GameSession>>;
  let summaryProvider: jest.Mocked<SessionSummaryProvider>;
  let idempotencyService: { execute: jest.Mock<any> };

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<Repository<GameSession>>> = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockSummaryProvider: Partial<
      jest.Mocked<SessionSummaryProvider>
    > = {
      buildCompletionStats: jest.fn().mockResolvedValue(makeStatsStub()),
    };

    const mockIdempotencyService = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameSessionsService,
        {
          provide: getRepositoryToken(GameSession),
          useValue: mockRepo,
        },
        {
          provide: SessionSummaryProvider,
          useValue: mockSummaryProvider,
        },
        {
          provide: IdempotencyService,
          useValue: mockIdempotencyService,
        },
      ],
    }).compile();

    service = module.get<GameSessionsService>(GameSessionsService);
    repo = module.get(getRepositoryToken(GameSession));
    summaryProvider = module.get(SessionSummaryProvider);
    idempotencyService = module.get(IdempotencyService);
  });

  afterEach(() => jest.clearAllMocks());

  // ───────────────────────────────────────────────────────────────────────────
  // SESSION_TRANSITIONS export
  // ───────────────────────────────────────────────────────────────────────────

  describe('SESSION_TRANSITIONS', () => {
    it('allows CREATED → ACTIVE only', () => {
      expect(SESSION_TRANSITIONS[GameSessionStatus.CREATED]).toEqual([
        GameSessionStatus.ACTIVE,
      ]);
    });

    it('allows ACTIVE → PAUSED, COMPLETED, ABANDONED, EXPIRED', () => {
      expect(SESSION_TRANSITIONS[GameSessionStatus.ACTIVE]).toContain(
        GameSessionStatus.PAUSED,
      );
      expect(SESSION_TRANSITIONS[GameSessionStatus.ACTIVE]).toContain(
        GameSessionStatus.COMPLETED,
      );
      expect(SESSION_TRANSITIONS[GameSessionStatus.ACTIVE]).toContain(
        GameSessionStatus.ABANDONED,
      );
      expect(SESSION_TRANSITIONS[GameSessionStatus.ACTIVE]).toContain(
        GameSessionStatus.EXPIRED,
      );
    });

    it('allows PAUSED → ACTIVE, ABANDONED, EXPIRED', () => {
      expect(SESSION_TRANSITIONS[GameSessionStatus.PAUSED]).toContain(
        GameSessionStatus.ACTIVE,
      );
      expect(SESSION_TRANSITIONS[GameSessionStatus.PAUSED]).toContain(
        GameSessionStatus.ABANDONED,
      );
      expect(SESSION_TRANSITIONS[GameSessionStatus.PAUSED]).toContain(
        GameSessionStatus.EXPIRED,
      );
    });

    it('has no transitions from COMPLETED, EXPIRED, ABANDONED', () => {
      expect(SESSION_TRANSITIONS[GameSessionStatus.COMPLETED]).toHaveLength(0);
      expect(SESSION_TRANSITIONS[GameSessionStatus.EXPIRED]).toHaveLength(0);
      expect(SESSION_TRANSITIONS[GameSessionStatus.ABANDONED]).toHaveLength(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // create()
  // ───────────────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto: CreateGameSessionDto = {
      challengeCount: 5,
      difficulty: PuzzleDifficulty.INTERMEDIATE,
      selectedCategories: ['logic'],
    };
    const userId = 'user-uuid-1';

    it('creates and saves a new session for an authenticated user', async () => {
      const built = makeSession({ status: GameSessionStatus.CREATED });
      repo.create.mockReturnValue(built);
      repo.save.mockResolvedValue(built);

      const result = await service.create(dto, userId);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          status: GameSessionStatus.CREATED,
          challengeCount: 5,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(built);
      expect(result).toBe(built);
    });

    it('creates a guest session when userId is null and guestId is supplied', async () => {
      const guestDto = { ...dto, guestId: 'guest-abc' };
      const built = makeSession({ userId: null, guestId: 'guest-abc' });
      repo.create.mockReturnValue(built);
      repo.save.mockResolvedValue(built);

      const result = await service.create(guestDto, null);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null, guestId: 'guest-abc' }),
      );
      expect(result.guestId).toBe('guest-abc');
    });

    it('throws BadRequestException when neither userId nor guestId is provided', async () => {
      await expect(service.create(dto, null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findAllByUser()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findAllByUser()', () => {
    it('returns all sessions for the user ordered by createdAt DESC', async () => {
      const sessions = [makeSession(), makeSession({ id: 'session-uuid-2' })];
      repo.find.mockResolvedValue(sessions);

      const result = await service.findAllByUser('user-uuid-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findActiveSession()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findActiveSession()', () => {
    it('returns the active session if one exists', async () => {
      const active = makeSession({ status: GameSessionStatus.ACTIVE });
      repo.findOneBy.mockResolvedValue(active);

      const result = await service.findActiveSession('user-uuid-1');

      expect(repo.findOneBy).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        status: GameSessionStatus.ACTIVE,
      });
      expect(result?.status).toBe(GameSessionStatus.ACTIVE);
    });

    it('returns null if no active session exists', async () => {
      repo.findOneBy.mockResolvedValue(null);
      const result = await service.findActiveSession('user-uuid-1');
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findById()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns the session when found', async () => {
      const session = makeSession();
      repo.findOneBy.mockResolvedValue(session);

      const result = await service.findById('session-uuid-1');

      expect(result).toBe(session);
    });

    it('throws NotFoundException when session does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // findAndVerifyOwnership()
  // ───────────────────────────────────────────────────────────────────────────

  describe('findAndVerifyOwnership()', () => {
    it('returns the session when the user is the owner', async () => {
      const session = makeSession({ userId: 'user-uuid-1' });
      repo.findOneBy.mockResolvedValue(session);

      const result = await service.findAndVerifyOwnership(
        'session-uuid-1',
        'user-uuid-1',
      );
      expect(result).toBe(session);
    });

    it('returns the session when the guest is the owner', async () => {
      const session = makeSession({ userId: null, guestId: 'guest-abc' });
      repo.findOneBy.mockResolvedValue(session);

      const result = await service.findAndVerifyOwnership(
        'session-uuid-1',
        null,
        'guest-abc',
      );
      expect(result).toBe(session);
    });

    it('throws ForbiddenException when the user does not own the session', async () => {
      const session = makeSession({ userId: 'user-uuid-1' });
      repo.findOneBy.mockResolvedValue(session);

      await expect(
        service.findAndVerifyOwnership('session-uuid-1', 'different-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when neither userId nor guestId matches', async () => {
      const session = makeSession({ userId: 'user-uuid-1', guestId: null });
      repo.findOneBy.mockResolvedValue(session);

      await expect(
        service.findAndVerifyOwnership('session-uuid-1', null, 'wrong-guest'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // updateStatus()
  // ───────────────────────────────────────────────────────────────────────────

  describe('updateStatus()', () => {
    const userId = 'user-uuid-1';

    it('transitions CREATED → ACTIVE and stamps startedAt', async () => {
      const session = makeSession({ status: GameSessionStatus.CREATED });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.ACTIVE,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(result.status).toBe(GameSessionStatus.ACTIVE);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.completedAt).toBeNull();
    });

    it('transitions ACTIVE → PAUSED', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.PAUSED,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(result.status).toBe(GameSessionStatus.PAUSED);
    });

    it('transitions ACTIVE → COMPLETED, stamps completedAt and falls back to client score/xp when no attempts are tracked', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);
      summaryProvider.buildCompletionStats.mockResolvedValue(
        makeStatsStub({ challengesCompleted: 0 }),
      );

      // Idempotency mock: call the fn (first request)
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<GameSession>) => {
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.COMPLETED,
        score: 900,
        xpEarned: 200,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(result.status).toBe(GameSessionStatus.COMPLETED);
      expect(result.score).toBe(900);
      expect(result.xpEarned).toBe(200);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(idempotencyService.execute).toHaveBeenCalledWith(
        'session-complete:session-uuid-1',
        expect.any(Function),
      );
    });

    it('ignores client-supplied score/xp and uses server-calculated stats when attempts are tracked', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);
      summaryProvider.buildCompletionStats.mockResolvedValue(
        makeStatsStub({
          totalScore: 640,
          xpEarned: 640,
          challengesCompleted: 5,
          accuracy: 80,
          timeSpentSeconds: 210,
          categoryPerformance: [
            {
              categoryId: 'cat-1',
              categoryName: 'Logic',
              correct: 4,
              total: 5,
              accuracy: 80,
            },
          ],
          previousStreak: 3,
          currentStreak: 4,
          rewardEligible: true,
          rewardReason: 'Player meets reward eligibility requirements',
        }),
      );

      // Idempotency mock: call the fn (first request)
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<GameSession>) => {
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.COMPLETED,
        // A malicious/stale client value that must be ignored.
        score: 999999,
        xpEarned: 999999,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(summaryProvider.buildCompletionStats).toHaveBeenCalledWith(
        'session-uuid-1',
        session.userId,
        undefined,
      );
      expect(result.score).toBe(640);
      expect(result.xpEarned).toBe(640);
      expect(result.accuracy).toBe(80);
      expect(result.timeSpentSeconds).toBe(210);
      expect(result.categoryPerformance).toHaveLength(1);
      expect(result.previousStreak).toBe(3);
      expect(result.currentStreak).toBe(4);
      expect(result.rewardEligible).toBe(true);
    });

    it('transitions ACTIVE → ABANDONED and stamps completedAt', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.ABANDONED,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(result.status).toBe(GameSessionStatus.ABANDONED);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('throws BadRequestException for an invalid transition (CREATED → COMPLETED)', async () => {
      const session = makeSession({ status: GameSessionStatus.CREATED });
      repo.findOneBy.mockResolvedValue(session);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.COMPLETED,
      };
      await expect(
        service.updateStatus('session-uuid-1', dto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when session is in a terminal state', async () => {
      const session = makeSession({ status: GameSessionStatus.COMPLETED });
      repo.findOneBy.mockResolvedValue(session);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.ACTIVE,
      };
      await expect(
        service.updateStatus('session-uuid-1', dto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not stamp startedAt again when re-activating a paused session', async () => {
      const originalStartedAt = new Date('2026-01-01T09:00:00Z');
      const session = makeSession({
        status: GameSessionStatus.PAUSED,
        startedAt: originalStartedAt,
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.ACTIVE,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(result.startedAt).toBe(originalStartedAt);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // completeSession()
  // ───────────────────────────────────────────────────────────────────────────

  describe('completeSession()', () => {
    it('delegates to updateStatus with COMPLETED status and supplied score/xp as fallback', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);
      summaryProvider.buildCompletionStats.mockResolvedValue(
        makeStatsStub({ challengesCompleted: 0 }),
      );

      // Idempotency mock: call the fn (first request)
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<GameSession>) => {
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      const result = await service.completeSession(
        'session-uuid-1',
        500,
        80,
        'user-uuid-1',
      );

      expect(result.status).toBe(GameSessionStatus.COMPLETED);
      expect(result.score).toBe(500);
      expect(result.xpEarned).toBe(80);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // expireIdleSessions()
  // ───────────────────────────────────────────────────────────────────────────

  describe('expireIdleSessions()', () => {
    it('expires stale ACTIVE / PAUSED sessions and returns count', async () => {
      const staleSessions = [
        makeSession({ status: GameSessionStatus.ACTIVE }),
        makeSession({
          id: 'session-uuid-2',
          status: GameSessionStatus.PAUSED,
        }),
      ];

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(staleSessions),
      } as unknown as SelectQueryBuilder<GameSession>;

      repo.createQueryBuilder.mockReturnValue(qb);
      repo.save.mockImplementation(async (s) => s as unknown as GameSession);

      const count = await service.expireIdleSessions(30);

      expect(count).toBe(2);
      expect(staleSessions[0].status).toBe(GameSessionStatus.EXPIRED);
      expect(staleSessions[1].status).toBe(GameSessionStatus.EXPIRED);
      expect(staleSessions[0].completedAt).toBeInstanceOf(Date);
    });

    it('returns 0 when no stale sessions are found', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as unknown as SelectQueryBuilder<GameSession>;

      repo.createQueryBuilder.mockReturnValue(qb);

      const count = await service.expireIdleSessions(30);
      expect(count).toBe(0);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Idempotency — session completion
  // ───────────────────────────────────────────────────────────────────────────

  describe('session completion idempotency', () => {
    const userId = 'user-uuid-1';

    it('should return cached result for a duplicate COMPLETED request', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);

      const completedSession = makeSession({
        status: GameSessionStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        score: 500,
        xpEarned: 500,
        accuracy: 80,
        rewardEligible: true,
        rewardReason: 'Player meets reward eligibility requirements',
      });

      // Simulate a cached result from a prior in-flight request
      idempotencyService.execute!.mockResolvedValue({
        duplicate: true,
        data: completedSession,
      });

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.COMPLETED,
      };
      const result = await service.updateStatus(
        'session-uuid-1',
        dto,
        userId,
      );

      expect(result).toBe(completedSession);
      expect(result.status).toBe(GameSessionStatus.COMPLETED);
      expect(result.score).toBe(500);

      // summaryProvider should NOT have been called — the cached result is returned directly
      expect(summaryProvider.buildCompletionStats).not.toHaveBeenCalled();
    });

    it('should use session-complete:{id} as the idempotency key', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);
      summaryProvider.buildCompletionStats.mockResolvedValue(makeStatsStub());

      // Idempotency mock: call the fn (first request)
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<GameSession>) => {
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.COMPLETED,
      };
      await service.updateStatus('session-uuid-1', dto, userId);

      expect(idempotencyService.execute).toHaveBeenCalledWith(
        'session-complete:session-uuid-1',
        expect.any(Function),
      );
    });

    it('should not use idempotency for non-COMPLETED transitions', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);
      repo.save.mockImplementation(async (s) => s as GameSession);

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.PAUSED,
      };
      const result = await service.updateStatus('session-uuid-1', dto, userId);

      // Idempotency should NOT be invoked for PAUSED transitions
      expect(idempotencyService.execute).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.status).toBe(GameSessionStatus.PAUSED);
    });

    it('should prevent double XP awards on duplicate COMPLETED requests', async () => {
      const session = makeSession({
        status: GameSessionStatus.ACTIVE,
        startedAt: new Date(),
      });
      repo.findOneBy.mockResolvedValue(session);

      const completedSession = makeSession({
        status: GameSessionStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        score: 300,
        xpEarned: 300,
        rewardEligible: true,
        rewardReason: 'Eligible',
      });

      idempotencyService.execute!.mockResolvedValue({
        duplicate: true,
        data: completedSession,
      });

      const dto: UpdateGameSessionStatusDto = {
        status: GameSessionStatus.COMPLETED,
      };

      const result1 = await service.updateStatus('session-uuid-1', dto, userId);
      const result2 = await service.updateStatus('session-uuid-1', dto, userId);

      expect(result1).toBe(completedSession);
      expect(result2).toBe(completedSession);
      expect(result1.score).toBe(300);

      // summaryProvider should not have been called at all — cached result returned
      expect(summaryProvider.buildCompletionStats).not.toHaveBeenCalled();
    });
  });
});
