import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { BonusRewardDto } from './dto/bonus-reward.dto';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  @OnEvent('puzzle.submitted')
  async awardBonusRewards(dto: BonusRewardDto): Promise<void> {
    const { userId, bonusXp, bonusTokens, reason } = dto;

    try {
      if (bonusXp > 0) {
        await this.awardXP(userId, bonusXp, reason);
      }

      if (bonusTokens > 0) {
        await this.awardTokens(userId, bonusTokens, reason);
      }

      this.logger.log(
        `Awarded bonus: ${bonusXp} XP, ${bonusTokens} tokens to user ${userId} for "${reason}"`,
      );
    } catch (error) {
      this.logger.error(`Failed to award bonus to user ${userId}:`, error);
      throw error;
    }
  }

  private async awardXP(
    userId: string,
    xp: number,
    reason: string,
  ): Promise<void> {
    // Replace with DB update or XP service
    this.logger.debug(`Awarded ${xp} XP to user ${userId} for "${reason}"`);
    // Simulate DB write
  }

  private async awardTokens(
    userId: string,
    tokens: number,
    reason: string,
  ): Promise<void> {
    // Replace with DB update or token service
    this.logger.debug(
      `Awarded ${tokens} tokens to user ${userId} for "${reason}"`,
    );
    // Simulate DB write
  }

  private async processPuzzleRewards(
    userId: string,
    puzzleId: number,
    isCorrect: boolean,
  ): Promise<any> {
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
