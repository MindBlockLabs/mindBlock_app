import { Injectable } from '@nestjs/common';
import { CreatePuzzleProvider } from './create-puzzle.provider';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { paginate } from 'src/common/pagination/paginate';

@Injectable()
export class PuzzlesService {
  constructor(
    private readonly createPuzzleProvider: CreatePuzzleProvider,

    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,
  ) {}

  public async create(createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.createPuzzleProvider.execute(createPuzzleDto);
  }

  public async findAll(query: PuzzleQueryDto) {
    const { categoryId, difficulty, page = 1, limit = 10 } = query;

    const qb = this.puzzleRepo
      .createQueryBuilder('puzzle')
      .leftJoinAndSelect('puzzle.category', 'category')
      .orderBy('puzzle.createdAt', 'DESC');

    if (categoryId) {
      qb.andWhere('puzzle.categoryId = :categoryId', { categoryId });
    }

    if (difficulty) {
      qb.andWhere('puzzle.difficulty = :difficulty', { difficulty });
    }

    return paginate(qb, page, limit);
  }
}
