import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ChallengeAttemptService } from './challenge-attempt.service';
import { ChallengeValidationService } from './challenge-validation.service';
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
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

/** Helper: builds a minimal Puzzle stub */
function makePuzzle(overrides?: Partial<Puzzle>): Puzzle {
  return {
    id: 'puzzle-uuid-1',
    question: 'What is 2+2?',
    options: ['1', '2', '3', '4'],
    correctAnswer: '4',
    points: 100,
    timeLimit: 60,
    difficulty: 'BEGINNER' as any,
    categoryId: 'cat-1',
    category: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    explanation: null as any,
    progressRecords: [],
    ...overrides,
  };
}

/** Helper: builds a minimal ChallengeAttempt stub */
function makeAttempt(overrides?: Partial<ChallengeAttempt>): ChallengeAttempt {
  return {
    id: 'attempt-uuid-1',
    userId: 'user-1',
    challengeId: 'puzzle-uuid-1',
    sessionId: undefined,
    answer: undefined,
    status: AttemptStatus.STARTED,
    score: 0,
    timeSpent: 0,
    hintsUsed: 0,
    solutionRevealed: false,
    startedAt: new Date('2026-01-01T10:00:00Z'),
    submittedAt: undefined,
    nextChallengeId: undefined,
    sessionCompleted: false,
    xpAwarded: undefined,
    user: null as any,
    challenge: null as any,
    ...overrides,
  };
}

/**
 * Builds a mock EntityManager whose findOne/save/create/count/find are
 * entity-class-aware, so a single manager can back the whole
 * `dataSource.transaction(cb => cb(manager))` flow used by submitAttempt.
 */
function makeMockManager(opts: {
  attempt: ChallengeAttempt;
  puzzle: Puzzle | null;
  nextPuzzleCandidates?: Puzzle[];
  attemptedInSession?: Pick<ChallengeAttempt, 'challengeId'>[];
  attemptsInSessionCount?: number;
  nextPuzzleById?: Record<string, Puzzle>;
}) {
  const {
    attempt,
    puzzle,
    nextPuzzleCandidates = [],
    attemptedInSession = [],
    attemptsInSessionCount = 1,
    nextPuzzleById = {},
  } = opts;

  // All manager methods are declared with an explicit Promise<T> return
  // (via Promise.resolve, no `async`) so jest's `mockResolvedValueOnce`
  // stays usable on them in individual tests, and with a `(...args: any[])`
  // signature so `.mock.calls[i][1]` etc. type-check regardless of which
  // positional args a given test cares about.

  const findOne = jest.fn((...args: any[]) => {
    const [entity, options] = args;
    if (entity === ChallengeAttempt) {
      return Promise.resolve(attempt);
    }
    if (entity === Puzzle) {
      if (options?.where?.id && nextPuzzleById[options.where.id]) {
        return Promise.resolve(nextPuzzleById[options.where.id]);
      }
      return Promise.resolve(puzzle);
    }
    return Promise.resolve(null);
  });

  const find = jest.fn((...args: any[]) => {
    const [entity] = args;
    if (entity === ChallengeAttempt) {
      return Promise.resolve(attemptedInSession);
    }
    if (entity === Puzzle) {
      return Promise.resolve(nextPuzzleCandidates);
    }
    return Promise.resolve([]);
  });

  const count = jest.fn(() => Promise.resolve(attemptsInSessionCount));

  // Second positional arg is the payload for both create/save; the entity
  // class (first arg) isn't needed by this mock. `create` mirrors the real
  // (synchronous) EntityManager.create; `save` mirrors the real (async) one.
  const create = jest.fn((...args: any[]) => args[1]);

  const save = jest.fn((...args: any[]) => Promise.resolve(args[1]));

  return { findOne, find, count, create, save };
}

describe('ChallengeAttemptService', () => {
  let service: ChallengeAttemptService;
  let attemptRepo: jest.Mocked<Repository<ChallengeAttempt>>;
  let puzzleRepo: jest.Mocked<Repository<Puzzle>>;
  let xpLevelService: jest.Mocked<Pick<XpLevelService, 'addXp'>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    const mockAttemptRepo: Partial<jest.Mocked<Repository<ChallengeAttempt>>> =
      {
        create: jest.fn() as unknown as jest.Mocked<
          Repository<ChallengeAttempt>
        >['create'],
        save: jest.fn() as unknown as jest.Mocked<
          Repository<ChallengeAttempt>
        >['save'],
        findOneBy: jest.fn(),
        find: jest.fn(),
        existsBy: jest.fn(),
      };

    const mockPuzzleRepo: Partial<jest.Mocked<Repository<Puzzle>>> = {
      existsBy: jest.fn(),
      findOneBy: jest.fn(),
    };

    xpLevelService = { addXp: jest.fn() };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeAttemptService,
        // Provided for real (not mocked): it's pure, deterministic, and
        // already has its own dedicated spec (challenge-validation.service.spec.ts).
        ChallengeValidationService,
        {
          provide: getRepositoryToken(ChallengeAttempt),
          useValue: mockAttemptRepo,
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepo,
        },
        {
          // Read-only lookup in resolveSessionTarget(); no test currently
          // exercises a real GameSession row, so a bare jest.fn() (always
          // undefined/never called) is enough — the mock EntityManager's
          // findOne() is what's actually consulted inside the transaction,
          // not this repository.
          provide: getRepositoryToken(GameSession),
          useValue: { findOneBy: jest.fn() },
        },
        { provide: XpLevelService, useValue: xpLevelService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ChallengeAttemptService>(ChallengeAttemptService);
    attemptRepo = module.get(getRepositoryToken(ChallengeAttempt));
    puzzleRepo = module.get(getRepositoryToken(Puzzle));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Basic instantiation
  // ─────────────────────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // createAttempt
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createAttempt', () => {
    const dto: CreateChallengeAttemptDto = {
      challengeId: 'puzzle-uuid-1',
      sessionId: 'session-abc',
    };
    const userId = 'user-1';

    it('should create and return a STARTED attempt for the authenticated user', async () => {
      const newAttempt = makeAttempt({ sessionId: dto.sessionId });
      puzzleRepo.existsBy.mockResolvedValue(true);
      attemptRepo.create.mockReturnValue(newAttempt);
      attemptRepo.save.mockResolvedValue(newAttempt);

      const result = await service.createAttempt(dto, userId);

      expect(puzzleRepo.existsBy).toHaveBeenCalledWith({
        id: dto.challengeId,
      });
      expect(attemptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          challengeId: dto.challengeId,
          sessionId: dto.sessionId,
          status: AttemptStatus.STARTED,
          score: 0,
          hintsUsed: 0,
          solutionRevealed: false,
        }),
      );
      expect(attemptRepo.save).toHaveBeenCalledWith(newAttempt);
      expect(result.status).toBe(AttemptStatus.STARTED);
    });

    it('should create an attempt without a sessionId when omitted', async () => {
      const noSessionDto: CreateChallengeAttemptDto = {
        challengeId: 'puzzle-uuid-1',
      };
      const newAttempt = makeAttempt({ sessionId: undefined });
      puzzleRepo.existsBy.mockResolvedValue(true);
      attemptRepo.create.mockReturnValue(newAttempt);
      attemptRepo.save.mockResolvedValue(newAttempt);

      const result = await service.createAttempt(noSessionDto, userId);
      expect(result.sessionId).toBeUndefined();
    });

    it('should throw NotFoundException when the challenge does not exist', async () => {
      puzzleRepo.existsBy.mockResolvedValue(false);

      await expect(service.createAttempt(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(attemptRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // submitAttempt — grading
  // ─────────────────────────────────────────────────────────────────────────────

  describe('submitAttempt — grading', () => {
    const dto: SubmitAttemptDto = {
      attemptId: 'attempt-uuid-1',
      answer: '4',
      timeSpent: 30,
    };
    const userId = 'user-1';

    it('should mark attempt CORRECT, award score, XP, and record progress for a correct answer', async () => {
      const attempt = makeAttempt({ sessionId: undefined });
      const puzzle = makePuzzle();
      const manager = makeMockManager({
        attempt,
        puzzle,
        nextPuzzleCandidates: [makePuzzle({ id: 'puzzle-uuid-2' })],
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 225,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto, userId);

      expect(result.isCorrect).toBe(true);
      expect(result.attempt.status).toBe(AttemptStatus.CORRECT);
      expect(result.attempt.score).toBeGreaterThan(0); // 100 * 1.25 = 125
      expect(result.attempt.submittedAt).toBeDefined();
      expect(xpLevelService.addXp).toHaveBeenCalledWith(
        userId,
        result.attempt.score,
      );
      expect(result.xp).toEqual(
        expect.objectContaining({ awarded: result.attempt.score }),
      );

      const progressSaveCall = manager.save.mock.calls.find(
        (call) => call[0] === UserProgress,
      );
      expect(progressSaveCall).toBeDefined();
      expect(progressSaveCall![1]).toEqual(
        expect.objectContaining({
          userId,
          puzzleId: attempt.challengeId,
          isCorrect: true,
          pointsEarned: result.attempt.score,
        }),
      );
    });

    it('should mark attempt INCORRECT, award 0 score, and skip XP for a wrong answer', async () => {
      const submitDto = { ...dto, answer: 'wrong' };
      const attempt = makeAttempt({ sessionId: undefined });
      const puzzle = makePuzzle();
      const manager = makeMockManager({ attempt, puzzle });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      const result = await service.submitAttempt(submitDto, userId);

      expect(result.isCorrect).toBe(false);
      expect(result.attempt.status).toBe(AttemptStatus.INCORRECT);
      expect(result.attempt.score).toBe(0);
      expect(result.feedback).toMatch(/not quite/i);
      expect(xpLevelService.addXp).not.toHaveBeenCalled();

      const progressSaveCall = manager.save.mock.calls.find(
        (call) => call[0] === UserProgress,
      );
      expect(progressSaveCall![1]).toEqual(
        expect.objectContaining({ isCorrect: false, pointsEarned: 0 }),
      );
    });

    it('should mark INCORRECT and zero score when solution was already revealed', async () => {
      const attempt = makeAttempt({
        solutionRevealed: true,
        sessionId: undefined,
      });
      const puzzle = makePuzzle();
      const manager = makeMockManager({ attempt, puzzle });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      const result = await service.submitAttempt(dto, userId);

      expect(result.attempt.status).toBe(AttemptStatus.INCORRECT);
      expect(result.attempt.score).toBe(0);
      expect(xpLevelService.addXp).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      const manager = makeMockManager({ attempt: null as any, puzzle: null });
      manager.findOne.mockResolvedValueOnce(null);
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      await expect(service.submitAttempt(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when the attempt belongs to a different user', async () => {
      const attempt = makeAttempt({ userId: 'someone-else' });
      const manager = makeMockManager({ attempt, puzzle: makePuzzle() });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      await expect(service.submitAttempt(dto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should replay (not error) a duplicate submission for an already-graded attempt', async () => {
      // Superseded behavior: this used to throw BadRequestException on any
      // second submit. It now returns the cached result idempotently
      // (isDuplicateReplay: true, HTTP 200) instead of erroring, so a
      // double-click or retried request doesn't need special client-side
      // error handling — see the "session progression" describe block below
      // for the full idempotent-replay contract (no re-award, no re-save).
      const attempt = makeAttempt({
        status: AttemptStatus.INCORRECT,
        answer: 'wrong',
        score: 0,
        sessionId: undefined,
      });
      const manager = makeMockManager({ attempt, puzzle: makePuzzle() });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      const result = await service.submitAttempt(
        { ...dto, answer: '4' },
        userId,
      );

      expect(result.isDuplicateReplay).toBe(true);
      expect(result.attempt.status).toBe(AttemptStatus.INCORRECT);
      expect(xpLevelService.addXp).not.toHaveBeenCalled();
      expect(
        manager.save.mock.calls.some((call) => call[0] === UserProgress),
      ).toBe(false);
    });

    it('should throw NotFoundException when the puzzle no longer exists', async () => {
      const attempt = makeAttempt({ sessionId: undefined });
      const manager = makeMockManager({ attempt, puzzle: null });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));

      await expect(service.submitAttempt(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should perform case-insensitive answer comparison', async () => {
      const dto2 = { ...dto, answer: 'FOUR' };
      const attempt = makeAttempt({ sessionId: undefined });
      const puzzle = makePuzzle({ correctAnswer: 'four' });
      const manager = makeMockManager({ attempt, puzzle });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto2, userId);
      expect(result.attempt.status).toBe(AttemptStatus.CORRECT);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // submitAttempt — session progression (next challenge, completion, idempotency)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('submitAttempt — session progression', () => {
    const dto: SubmitAttemptDto = {
      attemptId: 'attempt-uuid-1',
      answer: '4',
      timeSpent: 30,
    };
    const userId = 'user-1';

    it('excludes already-attempted-in-session and the current challenge from next-challenge selection', async () => {
      const attempt = makeAttempt({ sessionId: 'sess-1' });
      const puzzle = makePuzzle();
      const alreadyAttempted = [
        { challengeId: 'puzzle-uuid-1' },
        { challengeId: 'puzzle-uuid-old' },
      ];
      const manager = makeMockManager({
        attempt,
        puzzle,
        attemptedInSession: alreadyAttempted,
        attemptsInSessionCount: 2,
        nextPuzzleCandidates: [makePuzzle({ id: 'puzzle-uuid-3' })],
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto, userId);

      const puzzleFindCall = manager.find.mock.calls.find(
        (call) => call[0] === Puzzle,
      );
      expect(puzzleFindCall![1]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({ difficulty: puzzle.difficulty }),
        }),
      );
      // Not(In(excludeIds)) wraps the array; assert the underlying ids via the FindOperator's
      // internal (underscore-prefixed) properties, confirmed against the real typeorm package.
      const idOperator = puzzleFindCall![1].where.id;
      expect(idOperator._type).toBe('not');
      expect(idOperator._value._type).toBe('in');
      expect(idOperator._value._value).toEqual(
        expect.arrayContaining(['puzzle-uuid-1', 'puzzle-uuid-old']),
      );
      expect(result.nextChallenge?.id).toBe('puzzle-uuid-3');
    });

    it('marks session complete and returns no next challenge when the puzzle pool is exhausted', async () => {
      const attempt = makeAttempt({ sessionId: 'sess-1' });
      const puzzle = makePuzzle();
      const manager = makeMockManager({
        attempt,
        puzzle,
        attemptsInSessionCount: 2,
        nextPuzzleCandidates: [], // pool exhausted
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto, userId);

      expect(result.nextChallenge).toBeNull();
      expect(result.progress.sessionCompleted).toBe(true);
    });

    it('marks session complete when the session length target is reached, without querying for a next challenge', async () => {
      const attempt = makeAttempt({ sessionId: 'sess-1' });
      const puzzle = makePuzzle();
      const manager = makeMockManager({
        attempt,
        puzzle,
        attemptsInSessionCount: 5, // SESSION_LENGTH
        nextPuzzleCandidates: [makePuzzle({ id: 'puzzle-uuid-9' })],
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto, userId);

      expect(result.progress.sessionCompleted).toBe(true);
      expect(result.nextChallenge).toBeNull();
      expect(manager.find.mock.calls.some((call) => call[0] === Puzzle)).toBe(
        false,
      );
    });

    it('reports session not complete and returns a next challenge when below target with puzzles remaining', async () => {
      const attempt = makeAttempt({ sessionId: 'sess-1' });
      const puzzle = makePuzzle();
      const manager = makeMockManager({
        attempt,
        puzzle,
        attemptsInSessionCount: 2,
        nextPuzzleCandidates: [makePuzzle({ id: 'puzzle-uuid-4' })],
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto, userId);

      expect(result.progress.sessionCompleted).toBe(false);
      expect(result.progress.attemptsInSession).toBe(2);
      expect(result.nextChallenge).not.toBeNull();
    });

    it('returns a next challenge with no session-scoped exclusion and sessionCompleted=false for a sessionless attempt', async () => {
      const attempt = makeAttempt({ sessionId: undefined });
      const puzzle = makePuzzle();
      const manager = makeMockManager({
        attempt,
        puzzle,
        nextPuzzleCandidates: [makePuzzle({ id: 'puzzle-uuid-5' })],
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const result = await service.submitAttempt(dto, userId);

      expect(result.progress.sessionCompleted).toBe(false);
      expect(result.progress.attemptsInSession).toBe(1); // never queried, default
      expect(result.nextChallenge?.id).toBe('puzzle-uuid-5');
      // count() should not be called at all without a sessionId.
      expect(manager.count).not.toHaveBeenCalled();
    });

    it('replays a duplicate submit idempotently: same result, no re-grading, no second XP award or progress row', async () => {
      const attempt = makeAttempt({ sessionId: 'sess-1' });
      const puzzle = makePuzzle();
      const nextPuzzle = makePuzzle({ id: 'puzzle-uuid-7' });
      const manager = makeMockManager({
        attempt, // same object reference mutated in place, like a real DB row
        puzzle,
        attemptsInSessionCount: 1,
        nextPuzzleCandidates: [nextPuzzle],
        nextPuzzleById: { 'puzzle-uuid-7': nextPuzzle },
      });
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      xpLevelService.addXp.mockResolvedValue({
        levelUp: false,
        currentLevel: 1,
        currentXp: 100,
        previousLevel: 1,
      });

      const first = await service.submitAttempt(dto, userId);
      expect(first.isDuplicateReplay).toBe(false);
      expect(first.attempt.status).toBe(AttemptStatus.CORRECT);

      const second = await service.submitAttempt(dto, userId);

      expect(second.isDuplicateReplay).toBe(true);
      expect(second.attempt.score).toBe(first.attempt.score);
      expect(second.nextChallenge?.id).toBe(first.nextChallenge?.id);
      expect(second.progress.sessionCompleted).toBe(
        first.progress.sessionCompleted,
      );

      // The pipeline (XP award, progress row) must run exactly once across both calls.
      expect(xpLevelService.addXp).toHaveBeenCalledTimes(1);
      const progressSaves = manager.save.mock.calls.filter(
        (call) => call[0] === UserProgress,
      );
      expect(progressSaves).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // useHint
  // ─────────────────────────────────────────────────────────────────────────────

  describe('useHint', () => {
    const dto: UseHintDto = { attemptId: 'attempt-uuid-1' };

    it('should increment hintsUsed and save the attempt', async () => {
      const attempt = makeAttempt({ hintsUsed: 0 });
      const savedAttempt = makeAttempt({ hintsUsed: 1 });

      attemptRepo.findOneBy.mockResolvedValue(attempt);
      attemptRepo.save.mockResolvedValue(savedAttempt);

      const result = await service.useHint(dto);
      expect(result.hintsUsed).toBe(1);
      expect(attemptRepo.save).toHaveBeenCalled();
    });

    it('should accumulate hintsUsed across multiple hint calls', async () => {
      // Simulate a second hint call (attempt already has hintsUsed=1)
      const attempt = makeAttempt({ hintsUsed: 1 });
      const savedAttempt = makeAttempt({ hintsUsed: 2 });

      attemptRepo.findOneBy.mockResolvedValue(attempt);
      attemptRepo.save.mockResolvedValue(savedAttempt);

      const result = await service.useHint(dto);
      expect(result.hintsUsed).toBe(2);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy.mockResolvedValue(null);
      await expect(service.useHint(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when attempt is in a terminal state', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.EXPIRED });
      attemptRepo.findOneBy.mockResolvedValue(attempt);
      await expect(service.useHint(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // revealSolution
  // ─────────────────────────────────────────────────────────────────────────────

  describe('revealSolution', () => {
    const dto: RevealSolutionDto = { attemptId: 'attempt-uuid-1' };

    it('should set solutionRevealed=true, status=INCORRECT, score=0 for a STARTED attempt', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.STARTED });
      const savedAttempt = makeAttempt({
        status: AttemptStatus.INCORRECT,
        solutionRevealed: true,
        score: 0,
        submittedAt: new Date(),
      });

      attemptRepo.findOneBy.mockResolvedValue(attempt);
      attemptRepo.save.mockResolvedValue(savedAttempt);

      const result = await service.revealSolution(dto);

      expect(result.solutionRevealed).toBe(true);
      expect(result.status).toBe(AttemptStatus.INCORRECT);
      expect(result.score).toBe(0);
      expect(result.submittedAt).toBeDefined();
    });

    it('should set solutionRevealed=true and zero score without changing status when SUBMITTED', async () => {
      const attempt = makeAttempt({
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      });
      const savedAttempt = makeAttempt({
        status: AttemptStatus.SUBMITTED,
        solutionRevealed: true,
        score: 0,
      });

      attemptRepo.findOneBy.mockResolvedValue(attempt);
      attemptRepo.save.mockResolvedValue(savedAttempt);

      const result = await service.revealSolution(dto);
      expect(result.solutionRevealed).toBe(true);
      expect(result.status).toBe(AttemptStatus.SUBMITTED);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy.mockResolvedValue(null);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when attempt is already CORRECT', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.CORRECT });
      attemptRepo.findOneBy.mockResolvedValue(attempt);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when attempt is already INCORRECT', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.INCORRECT });
      attemptRepo.findOneBy.mockResolvedValue(attempt);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when attempt is already EXPIRED', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.EXPIRED });
      attemptRepo.findOneBy.mockResolvedValue(attempt);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // expireAttempt
  // ─────────────────────────────────────────────────────────────────────────────

  describe('expireAttempt', () => {
    it('should set status=EXPIRED on a STARTED attempt', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.STARTED });
      const savedAttempt = makeAttempt({
        status: AttemptStatus.EXPIRED,
        submittedAt: new Date(),
      });

      attemptRepo.findOneBy.mockResolvedValue(attempt);
      attemptRepo.save.mockResolvedValue(savedAttempt);

      const result = await service.expireAttempt('attempt-uuid-1');
      expect(result.status).toBe(AttemptStatus.EXPIRED);
    });

    it('should set status=EXPIRED on a SUBMITTED attempt', async () => {
      const attempt = makeAttempt({
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      });
      const savedAttempt = makeAttempt({
        status: AttemptStatus.EXPIRED,
        submittedAt: new Date(),
      });

      attemptRepo.findOneBy.mockResolvedValue(attempt);
      attemptRepo.save.mockResolvedValue(savedAttempt);

      const result = await service.expireAttempt('attempt-uuid-1');
      expect(result.status).toBe(AttemptStatus.EXPIRED);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy.mockResolvedValue(null);
      await expect(service.expireAttempt('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when attempt is already CORRECT', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.CORRECT });
      attemptRepo.findOneBy.mockResolvedValue(attempt);
      await expect(service.expireAttempt('attempt-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return the attempt when found', async () => {
      const attempt = makeAttempt();
      attemptRepo.findOneBy.mockResolvedValue(attempt);

      const result = await service.findById('attempt-uuid-1');
      expect(result).toEqual(attempt);
      expect(attemptRepo.findOneBy).toHaveBeenCalledWith({
        id: 'attempt-uuid-1',
      });
    });

    it('should throw NotFoundException when attempt is not found', async () => {
      attemptRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // findByUser
  // ─────────────────────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('should return all attempts for a user ordered by startedAt DESC', async () => {
      const attempts = [makeAttempt(), makeAttempt({ id: 'attempt-uuid-2' })];
      attemptRepo.find.mockResolvedValue(attempts);

      const result = await service.findByUser('user-1');

      expect(attemptRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { startedAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when the user has no attempts', async () => {
      attemptRepo.find.mockResolvedValue([]);
      const result = await service.findByUser('user-unknown');
      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // findBySession
  // ─────────────────────────────────────────────────────────────────────────────

  describe('findBySession', () => {
    it('should return all attempts in a session ordered by startedAt ASC', async () => {
      const attempts = [
        makeAttempt({ sessionId: 'sess-1' }),
        makeAttempt({ id: 'attempt-uuid-2', sessionId: 'sess-1' }),
      ];
      attemptRepo.find.mockResolvedValue(attempts);

      const result = await service.findBySession('sess-1');

      expect(attemptRepo.find).toHaveBeenCalledWith({
        where: { sessionId: 'sess-1' },
        order: { startedAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no attempts exist for the session', async () => {
      attemptRepo.find.mockResolvedValue([]);
      const result = await service.findBySession('unknown-session');
      expect(result).toEqual([]);
    });
  });
});
