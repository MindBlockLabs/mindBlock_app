import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyStreak } from '../entities/daily-streak.entity';
import { User } from '../../users/user.entity';

@Injectable()
export class GetStreakStatsService {
  constructor(
    @InjectRepository(DailyStreak)
    private readonly streakRepository: Repository<DailyStreak>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getStreakStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageStreak: number;
    topStreak: number;
  }> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.streakRepository.count();
    const avgResult = await this.streakRepository
      .createQueryBuilder('streak')
      .select('AVG(streak.streakCount)', 'average')
      .getRawOne();
    const topResult = await this.streakRepository
      .createQueryBuilder('streak')
      .select('MAX(streak.streakCount)', 'max')
      .getRawOne();
    return {
      totalUsers,
      activeUsers,
      averageStreak: Math.round(avgResult?.average || 0),
      topStreak: topResult?.max || 0,
    };
  }
}
