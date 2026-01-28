import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoreThan } from 'typeorm';
import { SubmitPuzzleDto } from '../dtos/submit-puzzle.dto';
import { SubmitPuzzleResponseDto } from '../dtos/submit-puzzle-response.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';
import { UpdateUserXPService, XPUpdateResult } from '../../users/providers/update-user-xp.service';
import { RedisCacheService } from '../../redis/redis-cache.service';

export interface SubmissionResult {
  isCorrect: boolean;
  pointsEarned: number;
  userProgress: UserProgress;
  xpUpdate: XPUpdateResult;
}

@Injectable()
export class SubmitPuzzleProvider {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    private readonly updateUserXPService: UpdateUserXPService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  /**
   * Validates user answer against puzzle correct answer
   * Trims whitespace and performs case-insensitive comparison
   */
  private validateAnswer(
    userAnswer: string,
    correctAnswer: string,
  ): { isCorrect: boolean; normalizedAnswer: string } {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    return {
      isCorrect,
      normalizedAnswer: normalizedUserAnswer,
    };
  }

  /**
   * Calculates points based on puzzle difficulty and time spent
   * Base points from puzzle with optional time bonus/penalty
   */
  private calculatePoints(
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
   * Handles complete puzzle submission workflow
   * 1. Validates puzzle exists
   * 2. Checks for duplicate submissions
   * 3. Validates answer correctness
   * 4. Calculates points earned
   * 5. Persists UserProgress record
   * 6. Updates user XP and level
   */
  async execute(submitPuzzleDto: SubmitPuzzleDto): Promise<SubmitPuzzleResponseDto> {
    const { userId, puzzleId, userAnswer, timeSpent } = submitPuzzleDto;

    // Step 1: Validate puzzle exists (with caching)
    let puzzle = await this.redisCacheService.getPuzzle(puzzleId);
    
    if (!puzzle) {
      puzzle = await this.puzzleRepository.findOne({
        where: { id: puzzleId },
        relations: ['category'],
      });
      
      if (puzzle) {
        // Cache the puzzle for future requests
        await this.redisCacheService.cachePuzzle(puzzle);
      }
    }

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`);
    }

    // Step 2: Check for duplicate submissions (within 5 seconds)
    const recentAttempt = await this.userProgressRepository.findOne({
      where: {
        userId,
        puzzleId,
        attemptedAt: MoreThan(new Date(Date.now() - 5000)), // 5 second window
      },
    });

    if (recentAttempt) {
      throw new Error('Duplicate submission detected. Please wait before submitting again.');
    }

    // Step 3: Validate answer correctness
    const validation = this.validateAnswer(userAnswer, puzzle.correctAnswer);
    
    // Step 4: Calculate points earned
    const pointsEarned = this.calculatePoints(
      puzzle,
      timeSpent,
      validation.isCorrect,
    );

    // Step 5: Create and persist UserProgress record
    const userProgress = this.userProgressRepository.create({
      userId,
      puzzleId,
      categoryId: puzzle.categoryId,
      isCorrect: validation.isCorrect,
      userAnswer: userAnswer.trim(),
      pointsEarned,
      timeSpent,
      attemptedAt: new Date(),
    });

    await this.userProgressRepository.save(userProgress);

    // Step 6: Update user XP and level
    const xpUpdate = await this.updateUserXPService.updateUserXP(
      userId,
      pointsEarned,
      validation.isCorrect,
    );

    // Invalidate user cache after XP update
    await this.redisCacheService.invalidateUserCache(userId);

    // Return response with validation result and user updates
    return {
      isCorrect: validation.isCorrect,
      pointsEarned,
      newXP: xpUpdate.newXP,
      newLevel: xpUpdate.newLevel,
      puzzlesCompleted: xpUpdate.puzzlesCompleted,
    };
  }
}