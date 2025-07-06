import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleSubmission } from './entities/puzzle-submission.entity';
import { PuzzleProgress } from './entities/puzzle-progress.entity';
import { User } from '../users/user.entity';
import { SubmitPuzzleDto } from './dto/puzzle.dto';
import { PuzzleSubmissionDto } from '../gamification/dto/puzzle-submission.dto';
import { PuzzleType } from './enums/puzzle-type.enum';

@Injectable()
export class PuzzleService {
  private readonly logger = new Logger(PuzzleService.name);

  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleSubmission)
    private readonly submissionRepository: Repository<PuzzleSubmission>,
    @InjectRepository(PuzzleProgress)
    private readonly progressRepository: Repository<PuzzleProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submitPuzzleSolution(
    userId: string,
    puzzleId: number,
    submitDto: SubmitPuzzleDto,
  ): Promise<{ success: boolean; xpEarned?: number; tokensEarned?: number; message?: string }> {
    try {
      // 1. Get the puzzle and verify it exists
      const puzzle = await this.puzzleRepository.findOne({
        where: { id: puzzleId },
      });
      
      if (!puzzle) {
        throw new NotFoundException('Puzzle not found');
      }

      // 2. Verify the solution
      const isCorrect = this.verifySolution(puzzle, submitDto.solution);
      
      // 3. Record the submission
      const submission = this.submissionRepository.create({
        userId,
        puzzleId,
        attemptData: { solution: submitDto.solution },
        result: isCorrect,
        submittedAt: new Date(),
      });
      await this.submissionRepository.save(submission);

      // 4. Emit puzzle submission event for streak tracking
      const puzzleSubmissionEvent: PuzzleSubmissionDto = {
        userId,
        puzzleId,
        isCorrect,
        timestamp: new Date(),
      };
      
      this.eventEmitter.emit('puzzle.submitted', puzzleSubmissionEvent);

      if (!isCorrect) {
        return { 
          success: false, 
          message: 'Incorrect solution. Try again!' 
        };
      }

      // 5. Check for previous successful submissions (idempotency)
      const previousSuccess = await this.submissionRepository.findOne({
        where: { userId, puzzleId, result: true },
      });
      
      if (previousSuccess && previousSuccess.id !== submission.id) {
        return { 
          success: true, 
          xpEarned: 0, 
          tokensEarned: 0,
          message: 'Puzzle already solved!'
        };
      }

      // 6. Update puzzle progress
      await this.updatePuzzleProgress(userId, puzzle.type);

      // 7. Award XP and tokens
      const { xpEarned, tokensEarned } = this.calculateRewards(puzzle.difficulty);
      await this.updateUserStats(userId, xpEarned, tokensEarned);

      this.logger.log(`User ${userId} successfully solved puzzle ${puzzleId}`);

      return { 
        success: true, 
        xpEarned, 
        tokensEarned,
        message: 'Puzzle solved successfully!'
      };
    } catch (error) {
      this.logger.error(`Error submitting puzzle solution: ${error.message}`, error.stack);
      throw error;
    }
  }

  private verifySolution(puzzle: Puzzle, submittedSolution: string): boolean {
    // Simple string comparison for now
    // In a real implementation, this could involve more complex verification logic
    return puzzle.solution.toLowerCase().trim() === submittedSolution.toLowerCase().trim();
  }

  private async updatePuzzleProgress(
    userId: string,
    puzzleType: PuzzleType,
  ): Promise<void> {
    let progress = await this.progressRepository.findOne({
      where: { userId, puzzleType: puzzleType as PuzzleType },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        userId,
        puzzleType: puzzleType as PuzzleType,
        completedCount: 0,
      });
    }

    progress.completedCount += 1;
    await this.progressRepository.save(progress);
  }

  private calculateRewards(difficulty: string): { xpEarned: number; tokensEarned: number } {
    const rewards = {
      easy: { xp: 100, tokens: 10 },
      medium: { xp: 250, tokens: 25 },
      hard: { xp: 500, tokens: 50 },
    };

    return {
      xpEarned: rewards[difficulty]?.xp || 100,
      tokensEarned: rewards[difficulty]?.tokens || 10,
    };
  }

  private async updateUserStats(
    userId: string,
    xpEarned: number,
    tokensEarned: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.xp += xpEarned;
    user.level = Math.floor(user.xp / 1000) + 1; // Simple level calculation

    await this.userRepository.save(user);
  }

  async getPuzzle(puzzleId: number): Promise<Puzzle> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException('Puzzle not found');
    }

    return puzzle;
  }

  async getPuzzles(filters?: any): Promise<Puzzle[]> {
    const queryBuilder = this.puzzleRepository.createQueryBuilder('puzzle');

    if (filters?.type) {
      queryBuilder.andWhere('puzzle.type = :type', { type: filters.type });
    }

    if (filters?.difficulty) {
      queryBuilder.andWhere('puzzle.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    if (filters?.isPublished !== undefined) {
      queryBuilder.andWhere('puzzle.isPublished = :isPublished', { isPublished: filters.isPublished });
    }

    return queryBuilder.getMany();
  }

  async getUserProgress(userId: string): Promise<PuzzleProgress[]> {
    return this.progressRepository.find({
      where: { userId },
    });
  }
}
