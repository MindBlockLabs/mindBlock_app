import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { GetAnalyticsQueryDto } from '../dto/get-analytics-query.dto';
import { EventTypeBreakdown, AnalyticsBreakdownResponse } from '../dto/analytics-breakdown-response.dto';
import { TimeFilterService } from '../../timefilter/providers/timefilter.service';
// import { TimeFilterService } from '../../timefilter/timefilter.enums/timefilter.enum';

@Injectable()
export class AnalyticsBreakdownService {
  private readonly logger = new Logger(AnalyticsBreakdownService.name);

  // Event type display name mapping
  private readonly eventTypeDisplayNames: Record<string, string> = {
    'question_view': 'Question Viewed',
    'answer_submit': 'Answer Submitted',
    'puzzle_solved': 'Puzzle Solved',
    'streak_milestone': 'Streak Milestone',
    'iq_question_answered': 'IQ Question Answered',
    'session_started': 'Session Started',
    'session_completed': 'Session Completed',
    'user_registered': 'User Registered',
    'user_login': 'User Login',
    'badge_earned': 'Badge Earned',
    'leaderboard_entry': 'Leaderboard Entry',
    'gamification_event': 'Gamification Event',
  };

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
    private readonly timeFilterService: TimeFilterService,
  ) {}

  /**
   * Get analytics breakdown by event type with filtering
   */
  async getBreakdown(query: GetAnalyticsQueryDto): Promise<AnalyticsBreakdownResponse> {
    try {
      // Resolve date range from filters
      const { from, to } = this.timeFilterService.resolveDateRange(
        query.timeFilter,
        query.from,
        query.to,
      );

      // Build query with GROUP BY
      const qb = this.analyticsRepo
        .createQueryBuilder('event')
        .select('event.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count');

      // Apply date filters
      if (from) {
        qb.andWhere('event.createdAt >= :from', { from });
      }

      if (to) {
        qb.andWhere('event.createdAt <= :to', { to });
      }

      // Apply user filter
      if (query.userId) {
        qb.andWhere('event.userId = :userId', { userId: query.userId });
      }

      // Apply session filter
      if (query.sessionId) {
        qb.andWhere('event.sessionId = :sessionId', { sessionId: query.sessionId });
      }

      // Group by event type and order by count descending
      qb.groupBy('event.eventType')
        .orderBy('count', 'DESC');

      const rawResults = await qb.getRawMany();

      // Transform results and calculate percentages
      const breakdown = await this.transformBreakdownResults(rawResults);

      // Get total events count for percentage calculation
      const totalEvents = breakdown.reduce((sum, item) => sum + item.count, 0);

      // Calculate percentages
      breakdown.forEach(item => {
        item.percentage = totalEvents > 0 ? Math.round((item.count / totalEvents) * 100 * 10) / 10 : 0;
      });

      // Generate date range string
      const dateRange = this.generateDateRangeString(from, to);

      return {
        breakdown,
        totalEvents,
        uniqueEventTypes: breakdown.length,
        dateRange,
      };
    } catch (error) {
      this.logger.error(`Failed to get analytics breakdown: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Transform raw database results to breakdown format
   */
  private async transformBreakdownResults(rawResults: any[]): Promise<EventTypeBreakdown[]> {
    return rawResults.map(result => ({
      eventType: result.eventType,
      count: parseInt(result.count, 10),
      displayName: this.getDisplayName(result.eventType),
    }));
  }

  /**
   * Get friendly display name for event type
   */
  private getDisplayName(eventType: string): string {
    return this.eventTypeDisplayNames[eventType] || this.formatEventTypeName(eventType);
  }

  /**
   * Format event type name if no mapping exists
   */
  private formatEventTypeName(eventType: string): string {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate human-readable date range string
   */
  private generateDateRangeString(from?: Date, to?: Date): string {
    if (!from && !to) {
      return 'All time';
    }

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    if (from && to) {
      return `${formatDate(from)} to ${formatDate(to)}`;
    } else if (from) {
      return `From ${formatDate(from)}`;
    } else if (to) {
      return `Until ${formatDate(to)}`;
    }

    return 'All time';
  }

  /**
   * Get all available event types for reference
   */
  async getAvailableEventTypes(): Promise<string[]> {
    try {
      const result = await this.analyticsRepo
        .createQueryBuilder('event')
        .select('DISTINCT event.eventType', 'eventType')
        .orderBy('event.eventType', 'ASC')
        .getRawMany();

      return result.map(r => r.eventType);
    } catch (error) {
      this.logger.error(`Failed to get available event types: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get breakdown for specific event types only
   */
  async getBreakdownForEventTypes(
    eventTypes: string[],
    query: GetAnalyticsQueryDto,
  ): Promise<AnalyticsBreakdownResponse> {
    try {
      const { from, to } = this.timeFilterService.resolveDateRange(
        query.timeFilter,
        query.from,
        query.to,
      );

      const qb = this.analyticsRepo
        .createQueryBuilder('event')
        .select('event.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .where('event.eventType IN (:...eventTypes)', { eventTypes });

      // Apply date filters
      if (from) {
        qb.andWhere('event.createdAt >= :from', { from });
      }

      if (to) {
        qb.andWhere('event.createdAt <= :to', { to });
      }

      // Apply user filter
      if (query.userId) {
        qb.andWhere('event.userId = :userId', { userId: query.userId });
      }

      // Apply session filter
      if (query.sessionId) {
        qb.andWhere('event.sessionId = :sessionId', { sessionId: query.sessionId });
      }

      qb.groupBy('event.eventType')
        .orderBy('count', 'DESC');

      const rawResults = await qb.getRawMany();
      const breakdown = await this.transformBreakdownResults(rawResults);

      const totalEvents = breakdown.reduce((sum, item) => sum + item.count, 0);

      breakdown.forEach(item => {
        item.percentage = totalEvents > 0 ? Math.round((item.count / totalEvents) * 100 * 10) / 10 : 0;
      });

      const dateRange = this.generateDateRangeString(from, to);

      return {
        breakdown,
        totalEvents,
        uniqueEventTypes: breakdown.length,
        dateRange,
      };
    } catch (error) {
      this.logger.error(`Failed to get breakdown for specific event types: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get top N event types by count
   */
  async getTopEventTypes(limit: number = 10, query: GetAnalyticsQueryDto): Promise<EventTypeBreakdown[]> {
    try {
      const { from, to } = this.timeFilterService.resolveDateRange(
        query.timeFilter,
        query.from,
        query.to,
      );

      const qb = this.analyticsRepo
        .createQueryBuilder('event')
        .select('event.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count');

      // Apply date filters
      if (from) {
        qb.andWhere('event.createdAt >= :from', { from });
      }

      if (to) {
        qb.andWhere('event.createdAt <= :to', { to });
      }

      // Apply user filter
      if (query.userId) {
        qb.andWhere('event.userId = :userId', { userId: query.userId });
      }

      // Apply session filter
      if (query.sessionId) {
        qb.andWhere('event.sessionId = :sessionId', { sessionId: query.sessionId });
      }

      qb.groupBy('event.eventType')
        .orderBy('count', 'DESC')
        .limit(limit);

      const rawResults = await qb.getRawMany();
      return await this.transformBreakdownResults(rawResults);
    } catch (error) {
      this.logger.error(`Failed to get top event types: ${error.message}`, error.stack);
      throw error;
    }
  }
} 