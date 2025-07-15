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
        { provide: getRepositoryToken(Puzzle), useValue: mockPuzzleRepository },
        {
          provide: getRepositoryToken(PuzzleSubmission),
          useValue: mockSubmissionRepository,
        },
        {
          provide: getRepositoryToken(PuzzleProgress),
          useValue: mockProgressRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUserRepository), // or null to test NotFound
          },
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPuzzleRepository), // or null to test NotFound
          },
        }
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
    const userId = 'user-1';
    const puzzleId = 123;
    const submitDto: SubmitPuzzleDto = { userId, puzzleId, solution: 'answer' };

    const puzzle = {
      id: puzzleId,
      type: 'logic',
      difficulty: 'easy',
      solution: 'answer',
    };

    const user = {
      id: userId,
      xp: 100,
      level: 1,
    };

    it('should successfully submit a correct puzzle solution', async () => {
      const submission = {
        id: 1,
        user,
        puzzle,
        solution: submitDto.solution,
        isCorrect: true,
        createdAt: new Date(),
        skipped: false,
      };

      mockPuzzleRepository.findOne.mockResolvedValueOnce(puzzle); // puzzle
      mockUserRepository.findOne.mockResolvedValueOnce(user); // user
      mockSubmissionRepository.create.mockReturnValue(submission);
      mockSubmissionRepository.save.mockResolvedValue(submission);
      mockSubmissionRepository.findOne.mockResolvedValueOnce(null); // no previous correct submission
      mockProgressRepository.findOne.mockResolvedValue(null);
      mockProgressRepository.create.mockReturnValue({
        userId,
        puzzleType: puzzle.type,
        completedCount: 0,
      });
      mockProgressRepository.save.mockResolvedValue({});
      mockUserRepository.save.mockResolvedValue({ ...user, xp: 200, level: 1 });

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
        submitDto,
      );

      expect(result.success).toBe(true);
      expect(result.xpEarned).toBe(100);
      expect(result.tokensEarned).toBe(10);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'puzzle.submitted',
        expect.objectContaining({
          userId,
          puzzleId,
          isCorrect: true,
        }),
      );
    });

    it('should handle incorrect puzzle solution', async () => {
      const incorrectDto = { solution: 'wrong' };

      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockSubmissionRepository.create.mockReturnValue({
        id: 2,
        user,
        puzzle,
        solution: incorrectDto.solution,
        isCorrect: false,
        createdAt: new Date(),
        skipped: false,
      });
      mockSubmissionRepository.save.mockResolvedValue({});
      mockSubmissionRepository.findOne.mockResolvedValue(null);

      const result = await service.submitPuzzleSolution(
        userId,
        puzzleId,
        submitDto,
      );

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

    it('should throw NotFoundException if puzzle not found', async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitPuzzleSolution(userId, puzzleId, submitDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitPuzzleSolution(userId, puzzleId, submitDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return already solved response if duplicate correct submission', async () => {
      const newSubmission = {
        id: 99,
        user,
        puzzle,
        solution: submitDto.solution,
        isCorrect: true,
        createdAt: new Date(),
        skipped: false,
      };

      const existingSuccess = {
        id: 1,
        user,
        puzzle,
        isCorrect: true,
      };

      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockSubmissionRepository.create.mockReturnValue(newSubmission);
      mockSubmissionRepository.save.mockResolvedValue(newSubmission);
      mockSubmissionRepository.findOne.mockResolvedValue(existingSuccess);

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
    it('should return the puzzle if found', async () => {
      const puzzle = { id: 1, title: 'Test' };
      mockPuzzleRepository.findOne.mockResolvedValue(puzzle);

      const result = await service.getPuzzle(1);

      expect(result).toEqual(puzzle);
    });

    it('should throw if puzzle not found', async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(null);

      await expect(service.getPuzzle(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPuzzles', () => {
    it('should apply filters and return puzzles', async () => {
      const puzzles = [{ id: 1 }, { id: 2 }];
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(puzzles),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        getRawOne: jest.fn(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
      };

      mockPuzzleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPuzzles({
        type: 'logic',
        difficulty: 'easy',
      });

      expect(result).toEqual(puzzles);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress', async () => {
      const progress = [{ id: 1, completedCount: 2 }];
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

      const result = await service.getUserProgress('user-1');

      expect(result).toEqual(progress);
      expect(mockProgressRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
      });
    });
  });
});
