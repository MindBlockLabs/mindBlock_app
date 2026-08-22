import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChallengeAttemptService } from './challenge-attempt.service';
import { ChallengeValidationService } from './challenge-validation.service';
import { ChallengeAttempt } from '../entities/challenge-attempt.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { AttemptStatus } from '../enums/attempt-status.enum';
import { CreateChallengeAttemptDto } from '../dtos/create-challenge-attempt.dto';
import { SubmitAttemptDto } from '../dtos/submit-attempt.dto';
import { RevealSolutionDto } from '../dtos/reveal-solution.dto';
import { UseHintDto } from '../dtos/use-hint.dto';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
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
    userId: 'user-uuid-1',
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
    user: null as any,
    challenge: null as any,
    ...overrides,
  };
}

describe('ChallengeAttemptService', () => {
  let service: ChallengeAttemptService;
  let attemptRepo: jest.Mocked<Repository<ChallengeAttempt>>;
  let puzzleRepo: jest.Mocked<Repository<Puzzle>>;
  let idempotencyService: { execute: jest.Mock<any> };

  beforeEach(async () => {
    const mockAttemptRepo: Partial<jest.Mocked<Repository<ChallengeAttempt>>> =
      {
        create: jest.fn() as unknown as jest.Mocked<Repository<ChallengeAttempt>>['create'],
        save: jest.fn() as unknown as jest.Mocked<Repository<ChallengeAttempt>>['save'],
        findOneBy: jest.fn(),
        find: jest.fn(),
        existsBy: jest.fn(),
      };

    const mockPuzzleRepo: Partial<jest.Mocked<Repository<Puzzle>>> = {
      existsBy: jest.fn(),
      findOneBy: jest.fn(),
    };

    const mockIdempotencyService = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeAttemptService,
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
          provide: IdempotencyService,
          useValue: mockIdempotencyService,
        },
      ],
    }).compile();

    service = module.get<ChallengeAttemptService>(ChallengeAttemptService);
    attemptRepo = module.get(getRepositoryToken(ChallengeAttempt));
    puzzleRepo = module.get(getRepositoryToken(Puzzle));
    idempotencyService = module.get(IdempotencyService);
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
      userId: 'user-uuid-1',
      challengeId: 'puzzle-uuid-1',
      sessionId: 'session-abc',
    };

    it('should create and return a STARTED attempt', async () => {
      const newAttempt = makeAttempt({ sessionId: dto.sessionId });
      puzzleRepo.existsBy!.mockResolvedValue(true);
      attemptRepo.create!.mockReturnValue(newAttempt);
      attemptRepo.save!.mockResolvedValue(newAttempt);

      const result = await service.createAttempt(dto);

      expect(puzzleRepo.existsBy).toHaveBeenCalledWith({
        id: dto.challengeId,
      });
      expect(attemptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: dto.userId,
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
        userId: 'user-uuid-1',
        challengeId: 'puzzle-uuid-1',
      };
      const newAttempt = makeAttempt({ sessionId: undefined });
      puzzleRepo.existsBy!.mockResolvedValue(true);
      attemptRepo.create!.mockReturnValue(newAttempt);
      attemptRepo.save!.mockResolvedValue(newAttempt);

      const result = await service.createAttempt(noSessionDto);
      expect(result.sessionId).toBeUndefined();
    });

    it('should throw NotFoundException when the challenge does not exist', async () => {
      puzzleRepo.existsBy!.mockResolvedValue(false);

      await expect(service.createAttempt(dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(attemptRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // submitAttempt
  // ─────────────────────────────────────────────────────────────────────────────

  describe('submitAttempt', () => {
    const dto: SubmitAttemptDto = {
      attemptId: 'attempt-uuid-1',
      answer: '4',
      timeSpent: 30,
    };

    /** Helper: sets up idempotencyService.execute to call the fn (first request). */
    function mockFirstRequest(attempt: ChallengeAttempt, puzzle: Puzzle, savedAttempt: ChallengeAttempt) {
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<ChallengeAttempt>) => {
          attemptRepo.findOneBy!.mockResolvedValue(attempt);
          puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
          attemptRepo.save!.mockResolvedValue(savedAttempt);
          const data = await fn();
          return { duplicate: false, data };
        },
      );
    }

    /** Helper: sets up idempotencyService.execute to return a cached result (duplicate). */
    function mockDuplicateRequest(cachedAttempt: ChallengeAttempt) {
      idempotencyService.execute!.mockResolvedValue({
        duplicate: true,
        data: cachedAttempt,
      });
    }

    it('should mark attempt CORRECT and award score for a correct answer', async () => {
      const attempt = makeAttempt();
      const puzzle = makePuzzle();
      const savedAttempt = makeAttempt({
        status: AttemptStatus.CORRECT,
        answer: '4',
        timeSpent: 30,
        score: 125, // 100 * (1 + (60-30)/60*0.5) = 100 * 1.25 = 125
        submittedAt: new Date(),
      });

      mockFirstRequest(attempt, puzzle, savedAttempt);

      const result = await service.submitAttempt(dto);

      expect(result.status).toBe(AttemptStatus.CORRECT);
      expect(result.score).toBeGreaterThan(0);
      expect(result.submittedAt).toBeDefined();
      expect(idempotencyService.execute).toHaveBeenCalled();
    });

    it('should mark attempt INCORRECT and award 0 score for a wrong answer', async () => {
      const submitDto = { ...dto, answer: 'wrong' };
      const attempt = makeAttempt();
      const puzzle = makePuzzle();
      const savedAttempt = makeAttempt({
        status: AttemptStatus.INCORRECT,
        answer: 'wrong',
        timeSpent: 30,
        score: 0,
        submittedAt: new Date(),
      });

      mockFirstRequest(attempt, puzzle, savedAttempt);

      const result = await service.submitAttempt(submitDto);

      expect(result.status).toBe(AttemptStatus.INCORRECT);
      expect(result.score).toBe(0);
    });

    it('should mark INCORRECT and zero score when solution was already revealed', async () => {
      const attempt = makeAttempt({ solutionRevealed: true });
      const puzzle = makePuzzle();
      const savedAttempt = makeAttempt({
        status: AttemptStatus.INCORRECT,
        solutionRevealed: true,
        score: 0,
      });

      mockFirstRequest(attempt, puzzle, savedAttempt);

      const result = await service.submitAttempt(dto);

      expect(result.status).toBe(AttemptStatus.INCORRECT);
      expect(result.score).toBe(0);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<ChallengeAttempt>) => {
          attemptRepo.findOneBy!.mockResolvedValue(null);
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      await expect(service.submitAttempt(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when attempt is in terminal state', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.CORRECT });
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<ChallengeAttempt>) => {
          attemptRepo.findOneBy!.mockResolvedValue(attempt);
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      await expect(service.submitAttempt(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when the puzzle no longer exists', async () => {
      const attempt = makeAttempt();
      idempotencyService.execute!.mockImplementation(
        async (key: string, fn: () => Promise<ChallengeAttempt>) => {
          attemptRepo.findOneBy!.mockResolvedValue(attempt);
          puzzleRepo.findOneBy!.mockResolvedValue(null);
          const data = await fn();
          return { duplicate: false, data };
        },
      );

      await expect(service.submitAttempt(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should perform case-insensitive answer comparison', async () => {
      const dto2 = { ...dto, answer: 'FOUR' };
      const attempt = makeAttempt();
      const puzzle = makePuzzle({ correctAnswer: 'four' });
      const savedAttempt = makeAttempt({
        status: AttemptStatus.CORRECT,
        score: 100,
      });

      mockFirstRequest(attempt, puzzle, savedAttempt);

      const result = await service.submitAttempt(dto2);
      expect(result.status).toBe(AttemptStatus.CORRECT);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Idempotency tests
    // ─────────────────────────────────────────────────────────────────────────

    describe('idempotency', () => {
      it('should return cached result for a duplicate submission with the same idempotencyKey', async () => {
        const cachedAttempt = makeAttempt({
          status: AttemptStatus.CORRECT,
          score: 125,
          answer: '4',
          submittedAt: new Date(),
        });

        mockDuplicateRequest(cachedAttempt);

        const result = await service.submitAttempt({
          ...dto,
          idempotencyKey: 'idempotency-key-abc',
        });

        expect(result).toBe(cachedAttempt);
        expect(result.status).toBe(AttemptStatus.CORRECT);
        expect(result.score).toBe(125);
        // The inner function should NOT have touched the repos
        expect(attemptRepo.findOneBy).not.toHaveBeenCalled();
        expect(attemptRepo.save).not.toHaveBeenCalled();
      });

      it('should derive a deterministic key when idempotencyKey is not provided', async () => {
        const attempt = makeAttempt();
        const puzzle = makePuzzle();
        const savedAttempt = makeAttempt({
          status: AttemptStatus.CORRECT,
          answer: '4',
          score: 125,
          submittedAt: new Date(),
        });

        mockFirstRequest(attempt, puzzle, savedAttempt);

        await service.submitAttempt(dto);

        // Verify idempotencyService.execute was called with a derived key
        expect(idempotencyService.execute).toHaveBeenCalledWith(
          expect.stringMatching(/^attempt-submit:[a-f0-9]{32}$/),
          expect.any(Function),
        );
      });

      it('should use the client-provided idempotencyKey as the Redis key', async () => {
        const attempt = makeAttempt();
        const puzzle = makePuzzle();
        const savedAttempt = makeAttempt({
          status: AttemptStatus.CORRECT,
          answer: '4',
          score: 125,
          submittedAt: new Date(),
        });

        mockFirstRequest(attempt, puzzle, savedAttempt);

        const customKey = 'my-custom-idempotency-key';
        await service.submitAttempt({
          ...dto,
          idempotencyKey: customKey,
        });

        expect(idempotencyService.execute).toHaveBeenCalledWith(
          `attempt-submit:${customKey}`,
          expect.any(Function),
        );
      });

      it('should prevent double XP awards on duplicate submissions', async () => {
        const cachedAttempt = makeAttempt({
          status: AttemptStatus.CORRECT,
          score: 200,
          answer: '4',
          submittedAt: new Date(),
        });

        mockDuplicateRequest(cachedAttempt);

        // First submission
        const result1 = await service.submitAttempt({
          ...dto,
          idempotencyKey: 'duplicate-xp-test',
        });
        expect(result1.status).toBe(AttemptStatus.CORRECT);
        expect(result1.score).toBe(200);

        // Second submission with the same key — should return cached, no re-grading
        const result2 = await service.submitAttempt({
          ...dto,
          idempotencyKey: 'duplicate-xp-test',
        });
        expect(result2).toBe(cachedAttempt);
        expect(result2.score).toBe(200);

        // Repos should NOT have been touched by the second call
        expect(attemptRepo.findOneBy).not.toHaveBeenCalled();
        expect(attemptRepo.save).not.toHaveBeenCalled();
      });

      it('should allow different idempotencyKeys for different submissions', async () => {
        const attempt1 = makeAttempt();
        const puzzle = makePuzzle();
        const savedAttempt1 = makeAttempt({
          status: AttemptStatus.CORRECT,
          answer: '4',
          score: 125,
          submittedAt: new Date(),
        });
        const savedAttempt2 = makeAttempt({
          status: AttemptStatus.INCORRECT,
          answer: 'wrong',
          score: 0,
          submittedAt: new Date(),
        });

        // First call with key-1
        idempotencyService.execute!.mockImplementationOnce(
          async (key: string, fn: () => Promise<ChallengeAttempt>) => {
            attemptRepo.findOneBy!.mockResolvedValue(attempt1);
            puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
            attemptRepo.save!.mockResolvedValue(savedAttempt1);
            const data = await fn();
            return { duplicate: false, data };
          },
        );

        const result1 = await service.submitAttempt({
          ...dto,
          idempotencyKey: 'key-1',
        });
        expect(result1.status).toBe(AttemptStatus.CORRECT);

        // Second call with key-2 — different idempotency key
        const attempt2 = makeAttempt(); // fresh mutable attempt
        idempotencyService.execute!.mockImplementationOnce(
          async (key: string, fn: () => Promise<ChallengeAttempt>) => {
            attemptRepo.findOneBy!.mockResolvedValue(attempt2);
            puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
            attemptRepo.save!.mockResolvedValue(savedAttempt2);
            const data = await fn();
            return { duplicate: false, data };
          },
        );

        const result2 = await service.submitAttempt({
          ...dto,
          idempotencyKey: 'key-2',
        });
        expect(result2.status).toBe(AttemptStatus.INCORRECT);
      });
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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.useHint(dto);
      expect(result.hintsUsed).toBe(1);
      expect(attemptRepo.save).toHaveBeenCalled();
    });

    it('should accumulate hintsUsed across multiple hint calls', async () => {
      // Simulate a second hint call (attempt already has hintsUsed=1)
      const attempt = makeAttempt({ hintsUsed: 1 });
      const savedAttempt = makeAttempt({ hintsUsed: 2 });

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.useHint(dto);
      expect(result.hintsUsed).toBe(2);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy!.mockResolvedValue(null);
      await expect(service.useHint(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when attempt is in a terminal state', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.EXPIRED });
      attemptRepo.findOneBy!.mockResolvedValue(attempt);
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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.revealSolution(dto);
      expect(result.solutionRevealed).toBe(true);
      expect(result.status).toBe(AttemptStatus.SUBMITTED);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy!.mockResolvedValue(null);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when attempt is already CORRECT', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.CORRECT });
      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when attempt is already INCORRECT', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.INCORRECT });
      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      await expect(service.revealSolution(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when attempt is already EXPIRED', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.EXPIRED });
      attemptRepo.findOneBy!.mockResolvedValue(attempt);
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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.expireAttempt('attempt-uuid-1');
      expect(result.status).toBe(AttemptStatus.EXPIRED);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy!.mockResolvedValue(null);
      await expect(service.expireAttempt('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when attempt is already CORRECT', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.CORRECT });
      attemptRepo.findOneBy!.mockResolvedValue(attempt);
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
      attemptRepo.findOneBy!.mockResolvedValue(attempt);

      const result = await service.findById('attempt-uuid-1');
      expect(result).toEqual(attempt);
      expect(attemptRepo.findOneBy).toHaveBeenCalledWith({
        id: 'attempt-uuid-1',
      });
    });

    it('should throw NotFoundException when attempt is not found', async () => {
      attemptRepo.findOneBy!.mockResolvedValue(null);
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
      attemptRepo.find!.mockResolvedValue(attempts);

      const result = await service.findByUser('user-uuid-1');

      expect(attemptRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { startedAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when the user has no attempts', async () => {
      attemptRepo.find!.mockResolvedValue([]);
      const result = await service.findByUser('user-uuid-unknown');
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
      attemptRepo.find!.mockResolvedValue(attempts);

      const result = await service.findBySession('sess-1');

      expect(attemptRepo.find).toHaveBeenCalledWith({
        where: { sessionId: 'sess-1' },
        order: { startedAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no attempts exist for the session', async () => {
      attemptRepo.find!.mockResolvedValue([]);
      const result = await service.findBySession('unknown-session');
      expect(result).toEqual([]);
    });
  });
});