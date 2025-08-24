import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DailyStreak } from '../entities/daily-streak.entity';
import { User } from '../../users/user.entity';
import { StreakResponseDto } from '../dto/streak.dto';
import { STREAK_EVENTS } from '../constants/streak.constants';
import { CheckAndAwardMilestonesService } from './check-and-award-milestones.service';
import { BuildStreakResponseService } from './build-streak-response.service';

@Injectable()
export class UpdateStreakService {
  private readonly logger = new Logger(UpdateStreakService.name);

  constructor(
    @InjectRepository(DailyStreak)
    private readonly streakRepository: Repository<DailyStreak>,
    private readonly eventEmitter: EventEmitter2,
    private readonly checkAndAwardMilestonesService: CheckAndAwardMilestonesService,
    private readonly buildStreakResponseService: BuildStreakResponseService,
  ) {}

  async updateStreak(userId: string): Promise<StreakResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await this.streakRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!streak) {
      streak = this.streakRepository.create({
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
        lastMilestoneReached: null as number | null,
      });
    } else {
      const lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      const daysDifference = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDifference === 0) {
        return this.buildStreakResponseService.buildStreakResponse(streak);
      } else if (daysDifference === 1) {
        streak.streakCount += 1;
        streak.lastActiveDate = today;
      } else {
        streak.streakCount = 1;
        streak.lastActiveDate = today;
      }
      if (streak.streakCount > streak.longestStreak) {
        streak.longestStreak = streak.streakCount;
      }
    }
    const savedStreak = await this.streakRepository.save(streak);
    await this.checkAndAwardMilestonesService.checkAndAwardMilestones(
      savedStreak,
    );
    this.eventEmitter.emit(STREAK_EVENTS.PUZZLE_SOLVED, {
      userId,
      streakCount: savedStreak.streakCount,
      isNewStreak: !streak.id,
    });
    this.logger.log(
      `Updated streak for user ${userId}: ${savedStreak.streakCount} days`,
    );
    return this.buildStreakResponseService.buildStreakResponse(savedStreak);
  }
}
