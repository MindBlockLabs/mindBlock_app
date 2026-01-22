import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressCalculationProvider } from '../providers/progress-calculation.provider';
import { UserProgress } from '../entities/user-progress.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';

describe('ProgressCalculationProvider', () => {
  let provider: ProgressCalculationProvider;
  let puzzleRepository: Repository<Puzzle>;
  let userProgressRepository: Repository<UserProgress>;

  const mockPuzzle: Puzzle = {
    id: 'puzzle-uuid',
    question: 'Test question',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    difficulty: PuzzleDifficulty.BEGINNER,
    categoryId: 'category-uuid',
    points: 100,
    timeLimit: 60,
    explanation: 'Test explanation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressCalculationProvider,
        {
          provide: getRepositoryToken(Puzzle),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserProgress),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<ProgressCalculationProvider>(ProgressCalculationProvider);
    puzzleRepository = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle));
    userProgressRepository = module.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('validateAnswer', () => {
    it('should validate correct answer with different cases', () => {
      const result = provider.validateAnswer('a', 'A');
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedAnswer).toBe('a');
    });

    it('should validate correct answer with whitespace', () => {
      const result = provider.validateAnswer('  A  ', 'A');
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedAnswer).toBe('a');
    });

    it('should reject incorrect answer', () => {
      const result = provider.validateAnswer('B', 'A');
      expect(result.isCorrect).toBe(false);
      expect(result.normalizedAnswer).toBe('b');
    });

    it('should reject incorrect answer with whitespace', () => {
      const result = provider.validateAnswer('  B  ', 'A');
      expect(result.isCorrect).toBe(false);
      expect(result.normalizedAnswer).toBe('b');
    });
  });

  describe('calculatePoints', () => {
    it('should return 0 points for incorrect answer', () => {
      const points = provider.calculatePoints(mockPuzzle, 30, false);
      expect(points).toBe(0);
    });

    it('should give 20% bonus for completing in half time or less', () => {
      const points = provider.calculatePoints(mockPuzzle, 30, true); // 30s <= 60s * 0.5
      expect(points).toBe(120); // 100 * 1.2
    });

    it('should give 10% bonus for completing in 75% time or less', () => {
      const points = provider.calculatePoints(mockPuzzle, 45, true); // 45s <= 60s * 0.75
      expect(points).toBe(110); // 100 * 1.1
    });

    it('should give 10% penalty for exceeding time limit', () => {
      const points = provider.calculatePoints(mockPuzzle, 70, true); // 70s > 60s
      expect(points).toBe(90); // 100 * 0.9
    });

    it('should give base points for normal completion', () => {
      const points = provider.calculatePoints(mockPuzzle, 55, true); // 55s is normal
      expect(points).toBe(100); // 100 * 1.0
    });
  });

  describe('processAnswerSubmission', () => {
    const mockSubmitAnswerDto: SubmitAnswerDto = {
      userId: 'user-uuid',
      puzzleId: 'puzzle-uuid',
      categoryId: 'category-uuid',
      userAnswer: 'A',
      timeSpent: 30,
    };

    it('should process correct answer successfully', async () => {
      jest.spyOn(puzzleRepository, 'findOne').mockResolvedValue(mockPuzzle);
      
      const mockUserProgress = {
        id: 'progress-uuid',
        ...mockSubmitAnswerDto,
        isCorrect: true,
        pointsEarned: 120,
        attemptedAt: new Date(),
      };
      
      jest.spyOn(userProgressRepository, 'create').mockReturnValue(mockUserProgress as any);
      jest.spyOn(userProgressRepository, 'save').mockResolvedValue(mockUserProgress as any);

      const result = await provider.processAnswerSubmission(mockSubmitAnswerDto);

      expect(result.validation.isCorrect).toBe(true);
      expect(result.validation.pointsEarned).toBe(120); // 20% bonus
      expect(result.userProgress.isCorrect).toBe(true);
      expect(result.userProgress.pointsEarned).toBe(120);
    });

    it('should process incorrect answer successfully', async () => {
      jest.spyOn(puzzleRepository, 'findOne').mockResolvedValue(mockPuzzle);
      
      const incorrectDto = { ...mockSubmitAnswerDto, userAnswer: 'B' };
      
      const mockUserProgress = {
        id: 'progress-uuid',
        ...incorrectDto,
        isCorrect: false,
        pointsEarned: 0,
        attemptedAt: new Date(),
      };
      
      jest.spyOn(userProgressRepository, 'create').mockReturnValue(mockUserProgress as any);
      jest.spyOn(userProgressRepository, 'save').mockResolvedValue(mockUserProgress as any);

      const result = await provider.processAnswerSubmission(incorrectDto);

      expect(result.validation.isCorrect).toBe(false);
      expect(result.validation.pointsEarned).toBe(0);
      expect(result.userProgress.isCorrect).toBe(false);
      expect(result.userProgress.pointsEarned).toBe(0);
    });

    it('should throw error if puzzle not found', async () => {
      jest.spyOn(puzzleRepository, 'findOne').mockResolvedValue(null);

      await expect(provider.processAnswerSubmission(mockSubmitAnswerDto))
        .rejects.toThrow('Puzzle with ID puzzle-uuid not found');
    });
  });

  describe('getUserProgressStats', () => {
    it('should calculate user progress statistics', async () => {
      const mockStats = {
        totalAttempts: '10',
        correctAttempts: '7',
        totalPoints: '1500',
        averageTimeSpent: '45.5',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      jest.spyOn(userProgressRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const stats = await provider.getUserProgressStats('user-uuid', 'category-uuid');

      expect(stats.totalAttempts).toBe(10);
      expect(stats.correctAttempts).toBe(7);
      expect(stats.totalPoints).toBe(1500);
      expect(stats.averageTimeSpent).toBe(45.5);
      expect(stats.accuracy).toBe(70); // 7/10 * 100
    });
  });
});
