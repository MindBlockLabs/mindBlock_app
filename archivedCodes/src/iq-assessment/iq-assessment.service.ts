import { Injectable } from '@nestjs/common';
import { SubmitPuzzleProvider } from './providers/submit-puzzle.provider';
import { VerifySolutionProvider } from './providers/verify-solution.provider';
import { UpdateProgressProvider } from './providers/update-progress.provider';
import { CalculateRewardsProvider } from './providers/calculate-rewards.provider';
import { UpdateUserStatsProvider } from './providers/update-user-stats.provider';
import { GetPuzzleProvider } from './providers/get-puzzle.provider';
import { GetPuzzlesProvider } from './providers/get-puzzles.provider';

@Injectable()
export class IqAssessmentService {
  constructor(
    private readonly submitPuzzle: SubmitPuzzleProvider,
    private readonly verifySolution: VerifySolutionProvider,
    private readonly updateProgress: UpdateProgressProvider,
    private readonly calculateRewards: CalculateRewardsProvider,
    private readonly updateUserStats: UpdateUserStatsProvider,
    private readonly getPuzzle: GetPuzzleProvider,
    private readonly getPuzzles: GetPuzzlesProvider,
  ) {}

  async submitPuzzleSolution(userId: string, puzzleId: string, answer: string) {
    const isCorrect = await this.verifySolution.execute(puzzleId, answer);
    await this.updateProgress.execute(userId, puzzleId, isCorrect);
    const rewards = isCorrect ? await this.calculateRewards.execute(userId, puzzleId) : { coins: 0 };
    await this.updateUserStats.execute(userId, { attempts: 1, correct: isCorrect ? 1 : 0 });
    return this.submitPuzzle.execute(userId, puzzleId, answer);
  }

  async getPuzzleById(puzzleId: string) {
    return this.getPuzzle.execute(puzzleId);
  }

  async listAvailablePuzzles(category?: string) {
    return this.getPuzzles.execute(category);
  }
}
