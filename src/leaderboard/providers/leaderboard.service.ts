import { Injectable } from '@nestjs/common';

@Injectable()
export class LeaderboardService {
  private scores = [
    { userId: 1, score: 100 },
    { userId: 2, score: 80 },
  ];

  getLeaderboard() {
    return this.scores.sort((a, b) => b.score - a.score);
  }

  addScore(userId: number, score: number) {
    this.scores.push({ userId, score });
    return { userId, score };
  }
}
