import { Injectable } from '@nestjs/common';
import { CreatePuzzleProvider } from './create-puzzle.provider';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';

@Injectable()
export class PuzzlesService {
  constructor(
    private readonly createPuzzleProvider: CreatePuzzleProvider,
  ) {}

  public async create(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.createPuzzleProvider.execute(createPuzzleDto);
  }
}
