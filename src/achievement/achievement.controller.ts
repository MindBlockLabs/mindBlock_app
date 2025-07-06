import { Controller, Get, Param } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('achievements')
export class AchievementController {
    constructor(
        @InjectRepository(UserAchievement)
        private readonly userAchievementRepo: Repository<UserAchievement>
    ) {}
@Get('/users/:id/achievements')
public async getUserAchievements(@Param('id') userId: string) {
  const unlocked = await this.userAchievementRepo.find({
    where: { user: { id: userId } },
    relations: ['achievement'],
  });

  return unlocked.map((ua) => ({
    id: ua.achievement.id,
    title: ua.achievement.title,
    description: ua.achievement.description,
    iconUrl: ua.achievement.iconUrl,
    unlockedAt: ua.unlockedAt,
  }));
}
}
