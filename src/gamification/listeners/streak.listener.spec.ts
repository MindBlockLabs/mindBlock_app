import { Test, TestingModule } from '@nestjs/testing';
import { StreakListener } from './streak.listener';
import { DailyStreakService } from '../providers/daily-streak.service';
import { PuzzleSubmissionDto } from '../dto/puzzle-submission.dto';

describe('StreakListener', () => {
  let listener: StreakListener;
  let streakService: DailyStreakService;

  const mockStreakService = {
    updateStreak: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakListener,
        {
          provide: DailyStreakService,
          useValue: mockStreakService,
        },
      ],
    }).compile();

    listener = module.get<StreakListener>(StreakListener);
    streakService = module.get<DailyStreakService>(DailyStreakService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePuzzleSubmission', () => {
    it('should update streak when puzzle is solved correctly', async () => {
      const puzzleSubmission: PuzzleSubmissionDto = {
        userId: 1,
        puzzleId: 101,
        isCorrect: true,
        timestamp: new Date(),
      };

      mockStreakService.updateStreak.mockResolvedValue({
        streakCount: 5,
        longestStreak: 10,
        hasSolvedToday: true,
      });

      await listener.handlePuzzleSubmission(puzzleSubmission);

      expect(mockStreakService.updateStreak).toHaveBeenCalledWith(1);
    });

    it('should not update streak when puzzle is solved incorrectly', async () => {
      const puzzleSubmission: PuzzleSubmissionDto = {
        userId: 1,
        puzzleId: 101,
        isCorrect: false,
        timestamp: new Date(),
      };

      await listener.handlePuzzleSubmission(puzzleSubmission);

      expect(mockStreakService.updateStreak).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const puzzleSubmission: PuzzleSubmissionDto = {
        userId: 1,
        puzzleId: 101,
        isCorrect: true,
        timestamp: new Date(),
      };

      mockStreakService.updateStreak.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(listener.handlePuzzleSubmission(puzzleSubmission)).resolves.not.toThrow();
    });
  });

  describe('handleIQQuestionAnswered', () => {
    it('should update streak when IQ question is answered correctly', async () => {
      const iqData = {
        userId: 1,
        isCorrect: true,
      };

      mockStreakService.updateStreak.mockResolvedValue({
        streakCount: 3,
        longestStreak: 7,
        hasSolvedToday: true,
      });

      await listener.handleIQQuestionAnswered(iqData);

      expect(mockStreakService.updateStreak).toHaveBeenCalledWith(1);
    });

    it('should not update streak when IQ question is answered incorrectly', async () => {
      const iqData = {
        userId: 1,
        isCorrect: false,
      };

      await listener.handleIQQuestionAnswered(iqData);

      expect(mockStreakService.updateStreak).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully for IQ questions', async () => {
      const iqData = {
        userId: 1,
        isCorrect: true,
      };

      mockStreakService.updateStreak.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(listener.handleIQQuestionAnswered(iqData)).resolves.not.toThrow();
    });
  });
}); 