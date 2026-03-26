import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivityService } from './activity.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly activityService: ActivityService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Daily cleanup job - runs at 2 AM UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Starting daily data retention cleanup...');
      
      // Delete expired activities
      const deletedCount = await this.activityService.deleteExpiredActivities();
      
      this.logger.log(`Data retention cleanup completed. Deleted ${deletedCount} expired records.`);
      
      // Calculate and save daily metrics for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await this.metricsService.calculateAndSaveDailyMetrics(yesterday);
      
      this.logger.log('Daily metrics calculation completed.');
    } catch (error) {
      this.logger.error(`Data retention job failed: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
