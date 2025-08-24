import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DailyStreak } from '../entities/daily-streak.entity';
import { STREAK_MILESTONES, STREAK_EVENTS } from '../constants/streak.constants';
import { BonusRewardDto } from '../dto/bonus-reward.dto';

@Injectable()
export class CheckAndAwardMilestonesService {
  private readonly logger = new Logger(CheckAndAwardMilestonesService.name);

  constructor(
    @InjectRepository(DailyStreak)
    private readonly streakRepository: Repository<DailyStreak>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkAndAwardMilestones(streak: DailyStreak): Promise<void> {
    const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
    for (const milestone of milestones) {
      if (streak.streakCount >= milestone && 
          (!streak.lastMilestoneReached || streak.lastMilestoneReached < milestone)) {
        const milestoneConfig = STREAK_MILESTONES[milestone as keyof typeof STREAK_MILESTONES];
        const bonusReward: BonusRewardDto = {
          userId: streak.userId,
          bonusXp: milestoneConfig.xp,
          bonusTokens: milestoneConfig.tokens,
          reason: milestoneConfig.description,
        };
        this.eventEmitter.emit(STREAK_EVENTS.MILESTONE_REACHED, {
          userId: streak.userId,
          milestone,
          reward: bonusReward,
        });
        streak.lastMilestoneReached = milestone;
        await this.streakRepository.save(streak);
        this.logger.log(`User ${streak.userId} reached ${milestone}-day streak milestone`);
        break;
      }
    }
  }
} 