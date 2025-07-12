import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleSubmission } from './entities/puzzle-submission.entity';
import { PuzzleProgress } from './entities/puzzle-progress.entity';
import { User } from '../users/user.entity';
import { SubmitPuzzleDto } from './dto/puzzle.dto';

describe('PuzzleService', () => {
  let service: PuzzleService;
  let puzzleRepository: Repository<Puzzle>;
  let submissionRepository: Repository<PuzzleSubmission>;
  let progressRepository: Repository<PuzzleProgress>;
  let userRepository: Repository<User>;
  let eventEmitter: EventEmitter2;

  const mockPuzzleRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockSubmissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProgressRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleService,
        {
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepository,
        },
        {
          provide: getRepositoryToken(PuzzleSubmission),
          useValue: mockSubmissionRepository,
        },
        {
          provide: getRepositoryToken(PuzzleProgress),
          useValue: mockProgressRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PuzzleService>(PuzzleService);
    puzzleRepository = module.get<Repository<Puzzle>>(
      getRepositoryToken(Puzzle),
    );
    submissionRepository = module.get<Repository<PuzzleSubmission>>(
      getRepositoryToken(PuzzleSubmission),
    );
    progressRepository = module.get<Repository<PuzzleProgress>>(
      getRepositoryToken(PuzzleProgress),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitPuzzleSolution', () => {
    const userId = '1';
    const puzzleId = 101;
    const submitDto: SubmitPuzzleDto = { solution: 'correct answer' };

    it('should successfully submit correct puzzle solution', async () => {
      const puzzle = {
        id: puzzleId,
        title: 'Test Puzzle',
        description: 'Test Description',
        type: 'logic',
        difficulty: 'easy',
        solution: 'correct answer',
        isPublished: true,
      };

      const user = {
        id: userId,
        xp: 100,
        level: 1,
      };

      const submission = {
        id: 1,
        userId,
        puzzleId,
        attemptData: { solution: submitDto.solution },
        result: true,
        submittedAt: new Date(),
      };

      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);
      mockSubmissionRepository.create.mockReturnValue(submission);
      mockSubmissionRepository.save.mockResolvedValue(submission);
      mockSubmissionRepository.findOne.mockResolvedValue(null); // No previous success
      mockProgressRepository.findOne.mockResolvedValue(null);
      mockProgressRepository.create.mockReturnValue({
        userId,
        puzzleType: puzzle.type,
        completedCount: 0,
      });
      mockProgressRepository.save.mockResolvedValue({
        userId,
        puzzleType: puzzle.type,
        completedCount: 1,
      });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        xp: 200,
        level: 1,
      });

      const result = await service.submitPuzzleSolution(
        userId,
        puzzleId,
        submitDto,
      );

      expect(mockPuzzleRepository.findOne).toHaveBeenCalledWith({
        where: { id: puzzleId },
      });
      expect(mockSubmissionRepository.create).toHaveBeenCalledWith({
        userId,
        puzzleId,
        attemptData: { solution: submitDto.solution },
        result: true,
        submittedAt: expect.any(Date),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('puzzle.submitted', {
        userId,
        puzzleId,
        isCorrect: true,
        timestamp: expect.any(Date),
      });
      expect(result.success).toBe(true);
      expect(result.xpEarned).toBe(100);
      expect(result.tokensEarned).toBe(10);
    });

    it('should handle incorrect puzzle solution', async () => {
      const puzzle = {
        id: puzzleId,
        title: 'Test Puzzle',
        description: 'Test Description',
        type: 'logic',
        difficulty: 'easy',
        solution: 'correct answer',
        isPublished: true,
      };

      const submitDtoIncorrect: SubmitPuzzleDto = { solution: 'wrong answer' };

      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);
      mockSubmissionRepository.create.mockReturnValue({
        id: 1,
        userId,
        puzzleId,
        attemptData: { solution: submitDtoIncorrect.solution },
        result: false,
        submittedAt: new Date(),
      });
      mockSubmissionRepository.save.mockResolvedValue({
        id: 1,
        userId,
        puzzleId,
        attemptData: { solution: submitDtoIncorrect.solution },
        result: false,
        submittedAt: new Date(),
      });

      const result = await service.submitPuzzleSolution(
        userId,
        puzzleId,
        submitDtoIncorrect,
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('puzzle.submitted', {
        userId,
        puzzleId,
        isCorrect: false,
        timestamp: expect.any(Date),
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Incorrect solution. Try again!');
    });

    it('should throw NotFoundException when puzzle not found', async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitPuzzleSolution(userId, puzzleId, submitDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle already solved puzzle', async () => {
      const puzzle = {
        id: puzzleId,
        title: 'Test Puzzle',
        description: 'Test Description',
        type: 'logic',
        difficulty: 'easy',
        solution: 'correct answer',
        isPublished: true,
      };

      const submission = {
        id: 1,
        userId,
        puzzleId,
        attemptData: { solution: submitDto.solution },
        result: true,
        submittedAt: new Date(),
      };

      const previousSuccess = {
        id: 2,
        userId,
        puzzleId,
        result: true,
      };

      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);
      mockSubmissionRepository.create.mockReturnValue(submission);
      mockSubmissionRepository.save.mockResolvedValue(submission);
      mockSubmissionRepository.findOne.mockResolvedValue(previousSuccess);

      const result = await service.submitPuzzleSolution(
        userId,
        puzzleId,
        submitDto,
      );

      expect(result.success).toBe(true);
      expect(result.xpEarned).toBe(0);
      expect(result.tokensEarned).toBe(0);
      expect(result.message).toBe('Puzzle already solved!');
    });
  });

  describe('getPuzzle', () => {
    it('should return puzzle when found', async () => {
      const puzzle = {
        id: 101,
        title: 'Test Puzzle',
        description: 'Test Description',
        type: 'logic',
        difficulty: 'easy',
        solution: 'correct answer',
        isPublished: true,
      };

      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);

      const result = await service.getPuzzle(101);

      expect(result).toEqual(puzzle);
    });

    it('should throw NotFoundException when puzzle not found', async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(null);

      await expect(service.getPuzzle(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPuzzles', () => {
    it('should return filtered puzzles', async () => {
      const puzzles = [
        {
          id: 1,
          title: 'Logic Puzzle 1',
          type: 'logic',
          difficulty: 'easy',
          isPublished: true,
        },
        {
          id: 2,
          title: 'Logic Puzzle 2',
          type: 'logic',
          difficulty: 'medium',
          isPublished: true,
        },
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(puzzles),
      };

      mockPuzzleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters = { type: 'logic', difficulty: 'easy' };
      const result = await service.getPuzzles(filters);

      expect(result).toEqual(puzzles);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserProgress', () => {
    it('should return user puzzle progress', async () => {
      const progress = [
        {
          id: 1,
          userId: '1',
          puzzleType: 'logic',
          completedCount: 5,
          total: 10,
        },
        {
          id: 2,
          userId: '1',
          puzzleType: 'coding',
          completedCount: 3,
          total: 8,
        },
      ];

      mockProgressRepository.find.mockResolvedValue(progress);

      const result = await service.getUserProgress('1');

      expect(result).toEqual(progress);
      expect(mockProgressRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
      });
    });
  });
});
