import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserProgress } from '../entities/progress.entity';

@Injectable()
export class GetProgressHistoryProvider {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async getProgressHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: FindOptionsWhere<UserProgress> = {
      userId,
    };

    const [data, total] = await this.progressRepo.findAndCount({
      where,
      relations: ['puzzle'],
      order: { attemptedAt: 'DESC' },
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
