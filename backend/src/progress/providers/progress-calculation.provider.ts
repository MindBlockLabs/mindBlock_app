import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { UserProgress } from '../entities/progress.entity';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { User } from '../../users/user.entity';
import { Streak } from '../../streak/entities/streak.entity';
import { DailyQuest } from '../../quests/entities/daily-quest.entity';
import { getPointsByDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';

export interface AnswerValidationResult {
  isCorrect: boolean;
  pointsEarned: number;
  normalizedAnswer: string;
}

export interface ProgressCalculationResult {
  userProgress: UserProgress;
  validation: AnswerValidationResult;
}

interface ProgressStatsRaw {
  totalAttempts: string;
  correctAttempts: string;
  totalPoints: string;
  averageTimeSpent: string;
}

@Injectable()
export class ProgressCalculationProvider {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
    @InjectRepository(DailyQuest)
    private readonly dailyQuestRepository: Repository<DailyQuest>,
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
   * Calculates level based on total XP
   */
  calculateLevel(totalXP: number): number {
    if (totalXP < 1000) return 1;
    if (totalXP < 2500) return 2;
    if (totalXP < 5000) return 3;
    if (totalXP < 10000) return 4;

    // Level 5+: Exponential scaling: 10000 + (level - 4) * some_growth
    // Simplified: level 5 starts at 10000, each level after adds 5000+
    return Math.floor((totalXP - 10000) / 5000) + 5;
  }

  /**
   * Processes answer submission and creates user progress record
   */
  async processAnswerSubmission(
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<ProgressCalculationResult> {
    // Get puzzle to validate against
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: submitAnswerDto.puzzleId },
    });

    // In processAnswerSubmission, check for recent duplicate:
    const recentAttempt = await this.userProgressRepository.findOne({
      where: {
        userId: submitAnswerDto.userId,
        puzzleId: submitAnswerDto.puzzleId,
        attemptedAt: MoreThan(new Date(Date.now() - 5000)), // 5 second window
      },
    });

    if (!puzzle) {
      throw new NotFoundException(
        `Puzzle with ID ${submitAnswerDto.puzzleId} not found`,
      );
    }

    if (recentAttempt) {
      throw new Error('Duplicate submission detected');
    }

    // Validate answer
    const validation = this.validateAnswer(
      submitAnswerDto.userAnswer,
      puzzle.correctAnswer,
    );

    // Calculate points
    let pointsEarned = this.calculatePoints(
      puzzle,
      submitAnswerDto.timeSpent,
      validation.isCorrect,
    );

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

      // Update User XP and Level
      user.xp += pointsEarned;
      user.level = this.calculateLevel(user.xp);
      await this.userRepository.save(user);
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
              user.xp += 50;
              user.level = this.calculateLevel(user.xp);
              await this.userRepository.save(user);
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

    return {
      userProgress,
      validation,
    };
  }

  /**
   * Gets user progress statistics for a category
   */
  async getUserProgressStats(userId: string, categoryId: string) {
    const stats = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select('COUNT(*)', 'totalAttempts')
      .addSelect(
        'SUM(CASE WHEN progress.isCorrect = true THEN 1 ELSE 0 END)',
        'correctAttempts',
      )
      .addSelect('SUM(progress.pointsEarned)', 'totalPoints')
      .addSelect('AVG(progress.timeSpent)', 'averageTimeSpent')
      .where('progress.userId = :userId', { userId })
      .andWhere('progress.categoryId = :categoryId', { categoryId })
      .getRawOne<ProgressStatsRaw>();

    return {
      totalAttempts: Number(stats?.totalAttempts) || 0,
      correctAttempts: parseInt(stats?.correctAttempts || '0', 10),
      totalPoints: parseInt(stats?.totalPoints || '0', 10),
      averageTimeSpent: parseFloat(stats?.averageTimeSpent || '0'),
      accuracy:
        stats && Number(stats.totalAttempts) > 0
          ? (parseInt(stats.correctAttempts, 10) /
              Number(stats.totalAttempts)) *
            100
          : 0,
    };
  }
}
