import { Injectable } from '@nestjs/common';
import { PuzzleActivityProvider, UserActivityEvent } from './PuzzleActivityProvider';

@Injectable()
export class UserActivityService {
  constructor(private readonly puzzleActivityProvider: PuzzleActivityProvider) {}

  async getUserActivity(userId: string, page: number, limit: number): Promise<UserActivityEvent[]> {
    return this.puzzleActivityProvider.getRecentActivity(userId, page, limit);
  }
}