import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { DailyStreakService, StreakUpdateResult } from 'src/daily-streak/daily_streak_service';

import { BonusRewardDto } from './dto/bonus-reward.dto';
import { PuzzleSubmissionDto } from './dto/puzzle-submission.dto';
import { PuzzleRewardResponseDto } from './dto/puzzle-reward-response.dto';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  @OnEvent('puzzle.submitted')
  async handlePuzzleSubmission(payload: PuzzleSubmissionDto): Promise<void> {
    const { userId, timestamp } = payload;

    await this.updateDailyStreak(userId, timestamp);

    // Optional: You could emit XP or badge events here
  }

  private async updateDailyStreak(userId: number, submittedAt: Date): Promise<void> {
    const dailyStreakService = this.moduleRef.get(DailyStreakService, { strict: false });
    const result = await dailyStreakService.updateStreak(userId, submittedAt);
    
    if (result?.milestoneReached) {
      this.logger.log(`User ${userId} hit streak milestone: ${result.milestoneReward?.title}`);
      await this.awardBonusRewards({
        userId,
        bonusXp: result.milestoneReward?.xp ?? 0,
        bonusTokens: result.milestoneReward?.tokens ?? 0,
        reason: `Streak milestone: ${result.milestoneReward?.title}`,
      });
    }
  }

  async awardBonusRewards(dto: BonusRewardDto): Promise<void> {
    const { userId, bonusXp, bonusTokens, reason } = dto;

    try {
      if (bonusXp > 0) {
        await this.awardXP(userId, bonusXp, reason);
      }

      if (bonusTokens > 0) {
        await this.awardTokens(userId, bonusTokens, reason);
      }

      this.logger.log(`Awarded bonus: ${bonusXp} XP, ${bonusTokens} tokens to user ${userId} for "${reason}"`);
    } catch (error) {
      this.logger.error(`Failed to award bonus to user ${userId}:`, error);
      throw error;
    }
  }

  async processPuzzleSubmission(
    userId: number,
    puzzleId: number,
    isCorrect: boolean,
  ): Promise<PuzzleRewardResponseDto> {
    try {
      const puzzleRewards = await this.processPuzzleRewards(userId, puzzleId, isCorrect);

      let streakResult: StreakUpdateResult | null = null;
      if (isCorrect) {
        const dailyStreakService = this.moduleRef.get(DailyStreakService, { strict: false });
        streakResult = await dailyStreakService.updateStreak(userId);

        if (streakResult?.milestoneReached) {
          this.logger.log(`User ${userId} reached milestone: ${streakResult.milestoneReward?.title}`);
          await this.awardBonusRewards({
            userId,
            bonusXp: streakResult.milestoneReward?.xp ?? 0,
            bonusTokens: streakResult.milestoneReward?.tokens ?? 0,
            reason: `Milestone: ${streakResult.milestoneReward?.title}`,
          });
        }
      }

      return {
        puzzleRewards,
        streakResult,
      };
    } catch (error) {
      this.logger.error(`Error processing puzzle for user ${userId}:`, error);
      throw error;
    }
  }

  private async awardXP(userId: number, xp: number, reason: string): Promise<void> {
    // Replace with DB update or XP service
    this.logger.debug(`Awarded ${xp} XP to user ${userId} for "${reason}"`);
    // Simulate DB write
  }

  private async awardTokens(userId: number, tokens: number, reason: string): Promise<void> {
    // Replace with DB update or token service
    this.logger.debug(`Awarded ${tokens} tokens to user ${userId} for "${reason}"`);
    // Simulate DB write
  }

  private async processPuzzleRewards(userId: number, puzzleId: number, isCorrect: boolean): Promise<any> {
    if (!isCorrect) {
      return { xp: 0, tokens: 0 };
    }

    const xp = 50; // Example logic
    const tokens = 5;

    await this.awardXP(userId, xp, 'Correct puzzle answer');
    await this.awardTokens(userId, tokens, 'Correct puzzle answer');

    return { xp, tokens };
  }
}