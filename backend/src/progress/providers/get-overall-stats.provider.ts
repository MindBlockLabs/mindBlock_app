import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserProgress } from '../entities/progress.entity';
import { OverallStatsDto } from '../dtos/overall-stats.dto';

@Injectable()
export class GetOverallStatsProvider {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async getOverallStats(userId: string): Promise<OverallStatsDto> {
    const where: FindOptionsWhere<UserProgress> = {
      userId,
    };

    const progressRecords = await this.progressRepo.find({ where });

    if (progressRecords.length === 0) {
      return {
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0,
        totalPointsEarned: 0,
        totalTimeSpent: 0,
      };
    }

    const totalAttempts = progressRecords.length;
    const totalCorrect = progressRecords.reduce(
      (sum, record) => sum + (record.isCorrect ? 1 : 0),
      0,
    );
    const totalPointsEarned = progressRecords.reduce(
      (sum, record) => sum + record.pointsEarned,
      0,
    );
    const totalTimeSpent = progressRecords.reduce(
      (sum, record) => sum + record.timeSpent,
      0,
    );

    const accuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      totalAttempts,
      totalCorrect,
      accuracy,
      totalPointsEarned,
      totalTimeSpent,
    };
  }
}
