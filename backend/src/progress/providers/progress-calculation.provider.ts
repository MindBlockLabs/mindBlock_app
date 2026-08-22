import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { UserProgress } from '../entities/progress.entity';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { XpLevelService } from '../../users/providers/xp-level.service';
import { User } from '../../users/user.entity';
import { DailyQuest } from '../../quests/entities/daily-quest.entity';
import { getPointsByDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';
import { ScoreService } from '../../score/providers/score.service';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

export interface AnswerValidationResult {
  isCorrect: boolean;
  pointsEarned: number;
  normalizedAnswer: string;
}

export interface ProgressCalculationResult {
  userProgress: UserProgress;
  validation: AnswerValidationResult;
}

@Injectable()
export class ProgressCalculationProvider {
  private readonly logger = new Logger(ProgressCalculationProvider.name);

  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    private readonly xpLevelService: XpLevelService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DailyQuest)
    private readonly dailyQuestRepository: Repository<DailyQuest>,
    private readonly scoreService: ScoreService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Validates user answer against puzzle correct answer
   * Trims whitespace and performs case-insensitive comparison
   */
  validateAnswer(
    userAnswer: string,
    correctAnswer: string,
  ): AnswerValidationResult {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    return {
      isCorrect,
      pointsEarned: 0, // Will be calculated separately
      normalizedAnswer: normalizedUserAnswer,
    };
  }

  /**
   * Calculates points based on puzzle difficulty and time spent
   * Base points from puzzle difficulty with optional time bonus/penalty
   */
  calculatePoints(
    puzzle: Puzzle,
    timeSpent: number,
    isCorrect: boolean,
  ): number {
    if (!isCorrect) {
      return 0;
    }

    const basePoints = getPointsByDifficulty(puzzle.difficulty);
    const timeLimit = puzzle.timeLimit;

    // Time bonus: (timeLimit - timeSpent) / timeLimit * 0.5 (max 0.5 bonus)
    let timeBonusMultiplier = 0;
    if (timeSpent < timeLimit) {
      timeBonusMultiplier = ((timeLimit - timeSpent) / timeLimit) * 0.5;
    }

    // Accuracy multiplier (currently 1.0 for correct, 0.0 for incorrect)
    const accuracyMultiplier = 1.0;

    return Math.round(
      basePoints * (1 + timeBonusMultiplier) * accuracyMultiplier,
    );
  }

  /**
   * Processes answer submission and creates user progress record.
   *
   * Uses idempotency to prevent duplicate XP awards and progress records.
   * If an idempotencyKey is provided, it is used directly; otherwise a
   * deterministic key is derived from userId + puzzleId + userAnswer + timeSpent.
   */
  async processAnswerSubmission(
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<ProgressCalculationResult> {
    const idempotencyKey =
      submitAnswerDto.idempotencyKey ??
      this.deriveIdempotencyKey(submitAnswerDto);

    const { duplicate, data: result } =
      await this.idempotencyService.execute<ProgressCalculationResult>(
        `progress-submit:${idempotencyKey}`,
        () => this.processAnswerSubmissionInternal(submitAnswerDto),
      );

    if (duplicate) {
      this.logger.log(
        `Duplicate progress submission detected for key: ${idempotencyKey}. Returning cached result.`,
      );
    }

    return result;
  }

  /**
   * Internal method that performs the actual progress processing logic.
   * Called inside an idempotency guard — only executes once per key.
   */
  private async processAnswerSubmissionInternal(
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<ProgressCalculationResult> {
    // Get puzzle to validate against
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: submitAnswerDto.puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException(
        `Puzzle with ID ${submitAnswerDto.puzzleId} not found`,
      );
    }

    // Validate answer
    const validation = this.validateAnswer(
      submitAnswerDto.userAnswer,
      puzzle.correctAnswer,
    );

    // Calculate points
    const basePoints = this.calculatePoints(
      puzzle,
      submitAnswerDto.timeSpent,
      validation.isCorrect,
    );

    const scoreResult = this.scoreService.calculateScore({
      correct: validation.isCorrect,
      basePoints,
    });

    let pointsEarned = scoreResult.score;

    // Fetch user and apply streak bonus
    const user = await this.userRepository.findOne({
      where: { id: submitAnswerDto.userId },
      relations: ['streak'],
    });

    if (user && validation.isCorrect) {
      const streakCount = user.streak?.currentStreak || 0;

      let streakMultiplier = 0;

      if (streakCount >= 7) {
        streakMultiplier = 0.25;
      } else if (streakCount >= 3) {
        streakMultiplier = 0.1;
      }

      pointsEarned = Math.round(pointsEarned * (1 + streakMultiplier));
    }

    validation.pointsEarned = pointsEarned;

    // Check for Daily Quest completion
    const todayDate = new Date().toISOString().split('T')[0];
    const dailyQuest = await this.dailyQuestRepository.findOne({
      where: { userId: submitAnswerDto.userId, questDate: todayDate },
      relations: ['questPuzzles'],
    });

    if (dailyQuest && !dailyQuest.isCompleted) {
      const isQuestPuzzle = dailyQuest.questPuzzles.some(
        (qp) => qp.puzzleId === submitAnswerDto.puzzleId,
      );

      if (isQuestPuzzle && validation.isCorrect) {
        // Double check if this puzzle was already completed today for this quest
        const alreadyCompleted = await this.userProgressRepository.findOne({
          where: {
            userId: submitAnswerDto.userId,
            puzzleId: submitAnswerDto.puzzleId,
            dailyQuestId: dailyQuest.id,
            isCorrect: true,
          },
        });

        if (!alreadyCompleted) {
          dailyQuest.completedQuestions += 1;
          if (dailyQuest.completedQuestions >= dailyQuest.totalQuestions) {
            dailyQuest.isCompleted = true;
            dailyQuest.completedAt = new Date();
            // Award bonus XP for daily quest completion (e.g., 50 XP as hinted in "completion screen")
            if (user) {
              await this.xpLevelService.addXp(user.id, 50);
            }
          }
          await this.dailyQuestRepository.save(dailyQuest);
        }
      }
    }

    // Create user progress record
    const userProgress = this.userProgressRepository.create({
      userId: submitAnswerDto.userId,
      puzzleId: submitAnswerDto.puzzleId,
      categoryId: submitAnswerDto.categoryId,
      dailyQuestId: dailyQuest?.id,
      isCorrect: validation.isCorrect,
      userAnswer: submitAnswerDto.userAnswer,
      pointsEarned,
      timeSpent: submitAnswerDto.timeSpent,
      attemptedAt: new Date(),
    });

    // Save to database
    await this.userProgressRepository.save(userProgress);

    if (validation.isCorrect && pointsEarned > 0) {
      await this.xpLevelService.addXp(submitAnswerDto.userId, pointsEarned);
    }

    return {
      userProgress,
      validation,
    };
  }

  /**
   * Derives a deterministic idempotency key from request parameters.
   * This ensures the same logical answer submission is only processed once,
   * even when the client doesn't provide an explicit idempotency key.
   */
  private deriveIdempotencyKey(dto: SubmitAnswerDto): string {
    const payload = `${dto.userId}:${dto.puzzleId}:${dto.userAnswer}:${dto.timeSpent}`;
    return createHash('sha256').update(payload).digest('hex').slice(0, 32);
  }

  /**
   * Gets user progress statistics for a category
   */
  async getUserProgressStats(userId: string, categoryId: string) {
    const where = {
      userId,
      categoryId,
    };

    const progressRecords = await this.userProgressRepository.find({ where });

    if (progressRecords.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        totalPoints: 0,
        averageTimeSpent: 0,
        accuracy: 0,
      };
    }

    const totalAttempts = progressRecords.length;
    const correctAttempts = progressRecords.reduce(
      (sum, record) => sum + (record.isCorrect ? 1 : 0),
      0,
    );
    const totalPoints = progressRecords.reduce(
      (sum, record) => sum + record.pointsEarned,
      0,
    );
    const totalTimeSpent = progressRecords.reduce(
      (sum, record) => sum + record.timeSpent,
      0,
    );
    const averageTimeSpent =
      totalAttempts > 0 ? totalTimeSpent / totalAttempts : 0;

    const accuracy =
      totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    return {
      totalAttempts,
      correctAttempts,
      totalPoints,
      averageTimeSpent,
      accuracy,
    };
  }
}
