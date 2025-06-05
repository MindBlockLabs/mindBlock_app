import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { DailyStreakService } from 'src/daily-streak/daily_streak_service';
import { ModuleRef } from '@nestjs/core';
// Import or define StreakUpdateResult type
import { StreakUpdateResult } from 'src/daily-streak/daily_streak_service';

@Injectable()
export class GamificationService {
   private readonly logger = new Logger(GamificationService.name);
   private readonly moduleRef: ModuleRef;

     constructor(
     moduleRef: ModuleRef,
  ) {}

  @OnEvent('puzzle.submitted')
  async handlePuzzleSubmission(payload: {
    userId: number;
    puzzleId: number;
    timestamp: Date;
  }) {
    const { userId, timestamp } = payload;

    // Handle streak update
    await this.updateDailyStreak(userId, timestamp);

    // Add XP, update leaderboard, check badges...
  }

  private async updateDailyStreak(userId: number, submittedAt: Date) {
    // Check last submission timestamp from DB and update streak accordingly
  }

   async awardBonusRewards(
    userId: number, 
    bonusXp: number, 
    bonusTokens: number, 
    reason: string
  ): Promise<void> {
    try {
      // Award XP
      if (bonusXp > 0) {
        await this.awardXP(userId, bonusXp, reason);
      }

      // Award tokens
      if (bonusTokens > 0) {
        await this.awardTokens(userId, bonusTokens, reason);
      }

      this.logger.log(`Awarded bonus rewards to user ${userId}: ${bonusXp} XP, ${bonusTokens} tokens for ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to award bonus rewards to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process puzzle submission with streak update
   */
  async processPuzzleSubmission(userId: number, puzzleId: number, isCorrect: boolean): Promise<any> {
    try {
      // Process regular puzzle rewards
      const puzzleRewards = await this.processPuzzleRewards(userId, puzzleId, isCorrect);

      // Update streak only if puzzle was solved correctly
      let streakResult: StreakUpdateResult | null = null;
      if (isCorrect) {
        // This will be injected as a circular dependency, handle carefully
        const dailyStreakService = this.moduleRef.get(DailyStreakService, { strict: false });
        streakResult = await dailyStreakService.updateStreak(userId);

        if (streakResult && streakResult.milestoneReached) {
          this.logger.log(`User ${userId} reached streak milestone: ${streakResult.milestoneReward?.title}`);
        }
      }

      return {
        puzzleRewards,
        streakResult,
      };
    } catch (error) {
      this.logger.error(`Failed to process puzzle submission for user ${userId}:`, error);
      throw error;
    }
  }

  // Placeholder methods - implement based on your existing structure
  private async awardXP(userId: number, xp: number, reason: string): Promise<void> {
    // Implement XP awarding logic
    this.logger.debug(`Awarding ${xp} XP to user ${userId} for: ${reason}`);
  }

  private async awardTokens(userId: number, tokens: number, reason: string): Promise<void> {
    // Implement token awarding logic
    this.logger.debug(`Awarding ${tokens} tokens to user ${userId} for: ${reason}`);
  }

  private async processPuzzleRewards(userId: number, puzzleId: number, isCorrect: boolean): Promise<any> {
    // Implement existing puzzle reward logic
    return {};
  }
}
