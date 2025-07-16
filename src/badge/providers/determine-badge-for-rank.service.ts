import { Injectable } from '@nestjs/common';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class DetermineBadgeForRankService {
  determineBadgeForRank(playerRank: number, badges: Badge[]): Badge | null {
    // Badge assignment logic based on rank
    if (playerRank === 1) {
      return badges.find((badge) => badge.title === "Puzzle Master") || null;
    } else if (playerRank === 2) {
      return badges.find((badge) => badge.title === "Grand Champion") || null;
    } else if (playerRank === 3) {
      return badges.find((badge) => badge.title === "Blockchain Expert") || null;
    } else if (playerRank >= 4 && playerRank <= 10) {
      return badges.find((badge) => badge.title === "Algorithm Specialist") || null;
    } else if (playerRank > 10) {
      return badges.find((badge) => badge.title === "Rising Star") || null;
    }

    return null;
  }
} 