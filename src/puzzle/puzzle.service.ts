// src/puzzle/puzzle.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PuzzleType } from './enums/puzzle-type.enum';
import { Logger } from '@nestjs/common';
import { GamificationService } from '../gamification/gamification.service';
import { DailyStreakService } from 'src/daily-streak/daily_streak_service';


@Injectable()
export class PuzzleService {
  private readonly logger = new Logger(PuzzleService.name);

  constructor(
    @Inject(forwardRef(() => GamificationService))
    private readonly gamificationService: GamificationService,
    @Inject(forwardRef(() => DailyStreakService))
    private readonly dailyStreakService: DailyStreakService,
  ) {}

  getPuzzleStub() {
    return {
      message: 'Puzzle module is working',
      typesAvailable: Object.values(PuzzleType),
    };
  }

   async submitSolution(
    userId: number, 
    puzzleId: number, 
    solution: any
  ): Promise<{
    isCorrect: boolean;
    score?: number;
    feedback?: string;
    streakResult?: any;
    gamificationRewards?: any;
  }> {
    try {
      // Validate and check solution
      const isCorrect = await this.validatePuzzleSolution(puzzleId, solution);
      
      // Calculate base score
      let score = 0;
      if (isCorrect) {
        score = await this.calculatePuzzleScore(puzzleId, solution);
      }

      // Process gamification rewards (including streak)
      let gamificationRewards: any = null;
      let streakResult = null;

      if (isCorrect) {
        gamificationRewards = await this.gamificationService.processPuzzleSubmission(
          userId, 
          puzzleId, 
          isCorrect
        );
        
        // Extract streak result for response
        streakResult = gamificationRewards?.streakResult;
      }

      // Save puzzle submission record
      await this.savePuzzleSubmission({
        userId,
        puzzleId,
        solution,
        isCorrect,
        score,
        submittedAt: new Date(),
      });

      this.logger.log(`Puzzle ${puzzleId} submission by user ${userId}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

      return {
        isCorrect,
        score: isCorrect ? score : undefined,
        feedback: await this.generateFeedback(puzzleId, solution, isCorrect),
        streakResult,
        gamificationRewards: gamificationRewards?.puzzleRewards,
      };

    } catch (error) {
      this.logger.error(`Failed to submit puzzle solution for user ${userId}:`, error);
      throw error;
    }
  }

  // Placeholder methods - implement based on your existing logic
  private async validatePuzzleSolution(puzzleId: number, solution: any): Promise<boolean> {
    // Implement puzzle validation logic
    return true; // placeholder
  }

  private async calculatePuzzleScore(puzzleId: number, solution: any): Promise<number> {
    // Implement score calculation logic
    return 100; // placeholder
  }

  private async generateFeedback(puzzleId: number, solution: any, isCorrect: boolean): Promise<string> {
    // Implement feedback generation logic
    return isCorrect ? 'Correct solution!' : 'Try again!';
  }

  private async savePuzzleSubmission(submission: any): Promise<void> {
    // Implement puzzle submission saving logic
    this.logger.debug('Puzzle submission saved:', submission);
  }
}