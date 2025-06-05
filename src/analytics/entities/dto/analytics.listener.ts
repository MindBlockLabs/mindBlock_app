import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsListener {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @OnEvent('analytics.event')
  async handleAnalyticsEvent(payload: {
    eventType: string;
    userId: number;
    metadata: Record<string, any>;
  }) {
    await this.analyticsService.create(payload);
  }
}