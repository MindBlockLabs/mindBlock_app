import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalyticsDbService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsDbService.name);
  
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const analyticsConfig = this.configService.get('analytics');
    
    if (!analyticsConfig) {
      this.logger.warn('Analytics configuration not found. Analytics tracking will be disabled.');
      return;
    }

    // Check if analytics DB is configured
    const isAnalyticsEnabled = !!analyticsConfig.url || !!analyticsConfig.name;
    
    if (!isAnalyticsEnabled) {
      this.logger.log('Analytics database not configured. Falling back to main database.');
      return;
    }

    this.logger.log('Analytics database connection initialized');
  }

  /**
   * Check if analytics database is available
   */
  isAnalyticsEnabled(): boolean {
    const analyticsConfig = this.configService.get('analytics');
    return !!analyticsConfig && (!!analyticsConfig.url || !!analyticsConfig.name);
  }

  /**
   * Get data retention period in days
   */
  getDataRetentionDays(): number {
    const analyticsConfig = this.configService.get('analytics');
    return analyticsConfig?.dataRetentionDays || 90;
  }

  /**
   * Check if DNT header should be respected
   */
  shouldRespectDntHeader(): boolean {
    const analyticsConfig = this.configService.get('analytics');
    return analyticsConfig?.respectDntHeader !== false;
  }

  /**
   * Get default opt-out status
   */
  isOptOutByDefault(): boolean {
    const analyticsConfig = this.configService.get('analytics');
    return analyticsConfig?.optOutByDefault || false;
  }
}
