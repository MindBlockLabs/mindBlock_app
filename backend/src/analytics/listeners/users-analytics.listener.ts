import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

export interface XpAwardedEvent {
  userId: string;
  entityId: string;
  xpAmount: number;
  previousLevel: number;
  currentLevel: number;
  timestamp: Date;
}

export interface UserLeveledUpEvent {
  userId: string;
  entityId: string;
  previousLevel: number;
  currentLevel: number;
  timestamp: Date;
}

@Injectable()
export class UsersAnalyticsListener {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  @OnEvent('xp_awarded')
  async handleXpAwarded(event: XpAwardedEvent) {
    const analyticsEvent = this.analyticsEventRepository.create({
      eventType: 'xp_awarded',
      userId: event.userId,
      entityId: event.entityId,
      payload: {
        xpAmount: event.xpAmount,
        previousLevel: event.previousLevel,
        currentLevel: event.currentLevel,
      },
      timestamp: event.timestamp,
    });

    await this.analyticsEventRepository.save(analyticsEvent);
  }

  @OnEvent('user_leveled_up')
  async handleUserLeveledUp(event: UserLeveledUpEvent) {
    const analyticsEvent = this.analyticsEventRepository.create({
      eventType: 'user_leveled_up',
      userId: event.userId,
      entityId: event.entityId,
      payload: {
        previousLevel: event.previousLevel,
        currentLevel: event.currentLevel,
      },
      timestamp: event.timestamp,
    });

    await this.analyticsEventRepository.save(analyticsEvent);
  }
}
