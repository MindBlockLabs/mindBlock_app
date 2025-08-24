import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyStreak } from '../entities/daily-streak.entity';
import { StreakResponseDto } from '../dto/streak.dto';
import { BuildStreakResponseService } from './build-streak-response.service';

@Injectable()
export class GetStreakService {
  constructor(
    @InjectRepository(DailyStreak)
    private readonly streakRepository: Repository<DailyStreak>,
    private readonly buildStreakResponseService: BuildStreakResponseService,
  ) {}

  async getStreak(userId: string): Promise<StreakResponseDto> {
    const streak = await this.streakRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!streak) {
      return {
        streakCount: 0,
        longestStreak: 0,
        lastActiveDate: null as Date | null,
        hasSolvedToday: false,
        nextMilestone: 3,
        daysUntilNextMilestone: 3,
      };
    }
    return this.buildStreakResponseService.buildStreakResponse(streak);
  }
}
