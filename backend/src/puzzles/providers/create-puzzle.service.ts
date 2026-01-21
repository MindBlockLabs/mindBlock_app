import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { CategoriesService } from '../../categories/providers/categories.service';

@Injectable()
export class CreatePuzzleService {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Creates a new puzzle after validating category and setting defaults
   * @param createPuzzleDto - Validated puzzle data from controller
   * @returns Created puzzle entity
   * @throws NotFoundException if category doesn't exist or is inactive (from CategoriesService)
   * @throws InternalServerErrorException if database operation fails
   */
  async execute(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    // Step 1: Validate category exists and is active
    // This throws NotFoundException (404) if category is invalid
    await this.categoriesService.findById(createPuzzleDto.categoryId);

    // Step 2: Set default points based on difficulty if not provided
    // Uses the existing method in CreatePuzzleDto that calls getPointsByDifficulty()
    createPuzzleDto.setDefaultPointsIfNeeded();

    // Step 3: Create and persist puzzle
    try {
      const puzzle = this.puzzleRepository.create({
        question: createPuzzleDto.question,
        options: createPuzzleDto.options,
        correctAnswer: createPuzzleDto.correctAnswer,
        difficulty: createPuzzleDto.difficulty,
        categoryId: createPuzzleDto.categoryId,
        points: createPuzzleDto.points,
        timeLimit: createPuzzleDto.timeLimit,
        explanation: createPuzzleDto.explanation,
      });

      // Step 4: Save to database and return
      return await this.puzzleRepository.save(puzzle);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create puzzle');
    }
  }
}
