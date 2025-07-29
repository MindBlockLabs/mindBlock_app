import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculateRewardsProvider {
  async execute(userId: string, puzzleId: string): Promise<{ coins: number }> {
    // Return reward amount
    return { coins: 10 };
  }
}