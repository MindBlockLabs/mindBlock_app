import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/progress.entity';
import { OverallStatsDto } from '../dtos/overall-stats.dto';

interface OverallStatsRaw {
  totalAttempts: string;
  totalCorrect: string;
  totalPointsEarned: string;
  totalTimeSpent: string;
}

@Injectable()
export class GetOverallStatsProvider {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async getOverallStats(userId: string): Promise<OverallStatsDto> {
    const result = await this.progressRepo
      .createQueryBuilder('progress')
      .select('COUNT(*)', 'totalAttempts')
      .addSelect(
        'SUM(CASE WHEN progress.isCorrect = true THEN 1 ELSE 0 END)',
        'totalCorrect',
      )
      .addSelect('SUM(progress.pointsEarned)', 'totalPointsEarned')
      .addSelect('SUM(progress.timeSpent)', 'totalTimeSpent')
      .where('progress.userId = :userId', { userId })
      .getRawOne<OverallStatsRaw>();

    if (!result) {
      return {
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0,
        totalPointsEarned: 0,
        totalTimeSpent: 0,
      };
    }

    const totalAttempts = parseInt(result.totalAttempts, 10) || 0;
    const totalCorrect = parseInt(result.totalCorrect, 10) || 0;
    const accuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      totalAttempts,
      totalCorrect,
      accuracy,
      totalPointsEarned: parseInt(result.totalPointsEarned, 10) || 0,
      totalTimeSpent: parseInt(result.totalTimeSpent, 10) || 0,
    };
  }
}
