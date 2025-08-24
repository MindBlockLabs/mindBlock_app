import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateUserStatsProvider {
  async execute(userId: string, stats: Record<string, any>): Promise<void> {
    // Update user's stats
  }
}