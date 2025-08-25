import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAchievement } from '../entities/user-achievement.entity';
import { Achievement } from '../entities/achievement.entity';
import { LeaderboardEntry } from '../../leaderboard/entities/leaderboard.entity';
import { User } from '../../users/user.entity';
import { Badge } from '../../badge/entities/badge.entity';

@Injectable()
export class AchievementUnlockerProvider {
  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,

    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,

    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepo: Repository<LeaderboardEntry>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
  ) {}

  async unlockAchievementsForUser(user: User) {
    const existing = await this.userAchievementRepo.find({
      where: { user: { id: user.id } },
    });

    const unlockedIds = new Set(existing.map((ua) => ua.achievement.id));

    const toCheck = await this.achievementRepo.find();

    for (const achievement of toCheck) {
      if (unlockedIds.has(achievement.id)) continue;

      if (achievement.title === 'Mind Master') {
        if (user.puzzlesCompleted >= 50) {
          await this.userAchievementRepo.save({ user, achievement });
        }

        const badge = await this.badgeRepo.findOne({
          where: { title: 'Mind Master' },
        });
        if (badge) {
          user.badge = badge;
          await this.userRepo.save(user);
        }
      }

      if (achievement.title === 'Top 100') {
        const rank = await this.leaderboardRepo
          .createQueryBuilder('entry')
          .where('entry.tokens > :tokens', { tokens: user.tokens })
          .getCount();

        if (rank + 1 <= 100) {
          await this.userAchievementRepo.save({ user, achievement });
        }
      }
    }
  }
}
