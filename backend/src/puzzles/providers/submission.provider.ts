import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleSubmission } from '../entities/puzzle-submission.entity';
import { User } from '../../users/user.entity';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { SubmitAnswerResponseDto } from '../dtos/submit-answer-response.dto';

/**
 * Determines XP reward based on difficulty and correctness
 */
const DIFFICULTY_MULTIPLIER = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const BASE_POINTS = 50;

@Injectable()
export class SubmissionProvider {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleSubmission)
    private readonly submissionRepository: Repository<PuzzleSubmission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Submit an answer to a puzzle and update user progression
   */
  async submitAnswer(
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<SubmitAnswerResponseDto> {
    // 1. Validate puzzle exists
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: dto.puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${dto.puzzleId} not found`);
    }

    // 2. Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 3. Validate answer correctness
    const isCorrect = this.validateAnswer(dto.answer, puzzle.solution);

    // 4. Calculate points earned
    const pointsEarned = isCorrect
      ? BASE_POINTS * DIFFICULTY_MULTIPLIER[puzzle.difficulty]
      : 0;

    // 5. Create submission record
    const submission = this.submissionRepository.create({
      puzzle,
      user,
      puzzleId: puzzle.id,
      userId,
      attemptData: { answer: dto.answer, ...dto.metadata },
      result: isCorrect,
      pointsEarned,
    });

    await this.submissionRepository.save(submission);

    // 6. Update user stats (only if correct)
    let newXP = user.xp;
    let newLevel = user.level;
    let puzzlesCompleted = user.puzzlesCompleted;

    if (isCorrect) {
      newXP = user.xp + pointsEarned;
      puzzlesCompleted = user.puzzlesCompleted + 1;

      // Calculate level based on XP (simple formula: level = floor(xp / 100) + 1)
      newLevel = Math.floor(newXP / 100) + 1;

      // Update user
      user.xp = newXP;
      user.level = newLevel;
      user.puzzlesCompleted = puzzlesCompleted;

      await this.userRepository.save(user);
    }

    return {
      isCorrect,
      pointsEarned,
      newXP,
      newLevel,
      puzzlesCompleted,
      message: isCorrect
        ? `Correct! You earned ${pointsEarned} XP and reached level ${newLevel}.`
        : 'Incorrect answer. Try again!',
    };
  }

  /**
   * Validate if the provided answer matches the solution
   * This is a simple string comparison - can be enhanced for more complex validation
   */
  private validateAnswer(answer: string, solution: string): boolean {
    // Normalize both strings: trim, lowercase, remove extra spaces
    const normalizedAnswer = answer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedSolution = solution
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

    return normalizedAnswer === normalizedSolution;
  }
}
