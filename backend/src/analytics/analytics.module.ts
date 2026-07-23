import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { RetentionCohort } from './entities/retention-cohort.entity';
import { UsersAnalyticsListener } from './listeners/users-analytics.listener';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TrackEventProvider } from './providers/track-event.provider';
import { GetOnboardingFunnelProvider } from './providers/get-onboarding-funnel.provider';
import { GetRetentionCurveProvider } from './providers/get-retention-curve.provider';
import { GetChurnRiskProvider } from './providers/get-churn-risk.provider';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, RetentionCohort])],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    UsersAnalyticsListener,
    TrackEventProvider,
    GetOnboardingFunnelProvider,
    GetRetentionCurveProvider,
    GetChurnRiskProvider,
  ],
  exports: [
    AnalyticsService,
    TrackEventProvider,
    GetOnboardingFunnelProvider,
    GetRetentionCurveProvider,
    GetChurnRiskProvider,
    TypeOrmModule,
  ],
})
export class AnalyticsModule {}
