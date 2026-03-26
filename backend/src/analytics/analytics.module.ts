import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsDbService } from './providers/analytics-db.service';
import { ActivityService } from './providers/activity.service';
import { MetricsService } from './providers/metrics.service';
import { PrivacyPreferencesService } from './providers/privacy-preferences.service';
import { DataRetentionService } from './providers/data-retention.service';
import { DataAnonymizer } from './utils/data-anonymizer';
import { AnalyticsController } from './controllers/analytics.controller';
import { UserActivity } from './entities/user-activity.entity';
import { AnalyticsSession } from './entities/session.entity';
import { AnalyticsMetric } from './entities/metrics.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserActivity,
      AnalyticsSession,
      AnalyticsMetric,
    ]),
  ],
  providers: [
    AnalyticsDbService,
    ActivityService,
    MetricsService,
    PrivacyPreferencesService,
    DataRetentionService,
    DataAnonymizer,
    AnalyticsController,
  ],
  exports: [
    AnalyticsDbService,
    ActivityService,
    MetricsService,
    PrivacyPreferencesService,
    DataRetentionService,
    DataAnonymizer,
    AnalyticsController,
    TypeOrmModule,
  ],
})
export class AnalyticsModule {}
