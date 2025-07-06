import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DailyStreakService } from '../providers/daily-streak.service';
import { PuzzleSubmissionDto } from '../dto/puzzle-submission.dto';

@Injectable()
export class StreakListener {
  private readonly logger = new Logger(StreakListener.name);

  constructor(private readonly streakService: DailyStreakService) {}

  @OnEvent('puzzle.submitted')
  async handlePuzzleSubmission(puzzleSubmission: PuzzleSubmissionDto): Promise<void> {
    try {
      // Only update streak if the puzzle was solved correctly
      if (puzzleSubmission.isCorrect) {
        await this.streakService.updateStreak(puzzleSubmission.userId.toString());
        this.logger.log(`Streak updated for user ${puzzleSubmission.userId} after puzzle submission`);
      }
    } catch (error) {
      this.logger.error(`Failed to update streak for user ${puzzleSubmission.userId}:`, error);
      // Don't throw error to avoid breaking the puzzle submission flow
    }
  }

  @OnEvent('iq.question.answered')
  async handleIQQuestionAnswered(data: { userId: string; isCorrect: boolean }): Promise<void> {
    try {
      // Only update streak if the question was answered correctly
      if (data.isCorrect) {
        await this.streakService.updateStreak(data.userId.toString());
        this.logger.log(`Streak updated for user ${data.userId} after IQ question`);
      }
    } catch (error) {
      this.logger.error(`Failed to update streak for user ${data.userId}:`, error);
      // Don't throw error to avoid breaking the IQ assessment flow
    }
  }
} 