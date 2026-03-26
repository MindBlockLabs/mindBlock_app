import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AnalyticsMetric } from '../entities/metrics.entity';
import { UserActivity } from '../entities/user-activity.entity';
import { AnalyticsSession } from '../entities/session.entity';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(AnalyticsMetric)
    private readonly metricRepository: Repository<AnalyticsMetric>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(AnalyticsSession)
    private readonly sessionRepository: Repository<AnalyticsSession>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Calculate Daily Active Users (DAU)
   */
  async calculateDau(date: Date = new Date()): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const uniqueUsers = await this.activityRepository
      .createQueryBuilder('activity')
      .select('COUNT(DISTINCT activity.userId)', 'count')
      .where('activity.timestamp >= :start', { start: startOfDay })
      .andWhere('activity.timestamp <= :end', { end: endOfDay })
      .andWhere('activity.userId IS NOT NULL')
      .getRawOne();

    return parseInt(uniqueUsers.count, 10) || 0;
  }

  /**
   * Calculate Weekly Active Users (WAU)
   */
  async calculateWau(date: Date = new Date()): Promise<number> {
    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const uniqueUsers = await this.activityRepository
      .createQueryBuilder('activity')
      .select('COUNT(DISTINCT activity.userId)', 'count')
      .where('activity.timestamp >= :start', { start: startOfWeek })
      .andWhere('activity.timestamp <= :end', { end: endOfWeek })
      .andWhere('activity.userId IS NOT NULL')
      .getRawOne();

    return parseInt(uniqueUsers.count, 10) || 0;
  }

  /**
   * Calculate average session duration for a given date
   */
  async calculateAverageSessionDuration(date: Date = new Date()): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .select('AVG(session."totalDuration")', 'avg')
      .where('session.startedAt >= :start', { start: startOfDay })
      .andWhere('session.startedAt <= :end', { end: endOfDay })
      .getRawOne();

    return Math.round(parseFloat(result.avg) || 0);
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsageStatistics(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.eventCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('activity.timestamp >= :start', { start: startDate })
      .andWhere('activity.timestamp <= :end', { end: endDate })
      .groupBy('activity.eventCategory')
      .orderBy('count', 'DESC')
      .getRawMany();

    const stats: Record<string, number> = {};
    result.forEach(row => {
      stats[row.category] = parseInt(row.count, 10);
    });

    return stats;
  }

  /**
   * Get event type distribution
   */
  async getEventTypeDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('activity.timestamp >= :start', { start: startDate })
      .andWhere('activity.timestamp <= :end', { end: endDate })
      .groupBy('activity.eventType')
      .getRawMany();

    const distribution: Record<string, number> = {};
    result.forEach(row => {
      distribution[row.type] = parseInt(row.count, 10);
    });

    return distribution;
  }

  /**
   * Get platform distribution
   */
  async getPlatformDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('activity.timestamp >= :start', { start: startDate })
      .andWhere('activity.timestamp <= :end', { end: endDate })
      .groupBy('activity.platform')
      .getRawMany();

    const distribution: Record<string, number> = {};
    result.forEach(row => {
      distribution[row.platform] = parseInt(row.count, 10);
    });

    return distribution;
  }

  /**
   * Get device distribution
   */
  async getDeviceDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.deviceType', 'device')
      .addSelect('COUNT(*)', 'count')
      .where('activity.timestamp >= :start', { start: startDate })
      .andWhere('activity.timestamp <= :end', { end: endDate })
      .groupBy('activity.deviceType')
      .getRawMany();

    const distribution: Record<string, number> = {};
    result.forEach(row => {
      distribution[row.device] = parseInt(row.count, 10);
    });

    return distribution;
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, { total: number; cities: Record<string, number> }>> {
    const countryResult = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('activity.timestamp >= :start', { start: startDate })
      .andWhere('activity.timestamp <= :end', { end: endDate })
      .andWhere('activity.country IS NOT NULL')
      .groupBy('activity.country')
      .getRawMany();

    const cityResult = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.city', 'city')
      .addSelect('activity.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('activity.timestamp >= :start', { start: startDate })
      .andWhere('activity.timestamp <= :end', { end: endDate })
      .andWhere('activity.city IS NOT NULL')
      .groupBy('activity.city, activity.country')
      .getRawMany();

    const distribution: Record<string, { total: number; cities: Record<string, number> }> = {};
    
    countryResult.forEach(row => {
      distribution[row.country] = { total: parseInt(row.count, 10), cities: {} };
    });

    cityResult.forEach(row => {
      if (distribution[row.country]) {
        distribution[row.country].cities[row.city] = parseInt(row.count, 10);
      }
    });

    return distribution;
  }

  /**
   * Save metric to database
   */
  async saveMetric(metricData: {
    date: string;
    metricType: string;
    value: Record<string, any>;
    period?: string;
    count?: number;
    sum?: number;
    breakdown?: Record<string, any>;
  }): Promise<AnalyticsMetric> {
    const metric = this.metricRepository.create(metricData);
    return await this.metricRepository.save(metric);
  }

  /**
   * Get metrics by date range
   */
  async getMetricsByDateRange(
    startDate: Date,
    endDate: Date,
    metricType?: string,
  ): Promise<AnalyticsMetric[]> {
    const queryBuilder = this.metricRepository.createQueryBuilder('metric');
    
    queryBuilder.where('metric.date >= :start', { start: this.formatDate(startDate) })
      .andWhere('metric.date <= :end', { end: this.formatDate(endDate) });
    
    if (metricType) {
      queryBuilder.andWhere('metric.metricType = :type', { type: metricType });
    }
    
    return await queryBuilder.orderBy('metric.date', 'DESC').getMany();
  }

  /**
   * Calculate and save all daily metrics
   */
  async calculateAndSaveDailyMetrics(date: Date = new Date()): Promise<void> {
    const dateStr = this.formatDate(date);
    
    try {
      // DAU
      const dau = await this.calculateDau(date);
      await this.saveMetric({
        date: dateStr,
        metricType: 'dau',
        value: { count: dau },
        count: dau,
      });

      // WAU
      const wau = await this.calculateWau(date);
      await this.saveMetric({
        date: dateStr,
        metricType: 'wau',
        value: { count: wau },
        count: wau,
      });

      // Average session duration
      const avgDuration = await this.calculateAverageSessionDuration(date);
      await this.saveMetric({
        date: dateStr,
        metricType: 'session_duration_avg',
        value: { average: avgDuration },
        sum: avgDuration,
      });

      // Feature usage
      const featureUsage = await this.getFeatureUsageStatistics(
        new Date(dateStr),
        new Date(dateStr + 'T23:59:59.999Z'),
      );
      await this.saveMetric({
        date: dateStr,
        metricType: 'feature_usage',
        value: featureUsage,
        breakdown: featureUsage,
      });

      // Platform distribution
      const platformDist = await this.getPlatformDistribution(
        new Date(dateStr),
        new Date(dateStr + 'T23:59:59.999Z'),
      );
      await this.saveMetric({
        date: dateStr,
        metricType: 'platform_distribution',
        value: platformDist,
        breakdown: platformDist,
      });

      // Device distribution
      const deviceDist = await this.getDeviceDistribution(
        new Date(dateStr),
        new Date(dateStr + 'T23:59:59.999Z'),
      );
      await this.saveMetric({
        date: dateStr,
        metricType: 'device_distribution',
        value: deviceDist,
        breakdown: deviceDist,
      });

      this.logger.log(`Daily metrics calculated for ${dateStr}`);
    } catch (error) {
      this.logger.error(`Error calculating daily metrics: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
