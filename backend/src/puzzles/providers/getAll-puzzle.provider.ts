import { Injectable } from '@nestjs/common';
import { Puzzle } from '../entities/puzzle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { FindOptionsWhere } from 'typeorm';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';

@Injectable()
export class GetAllPuzzlesProvider {
  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepo: Repository<Puzzle>,
  ) {}

  public async findAll(query: PuzzleQueryDto) {
    const { categoryId, difficulty, page = 1, limit = 10 } = query;

    const where: FindOptionsWhere<Puzzle> = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [data, total] = await this.puzzleRepo.findAndCount({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}
