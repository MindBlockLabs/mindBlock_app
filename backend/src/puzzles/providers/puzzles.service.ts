import { Injectable } from '@nestjs/common';
import { CreatePuzzleProvider } from './create-puzzle.provider';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { GetAllPuzzlesProvider } from './getAll-puzzle.provider';

@Injectable()
export class PuzzlesService {
  constructor(
    private readonly createPuzzleProvider: CreatePuzzleProvider,

    private readonly AllPuzzlesProvider: GetAllPuzzlesProvider,

    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,
  ) {}

  public async create(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.createPuzzleProvider.execute(createPuzzleDto);
  }

  public async findAll(query: PuzzleQueryDto) {
    return this.AllPuzzlesProvider.findAll(query);
  }
}
