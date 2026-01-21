import { Injectable } from '@nestjs/common';
import { CreatePuzzleService } from './create-puzzle.service';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';

@Injectable()
export class PuzzlesService {
  constructor(
    private readonly createPuzzleService: CreatePuzzleService,
  ) {}

  /**
   * Create a new puzzle
   * @param createPuzzleDto - Validated puzzle data
   * @returns Created puzzle entity
   */
  public async create(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.createPuzzleService.execute(createPuzzleDto);
  }
}
