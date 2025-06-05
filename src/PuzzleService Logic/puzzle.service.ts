import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle, PuzzleDifficulty } from './puzzle.entity';
import { PuzzleSubmission } from './puzzle-submission.entity';
import { PuzzleProgress } from './puzzle-progress.entity';
import { User } from './user.entity';
import { PuzzleType } from 'src/puzzle/enums/puzzle-type.enum';
import { TOKENS_BY_DIFFICULTY, XP_BY_DIFFICULTY, XP_PER_LEVEL } from './constants';

// @Injectable()
// export class PuzzleService {
//   constructor(
//     @InjectRepository(Puzzle)
//     private readonly puzzleRepository: Repository<Puzzle>,
//     @InjectRepository(PuzzleSubmission)
//     private readonly submissionRepository: Repository<PuzzleSubmission>,
//     @InjectRepository(PuzzleProgress)
//     private readonly progressRepository: Repository<PuzzleProgress>,
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//   ) {}

//   async submitPuzzleSolution(
//     userId: string,
//     puzzleId: string,
//     attemptData: any,
//   ): Promise<{ success: boolean; xpEarned?: number; tokensEarned?: number }> {
//     // 1. Get the puzzle and verify it exists
//     const puzzle = await this.puzzleRepository.findOne({
//       where: { id: puzzleId },
//     });
//     if (!puzzle) {
//       throw new Error('Puzzle not found');
//     }

//     // 2. Verify the solution
//     const isCorrect = this.verifySolution(puzzle, attemptData);
    
//     // 3. Record the submission
//     const submission = this.submissionRepository.create({
//       userId,
//       puzzleId,
//       attemptData,
//       result: isCorrect,
//       submittedAt: new Date(),
//     });
//     await this.submissionRepository.save(submission);

//     if (!isCorrect) {
//       return { success: false };
//     }

//     // 4. Check for previous successful submissions (idempotency)
//     const previousSuccess = await this.submissionRepository.findOne({
//       where: { userId, puzzleId, result: true },
//     });
//     if (previousSuccess) {
//       return { success: true, xpEarned: 0, tokensEarned: 0 };
//     }

//     // 5. Update puzzle progress
//     await this.updatePuzzleProgress(userId, puzzle.type);

//     // 6. Award XP and tokens
//     const { xpEarned, tokensEarned } = this.calculateRewards(puzzle.difficulty);
//     await this.updateUserStats(userId, xpEarned, tokensEarned);

//     return { success: true, xpEarned, tokensEarned };
//   }

//   private verifySolution(puzzle: Puzzle, attemptData: any): boolean {
//     switch (puzzle.type) {
//       case PuzzleType.LOGIC:
//         return this.verifyLogicPuzzle(puzzle.solution, attemptData);
//       case PuzzleType.CODING:
//         return this.verifyCodingPuzzle(puzzle.solution, attemptData);
//       case PuzzleType.BLOCKCHAIN:
//         return this.verifyBlockchainPuzzle(puzzle.solution, attemptData);
//       default:
//         throw new Error('Unknown puzzle type');
//     }
//   }

//   private verifyLogicPuzzle(solution: any, attemptData: any): boolean {
//     // Simple comparison for logic puzzles
//     return JSON.stringify(solution) === JSON.stringify(attemptData);
//   }

//   private verifyCodingPuzzle(solution: any, attemptData: any): boolean {
//     // More complex verification for coding puzzles
//     // Might involve running test cases against the submitted code
//     // This is a simplified version
//     return solution.output === attemptData.output;
//   }

//   private verifyBlockchainPuzzle(solution: any, attemptData: any): boolean {
//     // Special verification for blockchain puzzles
//     // Might involve verifying transactions or smart contract interactions
//     return solution.hash === attemptData.hash;
//   }

//   private async updatePuzzleProgress(
//     userId: string,
//     puzzleType: PuzzleType,
//   ): Promise<void> {
//     let progress = await this.progressRepository.findOne({
//       where: { userId, puzzleType },
//     });

//     if (!progress) {
//       progress = this.progressRepository.create({
//         userId,
//         puzzleType,
//         completedCount: 0,
//       });
//     }

//     progress.completedCount += 1;
//     await this.progressRepository.save(progress);
//   }

//   private calculateRewards(difficulty: PuzzleDifficulty): {
//     xpEarned: number;
//     tokensEarned: number;
//   } {
//     return {
//       xpEarned: XP_BY_DIFFICULTY[difficulty],
//       tokensEarned: TOKENS_BY_DIFFICULTY[difficulty],
//     };
//   }

//   private async updateUserStats(
//     userId: string,
//     xpEarned: number,
//     tokensEarned: number,
//   ): Promise<void> {
//     const user = await this.userRepository.findOne({ where: { id: userId } });
//     if (!user) {
//       throw new Error('User not found');
//     }

//     user.experiencePoints += xpEarned;
//     user.totalTokensEarned += tokensEarned;
//     user.level = Math.floor(user.experiencePoints / XP_PER_LEVEL);
//     user.lastPuzzleSolvedAt = new Date();

//     await this.userRepository.save(user);
//   }
// }