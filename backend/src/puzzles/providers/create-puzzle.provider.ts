import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { Category } from '../../categories/entities/category.entity';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';

@Injectable()
export class CreatePuzzleProvider {
  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async execute(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    // 1. Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createPuzzleDto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(
        `Category with ID ${createPuzzleDto.categoryId} not found`,
      );
    }

    // 2. Verify category is active
    if (!category.isActive) {
      throw new BadRequestException(
        `Category with ID ${createPuzzleDto.categoryId} is not active`,
      );
    }

    // 3. Set default points based on difficulty if not provided
    createPuzzleDto.setDefaultPointsIfNeeded();

    // 4. Create puzzle entity
    const puzzle = this.puzzleRepository.create(createPuzzleDto);

    // 5. Persist to database
    try {
      return await this.puzzleRepository.save(puzzle);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create puzzle');
    }
  }
}
