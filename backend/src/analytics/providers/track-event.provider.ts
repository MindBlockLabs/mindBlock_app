import { Injectable } from '@nestjs/common';
import { AnalyticsQueryDto } from '../dtos/analytics-query.dto';

@Injectable()
export class TrackEventProvider {
  async trackEvent(data: AnalyticsQueryDto) {
    return {
      success: true,
      message: 'Event tracked successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}