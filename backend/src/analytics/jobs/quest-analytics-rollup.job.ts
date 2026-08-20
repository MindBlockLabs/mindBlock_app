import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyQuest } from '../../quests/entities/daily-quest.entity';
import { QuestAnalytics } from '../entities/quest-analytics.entity';

/**
 * Nightly rollup that materializes `QuestAnalytics` rows from raw
 * `DailyQuest` data for the previous day, so quest completion rates can be
 * read cheaply without joining quest tables on every request.
 *
 * Scheduled to run at 00:30 UTC to ensure it runs after quest reset time.
 */
@Injectable()
export class QuestAnalyticsRollupJob {
  private readonly logger = new Logger(QuestAnalyticsRollupJob.name);

  constructor(
    @InjectRepository(DailyQuest)
    private readonly dailyQuestRepository: Repository<DailyQuest>,
    @InjectRepository(QuestAnalytics)
    private readonly questAnalyticsRepository: Repository<QuestAnalytics>,
  ) {}

  @Cron('30 0 * * *') // Runs at 00:30 UTC daily (after quest reset)
  async handleCron(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.rollupForDate(yesterday);
  }

  /**
   * Recomputes the `QuestAnalytics` row for `targetDate`. Safe to re-run
   * for the same day: existing row for that date is replaced rather than
   * appended to.
   */
  async rollupForDate(
    targetDate: Date,
  ): Promise<{ date: string; assignedCount: number; completedCount: number }> {
    const dateStr = targetDate.toISOString().split('T')[0];

    // Count total quests assigned for this date
    const assignedCount = await this.dailyQuestRepository.count({
      where: { questDate: dateStr },
    });

    // Count quests completed for this date
    const completedCount = await this.dailyQuestRepository.count({
      where: { questDate: dateStr, isCompleted: true },
    });

    // Delete existing row for this date (if any)
    await this.questAnalyticsRepository.delete({ date: dateStr });

    // Insert new aggregated row
    const questAnalytics = this.questAnalyticsRepository.create({
      date: dateStr,
      assignedCount,
      completedCount,
    });
    await this.questAnalyticsRepository.save(questAnalytics);

    this.logger.log(
      `Quest analytics rollup for ${dateStr}: ${assignedCount} assigned, ${completedCount} completed`,
    );

    return { date: dateStr, assignedCount, completedCount };
  }
}
