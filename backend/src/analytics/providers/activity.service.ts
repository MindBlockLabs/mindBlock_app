import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserActivity, AnalyticsSession, EventType, EventCategory, ConsentStatus } from '../entities';
import { AnalyticsDbService } from './analytics-db.service';

export interface CreateActivityDto {
  userId?: string;
  sessionId: string;
  eventType: EventType;
  eventCategory: EventCategory;
  duration?: number;
  metadata?: Record<string, any>;
  browser?: string;
  os?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  platform?: 'web' | 'mobile_web' | 'pwa' | 'api';
  country?: string;
  city?: string;
  anonymizedIp?: string;
  userAgent?: string;
  referrer?: string;
  isAnonymous?: boolean;
  consentStatus?: ConsentStatus;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(AnalyticsSession)
    private readonly sessionRepository: Repository<AnalyticsSession>,
    private readonly dataSource: DataSource,
    private readonly analyticsDbService: AnalyticsDbService,
  ) {}

  /**
   * Record a user activity asynchronously
   */
  async recordActivity(activityData: CreateActivityDto): Promise<UserActivity> {
    const { userId, sessionId, ...rest } = activityData;

    // Calculate data retention expiry date
    const retentionDays = this.analyticsDbService.getDataRetentionDays();
    const dataRetentionExpiry = new Date();
    dataRetentionExpiry.setDate(dataRetentionExpiry.getDate() + retentionDays);

    const activity = this.activityRepository.create({
      userId,
      sessionId,
      dataRetentionExpiry,
      ...rest,
      timestamp: new Date(),
    });

    // Save asynchronously (non-blocking for performance)
    return await this.activityRepository.save(activity);
  }

  /**
   * Batch record multiple activities
   */
  async batchRecordActivities(activities: CreateActivityDto[]): Promise<UserActivity[]> {
    if (activities.length === 0) {
      return [];
    }

    const retentionDays = this.analyticsDbService.getDataRetentionDays();
    const now = new Date();
    const dataRetentionExpiry = new Date();
    dataRetentionExpiry.setDate(dataRetentionExpiry.getDate() + retentionDays);

    const activitiesToSave = activities.map(data => ({
      ...data,
      timestamp: now,
      dataRetentionExpiry,
    }));

    return await this.activityRepository.save(activitiesToSave);
  }

  /**
   * Create or update a session
   */
  async upsertSession(sessionData: {
    userId?: string;
    sessionId: string;
    anonymizedIp?: string;
    userAgent?: string;
    browser?: string;
    os?: string;
    deviceType?: string;
    platform?: string;
    country?: string;
    city?: string;
    isAnonymous?: boolean;
    consentStatus?: ConsentStatus;
  }): Promise<AnalyticsSession> {
    let session = await this.sessionRepository.findOne({
      where: { sessionId: sessionData.sessionId },
    });

    if (session) {
      // Update existing session
      session.lastActivityAt = new Date();
      session.activityCount += 1;
      
      if (sessionData.consentStatus) {
        session.consentStatus = sessionData.consentStatus;
      }
      
      return await this.sessionRepository.save(session);
    } else {
      // Create new session
      session = this.sessionRepository.create({
        ...sessionData,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        activityCount: 1,
        totalDuration: 0,
      });
      
      return await this.sessionRepository.save(session);
    }
  }

  /**
   * Update session duration
   */
  async updateSessionDuration(sessionId: string, durationMs: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE analytics_sessions 
       SET "totalDuration" = "totalDuration" + $1, 
           "lastActivityAt" = NOW() 
       WHERE "sessionId" = $2`,
      [durationMs, sessionId],
    );
  }

  /**
   * Get activities by user ID
   */
  async getUserActivities(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<UserActivity[]> {
    return await this.activityRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get activities by session ID
   */
  async getSessionActivities(
    sessionId: string,
    limit: number = 100,
  ): Promise<UserActivity[]> {
    return await this.activityRepository.find({
      where: { sessionId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get recent activities with filters
   */
  async getRecentActivities(filters: {
    eventType?: EventType;
    eventCategory?: EventCategory;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<UserActivity[]> {
    const queryBuilder = this.activityRepository.createQueryBuilder('activity');
    
    if (filters.eventType) {
      queryBuilder.andWhere('activity.eventType = :eventType', { eventType: filters.eventType });
    }
    
    if (filters.eventCategory) {
      queryBuilder.andWhere('activity.eventCategory = :eventCategory', { eventCategory: filters.eventCategory });
    }
    
    if (filters.startDate) {
      queryBuilder.andWhere('activity.timestamp >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('activity.timestamp <= :endDate', { endDate: filters.endDate });
    }
    
    return await queryBuilder
      .orderBy('activity.timestamp', 'DESC')
      .limit(filters.limit || 100)
      .getMany();
  }

  /**
   * Delete old activities based on retention policy
   */
  async deleteExpiredActivities(): Promise<number> {
    const cutoffDate = new Date();
    const retentionDays = this.analyticsDbService.getDataRetentionDays();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.activityRepository
      .createQueryBuilder('activity')
      .delete()
      .where('activity.dataRetentionExpiry < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Deleted ${result.affected || 0} expired activities`);
    return result.affected || 0;
  }

  /**
   * Get activity count for metrics
   */
  async getActivityCount(filters: {
    startDate?: Date;
    endDate?: Date;
    eventType?: EventType;
  }): Promise<number> {
    const queryBuilder = this.activityRepository.createQueryBuilder('activity');
    
    if (filters.startDate) {
      queryBuilder.andWhere('activity.timestamp >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('activity.timestamp <= :endDate', { endDate: filters.endDate });
    }
    
    if (filters.eventType) {
      queryBuilder.andWhere('activity.eventType = :eventType', { eventType: filters.eventType });
    }
    
    return await queryBuilder.getCount();
  }
}
