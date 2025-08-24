import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from '../entities/leaderboard.entity';
import { SortBy } from '../dto/leaderboard-query.dto';

@Injectable()
export class GetUserRankProvider {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  async execute(userId: string, sortBy: SortBy): Promise<number> {
    const userEntry = await this.leaderboardRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userEntry) {
      throw new NotFoundException('User not found in leaderboard');
    }

    const userValue = userEntry[sortBy];

    const rank = await this.leaderboardRepository
      .createQueryBuilder('entry')
      .where(`entry.${sortBy} > :value`, { value: userValue })
      .getCount();

    return rank + 1;
  }
}