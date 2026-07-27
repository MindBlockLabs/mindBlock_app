import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { DailyActiveUser } from '../entities/daily-active-user.entity';

/**
 * Nightly rollup that materializes `DailyActiveUser` rows from raw
 * `AnalyticsEvent` data for the previous day, so DAU can be read cheaply
 * without scanning raw events on every dashboard load.
 */
@Injectable()
export class DailyActiveUsersRollupJob {
  private readonly logger = new Logger(DailyActiveUsersRollupJob.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(DailyActiveUser)
    private readonly dailyActiveUserRepository: Repository<DailyActiveUser>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.rollupForDate(yesterday);
  }

  /**
   * Recomputes the `DailyActiveUser` rows for `targetDate`. Safe to re-run
   * for the same day: existing rows for that date are replaced rather than
   * appended to.
   */
  async rollupForDate(
    targetDate: Date,
  ): Promise<{ date: string; rowsWritten: number }> {
    const dateStr = targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const events = await this.analyticsEventRepository.find({
      select: ['userId'],
      where: { timestamp: Between(startOfDay, endOfDay) },
    });

    const distinctUserIds = Array.from(
      new Set(events.map((event) => event.userId)),
    );

    await this.dailyActiveUserRepository.delete({ date: dateStr });
    if (distinctUserIds.length > 0) {
      const rows = distinctUserIds.map((userId) =>
        this.dailyActiveUserRepository.create({ date: dateStr, userId }),
      );
      await this.dailyActiveUserRepository.save(rows);
    }

    this.logger.log(
      `DAU rollup for ${dateStr}: ${distinctUserIds.length} rows written`,
    );

    return { date: dateStr, rowsWritten: distinctUserIds.length };
  }
}
