import { Injectable } from '@nestjs/common';
import { Puzzle } from '../entities/puzzle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { paginate } from '../../common/pagination/paginate';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';

@Injectable()
export class GetAllPuzzlesProvider {
  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,
  ) {}

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
