import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { FunnelResult, FunnelStage } from '../interfaces/funnel-result.interface';

const ONBOARDING_EVENTS = [
  { name: 'Onboarding Started', eventType: 'onboarding_started' },
  { name: 'Profile Created', eventType: 'profile_created' },
  { name: 'Tutorial Viewed', eventType: 'tutorial_viewed' },
  { name: 'First Puzzle Attempted', eventType: 'first_puzzle_attempted' },
  { name: 'Onboarding Completed', eventType: 'onboarding_completed' },
];

@Injectable()
export class GetOnboardingFunnelProvider {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  async getFunnel(startDate?: Date, endDate?: Date): Promise<FunnelResult> {
    const start = startDate || new Date(0);
    const end = endDate || new Date();

    const stages: FunnelStage[] = [];

    for (const stage of ONBOARDING_EVENTS) {
      const count = await this.analyticsEventRepository.count({
        where: {
          eventType: stage.eventType,
          timestamp: Between(start, end),
        },
      });

      stages.push({
        name: stage.name,
        eventType: stage.eventType,
        count,
      });
    }

    const totalUsers = stages.length > 0 ? stages[0].count : 0;

    return { startDate: start, endDate: end, totalUsers, stages };
  }
}
