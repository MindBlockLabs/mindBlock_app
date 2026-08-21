import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionSummaryProvider } from './session-summary.provider';
import { ChallengeAttempt } from '../../challenge-attempt/entities/challenge-attempt.entity';
import { AttemptStatus } from '../../challenge-attempt/enums/attempt-status.enum';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { StreaksService } from '../../streak/providers/streaks.service';
import { RewardService } from '../../rewards/providers/reward.service';

function makeAttempt(overrides: Partial<ChallengeAttempt> = {}): ChallengeAttempt {
  return {
    id: 'attempt-1',
    sessionId: 'session-1',
    userId: 'user-1',
    challengeId: 'puzzle-1',
    answer: 'answer',
    status: AttemptStatus.CORRECT,
    score: 100,
    timeSpent: 30,
    hintsUsed: 0,
    solutionRevealed: false,
    startedAt: new Date('2026-08-01T10:00:00Z'),
    submittedAt: new Date('2026-08-01T10:00:30Z'),
    ...overrides,
  } as ChallengeAttempt;
}

function makePuzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id: 'puzzle-1',
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Logic' } as Puzzle['category'],
    ...overrides,
  } as Puzzle;
}

describe('SessionSummaryProvider', () => {
  let provider: SessionSummaryProvider;
  let attemptRepo: jest.Mocked<Repository<ChallengeAttempt>>;
  let puzzleRepo: jest.Mocked<Repository<Puzzle>>;
  let streaksService: jest.Mocked<StreaksService>;
  let rewardService: jest.Mocked<RewardService>;

  beforeEach(async () => {
    const mockAttemptRepo: Partial<jest.Mocked<Repository<ChallengeAttempt>>> = {
      find: jest.fn(),
    };
    const mockPuzzleRepo: Partial<jest.Mocked<Repository<Puzzle>>> = {
      find: jest.fn(),
    };
    const mockStreaksService: Partial<jest.Mocked<StreaksService>> = {
      getStreak: jest.fn(),
      updateStreak: jest.fn(),
    };
    const mockRewardService: Partial<jest.Mocked<RewardService>> = {
      checkEligibility: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionSummaryProvider,
        { provide: getRepositoryToken(ChallengeAttempt), useValue: mockAttemptRepo },
        { provide: getRepositoryToken(Puzzle), useValue: mockPuzzleRepo },
        { provide: StreaksService, useValue: mockStreaksService },
        { provide: RewardService, useValue: mockRewardService },
      ],
    }).compile();

    provider = module.get(SessionSummaryProvider);
    attemptRepo = module.get(getRepositoryToken(ChallengeAttempt));
    puzzleRepo = module.get(getRepositoryToken(Puzzle));
    streaksService = module.get(StreaksService);
    rewardService = module.get(RewardService);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns zeroed-out stats and skips streak/category lookups when there are no attempts', async () => {
    attemptRepo.find.mockResolvedValue([]);
    rewardService.checkEligibility.mockReturnValue({
      eligible: false,
      reason: 'Answer was incorrect',
    });

    const result = await provider.buildCompletionStats('session-1', 'user-1');

    expect(result.challengesCompleted).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.categoryPerformance).toEqual([]);
    expect(result.previousStreak).toBeNull();
    expect(result.currentStreak).toBeNull();
    expect(streaksService.getStreak).not.toHaveBeenCalled();
    expect(puzzleRepo.find).not.toHaveBeenCalled();
  });

  it('aggregates score, accuracy, time spent and category breakdown from completed attempts', async () => {
    attemptRepo.find.mockResolvedValue([
      makeAttempt({ id: 'a1', status: AttemptStatus.CORRECT, score: 100, timeSpent: 20, challengeId: 'puzzle-1' }),
      makeAttempt({ id: 'a2', status: AttemptStatus.INCORRECT, score: 0, timeSpent: 15, challengeId: 'puzzle-1' }),
      makeAttempt({ id: 'a3', status: AttemptStatus.CORRECT, score: 80, timeSpent: 10, challengeId: 'puzzle-2' }),
      // STARTED attempts (never submitted) are excluded from stats entirely.
      makeAttempt({ id: 'a4', status: AttemptStatus.STARTED, score: 0, timeSpent: 0, challengeId: 'puzzle-2' }),
    ]);
    puzzleRepo.find.mockResolvedValue([
      makePuzzle({ id: 'puzzle-1', categoryId: 'cat-1', category: { id: 'cat-1', name: 'Logic' } as Puzzle['category'] }),
      makePuzzle({ id: 'puzzle-2', categoryId: 'cat-2', category: { id: 'cat-2', name: 'Coding' } as Puzzle['category'] }),
    ]);
    streaksService.getStreak.mockResolvedValue({ currentStreak: 3 } as never);
    streaksService.updateStreak.mockResolvedValue({ currentStreak: 4 } as never);
    rewardService.checkEligibility.mockReturnValue({
      eligible: true,
      reason: 'Player meets reward eligibility requirements',
    });

    const result = await provider.buildCompletionStats(
      'session-1',
      'user-1',
      'America/New_York',
    );

    expect(result.challengesCompleted).toBe(3);
    expect(result.totalScore).toBe(180);
    expect(result.xpEarned).toBe(180);
    expect(result.accuracy).toBe(67); // 2/3 correct, rounded
    expect(result.timeSpentSeconds).toBe(45);

    const logic = result.categoryPerformance.find((c) => c.categoryId === 'cat-1');
    const coding = result.categoryPerformance.find((c) => c.categoryId === 'cat-2');
    expect(logic).toEqual({
      categoryId: 'cat-1',
      categoryName: 'Logic',
      correct: 1,
      total: 2,
      accuracy: 50,
    });
    expect(coding).toEqual({
      categoryId: 'cat-2',
      categoryName: 'Coding',
      correct: 1,
      total: 1,
      accuracy: 100,
    });

    expect(streaksService.getStreak).toHaveBeenCalledWith('user-1');
    expect(streaksService.updateStreak).toHaveBeenCalledWith(
      'user-1',
      'America/New_York',
    );
    expect(result.previousStreak).toBe(3);
    expect(result.currentStreak).toBe(4);
    expect(result.rewardEligible).toBe(true);
  });

  it('skips streak updates for guest sessions (no userId)', async () => {
    attemptRepo.find.mockResolvedValue([makeAttempt()]);
    puzzleRepo.find.mockResolvedValue([makePuzzle()]);
    rewardService.checkEligibility.mockReturnValue({
      eligible: true,
      reason: 'Player meets reward eligibility requirements',
    });

    const result = await provider.buildCompletionStats('session-1', null);

    expect(streaksService.getStreak).not.toHaveBeenCalled();
    expect(streaksService.updateStreak).not.toHaveBeenCalled();
    expect(result.previousStreak).toBeNull();
    expect(result.currentStreak).toBeNull();
  });
});
