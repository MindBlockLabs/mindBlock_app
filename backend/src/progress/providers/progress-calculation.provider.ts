import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { XpLevelService } from '../../users/providers/xp-level.service';

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
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    private readonly xpLevelService: XpLevelService,
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

    const basePoints = puzzle.points;
    const timeLimit = puzzle.timeLimit;

    // Time bonus: up to 20% extra points for fast completion
    // Time penalty: up to 10% reduction for slow completion
    let timeMultiplier = 1.0;

    if (timeSpent <= timeLimit * 0.5) {
      // Completed in half the time or less - 20% bonus
      timeMultiplier = 1.2;
    } else if (timeSpent <= timeLimit * 0.75) {
      // Completed in 75% of time or less - 10% bonus
      timeMultiplier = 1.1;
    } else if (timeSpent > timeLimit) {
      // Exceeded time limit - 10% penalty
      timeMultiplier = 0.9;
    }

    return Math.round(basePoints * timeMultiplier);
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
    const pointsEarned = this.calculatePoints(
      puzzle,
      submitAnswerDto.timeSpent,
      validation.isCorrect,
    );
    validation.pointsEarned = pointsEarned;

    // Create user progress record
    const userProgress = this.userProgressRepository.create({
      userId: submitAnswerDto.userId,
      puzzleId: submitAnswerDto.puzzleId,
      categoryId: submitAnswerDto.categoryId,
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
      .getRawOne<{
        totalAttempts: string;
        correctAttempts: string;
        totalPoints: string;
        averageTimeSpent: string;
      }>();

    if (!stats) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        totalPoints: 0,
        averageTimeSpent: 0,
        accuracy: 0,
      };
    }

    return {
      totalAttempts: Number(stats.totalAttempts) || 0,
      correctAttempts: parseInt(stats.correctAttempts) || 0,
      totalPoints: parseInt(stats.totalPoints) || 0,
      averageTimeSpent: parseFloat(stats.averageTimeSpent) || 0,
      accuracy:
        Number(stats.totalAttempts) > 0
          ? (parseInt(stats.correctAttempts) / parseInt(stats.totalAttempts)) *
            100
          : 0,
    };
  }
}
