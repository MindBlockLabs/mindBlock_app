import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/progress.entity';
import { paginate } from '../../common/pagination/paginate';
import { ProgressHistoryDto } from '../dtos/progress-history.dto';

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
    const qb = this.progressRepo
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.puzzle', 'puzzle')
      .where('progress.userId = :userId', { userId })
      .orderBy('progress.attemptedAt', 'DESC');

    return paginate(qb, page, limit);
  }
}
