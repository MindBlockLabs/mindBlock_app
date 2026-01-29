// backend/src/quests/providers/complete-daily-quest.provider.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DailyQuest } from '../entities/daily-quest.entity';
import { User } from '../../users/user.entity';
import { UpdateStreakProvider } from '../../streak/providers/update-streak.provider';
import { CompleteDailyQuestResponseDto } from '../dtos/complete-daily-quest.dto';

@Injectable()
export class CompleteDailyQuestProvider {
  private readonly logger = new Logger(CompleteDailyQuestProvider.name);
  private readonly BONUS_XP = 100;

  constructor(
    @InjectRepository(DailyQuest)
    private readonly dailyQuestRepository: Repository<DailyQuest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly updateStreakProvider: UpdateStreakProvider,
    private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string): Promise<CompleteDailyQuestResponseDto> {
    const todayDate = this.getTodayDateString();
    this.logger.log(
      `Attempting to complete daily quest for user ${userId} on ${todayDate}`,
    );

    // Parse userId to number for streak operations
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Use transaction to ensure atomicity
    const transactionResult = await this.dataSource.transaction(
      async (manager) => {
        // 1. Find today's quest
        const quest = await manager.findOne(DailyQuest, {
          where: { userId: userId, questDate: todayDate },
          lock: { mode: 'pessimistic_write' }, // Lock for update
        });

        if (!quest) {
          throw new NotFoundException(
            `No daily quest found for user ${userId} on ${todayDate}`,
          );
        }

        // 2. Validate completion criteria
        if (quest.completedQuestions !== quest.totalQuestions) {
          throw new BadRequestException(
            `Quest not fully completed. Progress: ${quest.completedQuestions}/${quest.totalQuestions}`,
          );
        }

        // 3. Check idempotency - already completed
        if (quest.isCompleted && quest.completedAt) {
          this.logger.log(
            `Quest already completed for user ${userId}, returning cached result`,
          );

          // Return existing completion data
          const streak = await this.updateStreakProvider.getStreak(
            userIdNumber,
          );
          return {
            isAlreadyCompleted: true,
            success: true,
            message: 'Daily quest already completed',
            bonusXp: this.BONUS_XP,
            totalXp: quest.pointsEarned,
            streakInfo: {
              currentStreak: streak?.currentStreak || 0,
              longestStreak: streak?.longestStreak || 0,
              lastActivityDate: streak?.lastActivityDate || todayDate,
            },
            completedAt: quest.completedAt,
          };
        }

        // 4. Mark quest as completed
        quest.isCompleted = true;
        quest.completedAt = new Date();
        quest.pointsEarned += this.BONUS_XP; // Add bonus XP
        await manager.save(DailyQuest, quest);

        this.logger.log(
          `Quest marked complete for user ${userId}, awarded ${this.BONUS_XP} bonus XP`,
        );

        // 5. Update user XP
        const user = await manager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          throw new NotFoundException(`User ${userId} not found`);
        }

        user.xp += this.BONUS_XP;
        // Simple level calculation: level = floor(xp / 100) + 1
        user.level = Math.floor(user.xp / 100) + 1;
        await manager.save(User, user);

        this.logger.log(
          `Updated user ${userId} XP to ${user.xp}, level ${user.level}`,
        );

        // 6. Return quest data for post-transaction processing
        return {
          isAlreadyCompleted: false,
          userId: userIdNumber,
          completedAt: quest.completedAt,
          totalXp: quest.pointsEarned,
        };
      },
    );

    // Handle already completed case
    if (transactionResult.isAlreadyCompleted) {
      return transactionResult as CompleteDailyQuestResponseDto;
    }

    // 7. Update streak after transaction commits
    const streak = await this.updateStreakProvider.updateStreak(
      transactionResult.userId!,
    );

    this.logger.log(
      `Updated streak for user ${transactionResult.userId}: ${streak.currentStreak} days`,
    );

    // 8. Build response
    return {
      success: true,
      message: 'Daily quest completed successfully!',
      bonusXp: this.BONUS_XP,
      totalXp: transactionResult.totalXp,
      streakInfo: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate:
          streak.lastActivityDate || this.getTodayDateString(),
      },
      completedAt: transactionResult.completedAt,
    };
  }

  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}