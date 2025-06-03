import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleService } from './puzzle.service';
import {
  Puzzle,
  PuzzleSubmission,
  PuzzleProgress,
  User,
  PuzzleType,
  PuzzleDifficulty,
} from './entities';
import {
  XP_BY_DIFFICULTY,
  TOKENS_BY_DIFFICULTY,
} from './constants';

describe('PuzzleService', () => {
  let service: PuzzleService;
  let puzzleRepository: Repository<Puzzle>;
  let submissionRepository: Repository<PuzzleSubmission>;
  let progressRepository: Repository<PuzzleProgress>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleService,
        {
          provide: getRepositoryToken(Puzzle),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PuzzleSubmission),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PuzzleProgress),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<PuzzleService>(PuzzleService);
    puzzleRepository = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle));
    submissionRepository = module.get<Repository<PuzzleSubmission>>(
      getRepositoryToken(PuzzleSubmission),
    );
    progressRepository = module.get<Repository<PuzzleProgress>>(
      getRepositoryToken(PuzzleProgress),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitPuzzleSolution', () => {
    it('should return success false for incorrect solution', async () => {
      const puzzle = {
        id: '1',
        type: PuzzleType.LOGIC,
        difficulty: PuzzleDifficulty.EASY,
        solution: { answer: 'correct' },
      };
      jest.spyOn(puzzleRepository, 'findOne').mockResolvedValue(puzzle as Puzzle);
      
      const result = await service.submitPuzzleSolution('user1', '1', { answer: 'wrong' });
      
      expect(result.success).toBe(false);
      expect(result.xpEarned).toBeUndefined();
    });

    it('should award XP and update progress for correct solution', async () => {
      const puzzle = {
        id: '1',
        type: PuzzleType.LOGIC,
        difficulty: PuzzleDifficulty.MEDIUM,
        solution: { answer: 'correct' },
      };
      jest.spyOn(puzzleRepository, 'findOne').mockResolvedValue(puzzle as Puzzle);
      jest.spyOn(submissionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(submissionRepository, 'create').mockImplementation((val) => val as PuzzleSubmission);
      jest.spyOn(submissionRepository, 'save').mockResolvedValue({} as PuzzleSubmission);
      jest.spyOn(progressRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(progressRepository, 'create').mockImplementation((val) => val as PuzzleProgress);
      jest.spyOn(progressRepository, 'save').mockResolvedValue({} as PuzzleProgress);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user1',
        experiencePoints: 0,
        level: 1,
        totalTokensEarned: 0,
      } as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue({} as User);

      const result = await service.submitPuzzleSolution('user1', '1', { answer: 'correct' });
      
      expect(result.success).toBe(true);
      expect(result.xpEarned).toBe(XP_BY_DIFFICULTY.medium);
      expect(result.tokensEarned).toBe(TOKENS_BY_DIFFICULTY.medium);
    });

    it('should not award XP for duplicate correct submission', async () => {
      const puzzle = {
        id: '1',
        type: PuzzleType.LOGIC,
        difficulty: PuzzleDifficulty.MEDIUM,
        solution: { answer: 'correct' },
      };
      jest.spyOn(puzzleRepository, 'findOne').mockResolvedValue(puzzle as Puzzle);
      jest.spyOn(submissionRepository, 'findOne').mockResolvedValue({
        userId: 'user1',
        puzzleId: '1',
        result: true,
      } as PuzzleSubmission);

      const result = await service.submitPuzzleSolution('user1', '1', { answer: 'correct' });
      
      expect(result.success).toBe(true);
      expect(result.xpEarned).toBe(0);
      expect(result.tokensEarned).toBe(0);
    });
  });
});