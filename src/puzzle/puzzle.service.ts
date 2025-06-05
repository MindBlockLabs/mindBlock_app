// src/puzzle/puzzle.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleType } from './enums/puzzle-type.enum';
import { PuzzleDifficulty } from './enums/puzzle-difficulty.enum';
import { Logger } from '@nestjs/common';
import { GamificationService } from '../gamification/gamification.service';
import { DailyStreakService } from 'src/daily-streak/daily_streak_service';
import { Puzzle } from './entities/puzzle.entity';
// import { PuzzleSubmission } from './entities/puzzle-submission.entity'; // Uncomment if you implement this entity

@Injectable()
export class PuzzleService {

  private readonly logger = new Logger(PuzzleService.name);

  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    // @InjectRepository(PuzzleSubmission)
    // private readonly submissionRepository: Repository<PuzzleSubmission>,
    @Inject(forwardRef(() => GamificationService))
    private readonly gamificationService: GamificationService,
    @Inject(forwardRef(() => DailyStreakService))
    private readonly dailyStreakService: DailyStreakService,
  ) {}

  getPuzzleStub() {
    return {
      message: 'Puzzle module is working',
      typesAvailable: Object.values(PuzzleType),
    };
  }

   async submitSolution(
    userId: number, 
    puzzleId: number, 
    solution: any
  ): Promise<{
    isCorrect: boolean;
    score?: number;
    feedback?: string;
    streakResult?: any;
    gamificationRewards?: any;
  }> {
    try {
      // Validate and check solution
      const isCorrect = await this.validatePuzzleSolution(puzzleId, solution);
      
      // Calculate base score
      let score = 0;
      if (isCorrect) {
        score = await this.calculatePuzzleScore(puzzleId, solution);
      }

      // Process gamification rewards (including streak)
      let gamificationRewards: any = null;
      let streakResult = null;

      if (isCorrect) {
        gamificationRewards = await this.gamificationService.processPuzzleSubmission(
          userId, 
          puzzleId, 
          isCorrect
        );
        
        // Extract streak result for response
        streakResult = gamificationRewards?.streakResult;
      }

      // Save puzzle submission record
      await this.savePuzzleSubmission({
        userId,
        puzzleId,
        solution,
        isCorrect,
        score,
        submittedAt: new Date(),
      });

      this.logger.log(`Puzzle ${puzzleId} submission by user ${userId}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

      return {
        isCorrect,
        score: isCorrect ? score : undefined,
        feedback: await this.generateFeedback(puzzleId, solution, isCorrect),
        streakResult,
        gamificationRewards: gamificationRewards?.puzzleRewards,
      };

    } catch (error) {
      this.logger.error(`Failed to submit puzzle solution for user ${userId}:`, error);
      throw error;
    }
  }

  // Validate the user's solution against the correct answer
  private async validatePuzzleSolution(puzzleId: number, solution: any): Promise<boolean> {
    const puzzle = await this.puzzleRepository.findOne({ where: { id: puzzleId } });
    if (!puzzle) return false;
    // For demo: compare as string, case-insensitive
    return (solution?.toString().trim().toLowerCase() === puzzle.solution.trim().toLowerCase());
  }

  private async calculatePuzzleScore(puzzleId: number, solution: any): Promise<number> {
    // Simple scoring: correct = 100, incorrect = 0
    const isCorrect = await this.validatePuzzleSolution(puzzleId, solution);
    return isCorrect ? 100 : 0;
  }

  private async generateFeedback(puzzleId: number, solution: any, isCorrect: boolean): Promise<string> {
    return isCorrect ? 'Correct solution!' : 'Try again!';
  }

  // Save puzzle submission (mock: just log, or implement using repository if entity exists)
  private async savePuzzleSubmission(submission: any): Promise<void> {
    // If you have a submissionRepository, save to DB:
    // await this.submissionRepository.save(submission);
    this.logger.debug('Puzzle submission saved:', submission);
  }

  // List puzzles with filters and solved status
  async listPuzzles(filters: any, userId: number) {
    const qb = this.puzzleRepository.createQueryBuilder('puzzle');
    qb.where('puzzle.isPublished = :published', { published: true });
    if (filters.type) {
      qb.andWhere('puzzle.type = :type', { type: filters.type });
    }
    if (filters.difficulty) {
      qb.andWhere('puzzle.difficulty = :difficulty', { difficulty: filters.difficulty });
    }
    // TODO: If you have submissions, join to filter by solved status
    // if (filters.solved !== undefined) { ... }
    return qb.getMany();
  }

  // Get a single puzzle by ID
  async getPuzzleById(id: number, userId: number) {
    const puzzle = await this.puzzleRepository.findOne({ where: { id, isPublished: true } });
    if (!puzzle) throw new Error('Puzzle not found');
    return puzzle;
  }

  // Get user progress per puzzle type
  async getUserProgress(userId: number) {
    // For demo: count total and solved per type
    const puzzles = await this.puzzleRepository.find({ where: { isPublished: true } });
    // TODO: If you have submissions, fetch solved by user
    const progress = Object.values(PuzzleType).map((type) => {
      const total = puzzles.filter((p) => p.type === type).length;
      // For demo, solved is 0
      return { type, solved: 0, total };
    });
    return progress;
  }
}