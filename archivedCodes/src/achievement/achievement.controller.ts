import { Controller, Get, Param } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Achievement } from './entities/achievement.entity';
import { AchievementService } from './providers/achievement.service';

@Controller('achievements')
export class AchievementController {
  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,

    private readonly achievementsService: AchievementService
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

  @Get()
  @ApiOperation({ summary: 'Get unlocked achievements for a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of achievements',
    type: [Achievement],
  })
  async getAchievements(
    @Param('id') userId: string,
  ): Promise<Partial<Achievement>[]> {
    return this.achievementsService.findByID(userId);
  }
}
