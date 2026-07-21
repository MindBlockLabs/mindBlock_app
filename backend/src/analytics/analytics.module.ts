import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { RetentionCohort } from './entities/retention-cohort.entity';
import { UsersAnalyticsListener } from './listeners/users-analytics.listener';
import { AnalyticsController } from './controllers/analytics.controller';
import { TrackEventProvider } from './providers/track-event.provider';
import { GetOnboardingFunnelProvider } from './providers/get-onboarding-funnel.provider';
import { GetRetentionCurveProvider } from './providers/get-retention-curve.provider';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, RetentionCohort])],
  controllers: [AnalyticsController],
  providers: [
    UsersAnalyticsListener,
    TrackEventProvider,
    GetOnboardingFunnelProvider,
    GetRetentionCurveProvider,
  ],
  exports: [TrackEventProvider, GetOnboardingFunnelProvider, GetRetentionCurveProvider, TypeOrmModule],
})
export class AnalyticsModule {}