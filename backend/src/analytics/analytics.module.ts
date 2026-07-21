import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TrackEventProvider } from './providers/track-event.provider';
import { AnalyticsAdminGuard } from './guards/analytics-admin.guard';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    TrackEventProvider,
    AnalyticsAdminGuard,
  ],
})
export class AnalyticsModule {}