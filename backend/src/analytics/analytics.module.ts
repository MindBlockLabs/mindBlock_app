import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { UsersAnalyticsListener } from './listeners/users-analytics.listener';
import { AnalyticsController } from './controllers/analytics.controller';
import { TrackEventProvider } from './providers/track-event.provider';
import { GetOnboardingFunnelProvider } from './providers/get-onboarding-funnel.provider';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [AnalyticsController],
  providers: [UsersAnalyticsListener, TrackEventProvider, GetOnboardingFunnelProvider],
  exports: [TrackEventProvider, GetOnboardingFunnelProvider, TypeOrmModule],
})
export class AnalyticsModule {}
