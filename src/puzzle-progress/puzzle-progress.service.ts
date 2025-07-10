import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Puzzle, PuzzleCategory, PuzzleType, PuzzleDifficulty } from './puzzle.entity'; // Import new enums
import { v4 as uuidv4 } from 'uuid';

interface UserCategoryProgress {
  completed: number;
}

type UserProgressMap = Map<PuzzleCategory, UserCategoryProgress>;

@Injectable()
export class PuzzleProgressService {
  private readonly logger = new Logger(PuzzleProgressService.name);

  private puzzles: Puzzle[] = [];
  private userProgress: Map<string, UserProgressMap> = new Map();

  constructor() {
    this.seedPuzzles();
  }

  private seedPuzzles(): void {
    this.logger.log('Seeding mock puzzles...');
   
    const mockPuzzles: Omit<Puzzle, 'id'>[] = [
      {
        title: 'Easy Sudoku',
        description: 'A classic 9x9 sudoku puzzle.',
        type: PuzzleType.LOGIC,
        difficulty: PuzzleDifficulty.EASY,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.LOGIC,
      },
      {
        title: 'Hard Sudoku',
        description: 'A challenging 9x9 sudoku puzzle.',
        type: PuzzleType.LOGIC,
        difficulty: PuzzleDifficulty.HARD,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.LOGIC,
      },
      {
        title: 'FizzBuzz Challenge',
        description: 'Implement FizzBuzz in your favorite language.',
        type: PuzzleType.CODING,
        difficulty: PuzzleDifficulty.EASY,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.CODING,
      },
      {
        title: 'Blockchain Basics Quiz',
        description: 'Test your knowledge on fundamental blockchain concepts.',
        type: PuzzleType.TRIVIA,
        difficulty: PuzzleDifficulty.MEDIUM,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.BLOCKCHAIN,
      },
      {
        title: 'NFT Minting Exercise',
        description: 'Simulate minting an NFT on a testnet.',
        type: PuzzleType.CODING,
        difficulty: PuzzleDifficulty.HARD,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.BLOCKCHAIN, 
      },
      {
        title: 'Inactive Logic Puzzle',
        description: 'This puzzle is not yet published.',
        type: PuzzleType.LOGIC,
        difficulty: PuzzleDifficulty.MEDIUM,
        solution: '...',
        isPublished: false, 
        category: PuzzleCategory.LOGIC,
      },
      {
        title: 'Math Series Problem',
        description: 'Find the next number in the sequence.',
        type: PuzzleType.MATH,
        difficulty: PuzzleDifficulty.EASY,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.MATH,
      },
      {
        title: 'General Trivia Round 1',
        description: 'A mix of general knowledge questions.',
        type: PuzzleType.TRIVIA,
        difficulty: PuzzleDifficulty.EASY,
        solution: '...',
        isPublished: true,
        category: PuzzleCategory.GENERAL,
      },
    ];

    this.puzzles = mockPuzzles.map(p => ({ ...p, id: uuidv4() }));
    this.logger.log(`Seeded ${this.puzzles.length} puzzles.`);
  }

  recordPuzzleSolve(userId: string, puzzleId: string): void {
    this.logger.log(`Recording solve for user ${userId}, puzzle ${puzzleId}`);

   
    const puzzle = this.puzzles.find(p => p.id === puzzleId && p.isPublished);
    if (!puzzle) {
      this.logger.warn(`Puzzle ${puzzleId} not found or not published.`);
      throw new NotFoundException(`Puzzle with ID "${puzzleId}" not found or is not published.`);
    }

    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, new Map<PuzzleCategory, UserCategoryProgress>());
    }

    const userCategoryProgress = this.userProgress.get(userId);
    const currentCompleted = userCategoryProgress.get(puzzle.category)?.completed || 0;
    userCategoryProgress.set(puzzle.category, { completed: currentCompleted + 1 });

    this.logger.log(`User ${userId} completed puzzle ${puzzleId} in category ${puzzle.category}. New count: ${currentCompleted + 1}`);
  }

  getPuzzleProgress(userId: string): { [key in PuzzleCategory]?: { completed: number; total: number } } {
    this.logger.log(`Fetching puzzle progress for user ${userId}`);

    const progressBreakdown: { [key in PuzzleCategory]?: { completed: number; total: number } } = {};


    Object.values(PuzzleCategory).forEach(category => {
      const total = this.puzzles.filter(p => p.category === category && p.isPublished).length;
      progressBreakdown[category] = { completed: 0, total: total };
    });

  
    const userCategoryProgress = this.userProgress.get(userId);
    if (userCategoryProgress) {
      userCategoryProgress.forEach((data, category) => {
        if (progressBreakdown[category]) {
          progressBreakdown[category].completed = data.completed;
        } else {
       
          progressBreakdown[category] = { completed: data.completed, total: 0 };
        }
      });
    }

    return progressBreakdown;
  }


  getAllPuzzles(): Puzzle[] {
    return this.puzzles;
  }
}
