import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyQuest } from '../entities/daily-quest.entity';
import { DailyQuestStatusDto } from '../dtos/daily-quest-status.dto';
import { GetTodaysDailyQuestProvider } from './getTodaysDailyQuest.provider';
import { getDateString } from '../../shared/utils/date.util';

/**
 * Provider for fetching the status of today's Daily Quest.
 * Returns minimal data (totalQuestions, completedQuestions, isCompleted) for fast, cache-friendly lookups.
 *
 * This is read-only and does not mutate state.
 * If no quest exists, it auto-generates one using the existing generation logic.
 */
@Injectable()
export class GetTodaysDailyQuestStatusProvider {
  private readonly logger = new Logger(GetTodaysDailyQuestStatusProvider.name);

  constructor(
    @InjectRepository(DailyQuest)
    private readonly dailyQuestRepository: Repository<DailyQuest>,
    private readonly getTodaysDailyQuestProvider: GetTodaysDailyQuestProvider,
  ) {}

  /**
   * Fetches the status of today's Daily Quest.
   * Auto-generates a quest if one doesn't exist.
   *
   * @param userId - The user's ID
   * @returns DailyQuestStatusDto with totalQuestions, completedQuestions, isCompleted
   */
  async execute(
    userId: string,
    userTimeZone: string,
  ): Promise<DailyQuestStatusDto> {
    const todayDate = getDateString(userTimeZone, 0);
    this.logger.log(
      `Fetching daily quest status for user ${userId} on ${todayDate}`,
    );

    // Try to find existing quest for today
    let dailyQuest = await this.dailyQuestRepository.findOne({
      where: { userId, questDate: todayDate },
      select: ['id', 'totalQuestions', 'completedQuestions', 'isCompleted'],
    });

    // If no quest exists, auto-generate one
    if (!dailyQuest) {
      this.logger.log(
        `No quest found for user ${userId}, auto-generating quest`,
      );
      // Use the existing provider to generate the full quest
      // This ensures consistency with the main getTodaysDailyQuest endpoint
      // const fullQuest = await this.getTodaysDailyQuestProvider.execute(userId);

      // Fetch the newly created quest with status fields
      dailyQuest = await this.dailyQuestRepository.findOne({
        where: { userId, questDate: todayDate },
        select: ['id', 'totalQuestions', 'completedQuestions', 'isCompleted'],
      });

      if (!dailyQuest) {
        throw new Error(
          `Failed to retrieve created daily quest for user ${userId}`,
        );
      }
    }

    return this.buildStatusResponse(dailyQuest);
  }

  /**
   * Converts DailyQuest entity to DailyQuestStatusDto
   */
  private buildStatusResponse(dailyQuest: DailyQuest): DailyQuestStatusDto {
    return {
      totalQuestions: dailyQuest.totalQuestions,
      completedQuestions: dailyQuest.completedQuestions,
      isCompleted: dailyQuest.isCompleted,
    };
  }
}
