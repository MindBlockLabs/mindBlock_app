import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Achievement } from '../entities/achievement.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FindByUserIdProvider {
    constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
  ) {}

    async findByUserId(userId: string) {
    return this.achievementRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      select: ['id', 'title', 'iconUrl', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }
}
