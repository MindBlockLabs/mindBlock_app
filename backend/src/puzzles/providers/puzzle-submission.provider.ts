import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { User } from '../../users/user.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';
import { SubmitAnswerDto } from '../../progress/dtos/submit-answer.dto';
import { SubmitResponseDto } from '../dtos/submit-response.dto';

@Injectable()
export class PuzzleSubmissionProvider {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
  ) {}

  /**
   * Main submission workflow - validates puzzle, processes answer, updates user progression
   */
  async submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<SubmitResponseDto> {
    // 1. Validate that puzzle exists
    const puzzle = await this.validatePuzzleExists(submitAnswerDto.puzzleId);
    
    // 2. Check for duplicate submissions (within 5 seconds)
    await this.checkForDuplicateSubmission(submitAnswerDto);

    // 3. Validate answer correctness
    const isCorrect = this.validateAnswerCorrectness(
      submitAnswerDto.userAnswer,
      puzzle.correctAnswer
    );

    // 4. Calculate points with time bonus/penalty
    const { pointsEarned, timeMultiplier } = this.calculatePointsWithTimeBonus(
      puzzle.points,
      puzzle.timeLimit,
      submitAnswerDto.timeSpent,
      isCorrect
    );

    // 5. Persist UserProgress record and update user progression
    // Note: In a production environment, this should use database transactions
    // For now, we'll handle this with careful error handling
    
    // Create progress record
    const userProgress = this.userProgressRepository.create({
      userId: submitAnswerDto.userId,
      puzzleId: submitAnswerDto.puzzleId,
      categoryId: submitAnswerDto.categoryId,
      isCorrect,
      userAnswer: submitAnswerDto.userAnswer,
      pointsEarned,
      timeSpent: submitAnswerDto.timeSpent,
      attemptedAt: new Date(),
    });

    await this.userProgressRepository.save(userProgress);

    // Update user XP, level, and puzzles completed
    const updatedUser = await this.updateUserProgression(
      submitAnswerDto.userId,
      pointsEarned,
      isCorrect
    );

    // 6. Return validation result with updated user stats
    return {
      isCorrect,
      pointsEarned,
      newXP: updatedUser.xp,
      newLevel: updatedUser.level,
      puzzlesCompleted: updatedUser.puzzlesCompleted,
      explanation: puzzle.explanation,
      timeMultiplier: isCorrect && timeMultiplier !== 1.0 ? timeMultiplier : undefined,
    };
  }

  /**
   * Validates that a puzzle exists
   */
  private async validatePuzzleExists(puzzleId: string): Promise<Puzzle> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
      relations: ['category'],
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`);
    }

    return puzzle;
  }

  /**
   * Checks for duplicate submissions within a 5-second window
   */
  private async checkForDuplicateSubmission(submitAnswerDto: SubmitAnswerDto): Promise<void> {
    const recentAttempt = await this.userProgressRepository.findOne({
      where: {
        userId: submitAnswerDto.userId,
        puzzleId: submitAnswerDto.puzzleId,
        attemptedAt: MoreThan(new Date(Date.now() - 5000)), // 5 second window
      },
    });

    if (recentAttempt) {
      throw new BadRequestException('Duplicate submission detected. Please wait before submitting again.');
    }
  }

  /**
   * Validates answer correctness with case-insensitive and whitespace trimming
   */
  private validateAnswerCorrectness(userAnswer: string, correctAnswer: string): boolean {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    return normalizedUserAnswer === normalizedCorrectAnswer;
  }

  /**
   * Calculates points with time-based bonuses or penalties
   */
  private calculatePointsWithTimeBonus(
    basePoints: number,
    timeLimit: number,
    timeSpent: number,
    isCorrect: boolean
  ): { pointsEarned: number; timeMultiplier: number } {
    if (!isCorrect) {
      return { pointsEarned: 0, timeMultiplier: 1.0 };
    }

    let timeMultiplier = 1.0;

    // Time bonus: up to 20% extra points for fast completion
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

    const pointsEarned = Math.round(basePoints * timeMultiplier);
    return { pointsEarned, timeMultiplier };
  }

  /**
   * Updates user progression (XP, level, puzzles completed) atomically
   */
  private async updateUserProgression(
    userId: string,
    pointsEarned: number,
    isCorrect: boolean
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update XP
    user.xp += pointsEarned;

    // Update puzzles completed count
    if (isCorrect) {
      user.puzzlesCompleted += 1;
    }

    // Recalculate level based on XP (simple linear progression)
    const newLevel = this.calculateLevelFromXP(user.xp);
    user.level = newLevel;

    return await this.userRepository.save(user);
  }

  /**
   * Calculates user level based on XP using a simple formula
   * Level 1: 0-99 XP
   * Level 2: 100-299 XP  
   * Level 3: 300-599 XP
   * etc.
   */
  private calculateLevelFromXP(xp: number): number {
    // Simple quadratic progression: level = floor(sqrt(XP / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }
}