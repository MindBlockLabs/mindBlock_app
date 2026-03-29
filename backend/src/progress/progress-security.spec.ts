import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { UserProgress } from './entities/progress.entity';
import { XpLevelService } from '../users/providers/xp-level.service';
import { User } from '../users/user.entity';
import { DailyQuest } from '../quests/entities/daily-quest.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { PuzzleDifficulty } from '../puzzles/enums/puzzle-difficulty.enum';

describe('ProgressCalculationProvider Security', () => {
  let provider: ProgressCalculationProvider;
  let puzzleRepository: Repository<Puzzle>;
  let userProgressRepository: Repository<UserProgress>;
  let userRepository: Repository<User>;

  const mockPuzzle: Partial<Puzzle> = {
    id: 'puzzle-1',
    correctAnswer: 'correct',
    difficulty: PuzzleDifficulty.BEGINNER,
    timeLimit: 60,
  };

  const mockUser: Partial<User> = {
    id: 'user-1',
    xp: 0,
    level: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressCalculationProvider,
        {
          provide: getRepositoryToken(Puzzle),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPuzzle),
          },
        },
        {
          provide: getRepositoryToken(UserProgress),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue({}),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DailyQuest),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: XpLevelService,
          useValue: {
            addXp: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<ProgressCalculationProvider>(ProgressCalculationProvider);
    puzzleRepository = module.get(getRepositoryToken(Puzzle));
    userProgressRepository = module.get(getRepositoryToken(UserProgress));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should prevent double-rewarding for the same puzzle', async () => {
    // Mock that a correct attempt already exists
    jest.spyOn(userProgressRepository, 'findOne').mockResolvedValueOnce({
      isCorrect: true,
      pointsEarned: 50,
    } as any);

    const result = await provider.processAnswerSubmission({
      userId: 'user-1',
      puzzleId: 'puzzle-1',
      categoryId: 'cat-1',
      userAnswer: 'correct',
      timeSpent: 10,
    });

    expect(result.validation.pointsEarned).toBe(0);
    expect(result.validation.isCorrect).toBe(true);
  });

  it('should prevent rapid duplicate submissions (10s window)', async () => {
    // Mock that no correct attempt exists, but a recent attempt does
    jest.spyOn(userProgressRepository, 'findOne')
      .mockResolvedValueOnce(null) // existingCorrectAttempt
      .mockResolvedValueOnce({ attemptedAt: new Date() } as any); // recentAttempt

    await expect(provider.processAnswerSubmission({
      userId: 'user-1',
      puzzleId: 'puzzle-1',
      categoryId: 'cat-1',
      userAnswer: 'any',
      timeSpent: 10,
    })).rejects.toThrow(BadRequestException);
  });

  it('should award points for first correct submission', async () => {
    jest.spyOn(userProgressRepository, 'findOne').mockResolvedValue(null);
    jest.spyOn(userProgressRepository, 'create').mockReturnValue({ id: 1 } as any);
    jest.spyOn(userProgressRepository, 'save').mockResolvedValue({ id: 1 } as any);

    const result = await provider.processAnswerSubmission({
      userId: 'user-1',
      puzzleId: 'puzzle-1',
      categoryId: 'cat-1',
      userAnswer: 'correct',
      timeSpent: 10,
    });

    expect(result.validation.isCorrect).toBe(true);
    expect(result.validation.pointsEarned).toBeGreaterThan(0);
  });
});
