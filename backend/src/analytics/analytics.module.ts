import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { RetentionCohort } from './entities/retention-cohort.entity';
import { DailyActiveUser } from './entities/daily-active-user.entity';
import { QuestAnalytics } from './entities/quest-analytics.entity';
import { DailyQuest } from '../quests/entities/daily-quest.entity';
import { UsersAnalyticsListener } from './listeners/users-analytics.listener';
import { BlockchainAnalyticsListener } from './listeners/blockchain-analytics.listener';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TrackEventProvider } from './providers/track-event.provider';
import { GetOnboardingFunnelProvider } from './providers/get-onboarding-funnel.provider';
import { GetRetentionCurveProvider } from './providers/get-retention-curve.provider';
import { GetChurnRiskProvider } from './providers/get-churn-risk.provider';
import { PuzzleAnalyticsProvider } from './providers/puzzle-analytics.provider';
import { ExportCsvProvider } from './providers/export-csv.provider';
import { DailyActiveUsersRollupJob } from './jobs/daily-active-users-rollup.job';
import { QuestAnalyticsRollupJob } from './jobs/quest-analytics-rollup.job';
import { RetentionCohortRollupJob } from './jobs/retention-cohort-rollup.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      AnalyticsEvent,
      RetentionCohort,
      DailyActiveUser,
      QuestAnalytics,
      DailyQuest,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    UsersAnalyticsListener,
    BlockchainAnalyticsListener,
    TrackEventProvider,
    GetOnboardingFunnelProvider,
    GetRetentionCurveProvider,
    GetChurnRiskProvider,
    PuzzleAnalyticsProvider,
    ExportCsvProvider,
    DailyActiveUsersRollupJob,
    QuestAnalyticsRollupJob,
    RetentionCohortRollupJob,
  ],
  exports: [
    AnalyticsService,
    BlockchainAnalyticsListener,
    TrackEventProvider,
    GetOnboardingFunnelProvider,
    GetRetentionCurveProvider,
    GetChurnRiskProvider,
    PuzzleAnalyticsProvider,
    ExportCsvProvider,
    TypeOrmModule,
  ],
})
export class AnalyticsModule {}
