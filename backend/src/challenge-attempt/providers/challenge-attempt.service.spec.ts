import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChallengeAttemptService } from './challenge-attempt.service';
import { ChallengeAttempt } from '../entities/challenge-attempt.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { AttemptStatus } from '../enums/attempt-status.enum';
import { CreateChallengeAttemptDto } from '../dtos/create-challenge-attempt.dto';
import { SubmitAttemptDto } from '../dtos/submit-attempt.dto';
import { RevealSolutionDto } from '../dtos/reveal-solution.dto';
import { UseHintDto } from '../dtos/use-hint.dto';

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

  beforeEach(async () => {
    const mockAttemptRepo: Partial<jest.Mocked<Repository<ChallengeAttempt>>> =
      {
        create: jest.fn(),
        save: jest.fn(),
        findOneBy: jest.fn(),
        find: jest.fn(),
        existsBy: jest.fn(),
      };

    const mockPuzzleRepo: Partial<jest.Mocked<Repository<Puzzle>>> = {
      existsBy: jest.fn(),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeAttemptService,
        {
          provide: getRepositoryToken(ChallengeAttempt),
          useValue: mockAttemptRepo,
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepo,
        },
      ],
    }).compile();

    service = module.get<ChallengeAttemptService>(ChallengeAttemptService);
    attemptRepo = module.get(getRepositoryToken(ChallengeAttempt));
    puzzleRepo = module.get(getRepositoryToken(Puzzle));
  });

  afterEach(() => jest.clearAllMocks());

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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.submitAttempt(dto);

      expect(result.status).toBe(AttemptStatus.CORRECT);
      expect(result.score).toBeGreaterThan(0);
      expect(result.submittedAt).toBeDefined();
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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.submitAttempt(dto);

      expect(result.status).toBe(AttemptStatus.INCORRECT);
      expect(result.score).toBe(0);
    });

    it('should throw NotFoundException when attempt does not exist', async () => {
      attemptRepo.findOneBy!.mockResolvedValue(null);

      await expect(service.submitAttempt(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when attempt is in terminal state', async () => {
      const attempt = makeAttempt({ status: AttemptStatus.CORRECT });
      attemptRepo.findOneBy!.mockResolvedValue(attempt);

      await expect(service.submitAttempt(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when the puzzle no longer exists', async () => {
      const attempt = makeAttempt();
      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      puzzleRepo.findOneBy!.mockResolvedValue(null);

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

      attemptRepo.findOneBy!.mockResolvedValue(attempt);
      puzzleRepo.findOneBy!.mockResolvedValue(puzzle);
      attemptRepo.save!.mockResolvedValue(savedAttempt);

      const result = await service.submitAttempt(dto2);
      expect(result.status).toBe(AttemptStatus.CORRECT);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // validateAnswer (unit tests for the helper directly)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('validateAnswer', () => {
    it('should return true for an exact match', () => {
      expect(service.validateAnswer('4', '4')).toBe(true);
    });

    it('should return true for a case-insensitive match', () => {
      expect(service.validateAnswer('FOUR', 'four')).toBe(true);
    });

    it('should return true when both sides differ only in whitespace', () => {
      expect(service.validateAnswer('  four  ', 'four')).toBe(true);
    });

    it('should return false for a clearly wrong answer', () => {
      expect(service.validateAnswer('3', '4')).toBe(false);
    });

    it('should return false for an empty answer against a non-empty correct answer', () => {
      expect(service.validateAnswer('', '4')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // calculateScore (unit tests for the helper directly)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('calculateScore', () => {
    it('should return base points when timeSpent equals timeLimit (no bonus)', () => {
      const score = service.calculateScore(100, 60, 60);
      expect(score).toBe(100); // 100 * (1 + 0) = 100
    });

    it('should return full bonus (50%) when timeSpent is 0', () => {
      const score = service.calculateScore(100, 0, 60);
      expect(score).toBe(150); // 100 * (1 + 0.5) = 150
    });

    it('should return partial bonus when timeSpent is half of timeLimit', () => {
      // bonus = (60 - 30) / 60 * 0.5 = 0.25 → total = 100 * 1.25 = 125
      const score = service.calculateScore(100, 30, 60);
      expect(score).toBe(125);
    });

    it('should return base points when timeSpent exceeds timeLimit (no bonus)', () => {
      const score = service.calculateScore(100, 90, 60);
      expect(score).toBe(100); // time exceeded, no bonus
    });

    it('should return 0 when basePoints is 0', () => {
      const score = service.calculateScore(0, 10, 60);
      expect(score).toBe(0);
    });
  });
});
