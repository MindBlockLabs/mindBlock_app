import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSubmission } from 'src/puzzle/entities/puzzle-submission.entity';
import { UserAchievement } from 'src/achievement/entities/user-achievement.entity';
import { User } from '../user.entity';

export interface UserActivityEvent {
  description: string;
  timestamp: string;
}

@Injectable()
export class PuzzleActivityProvider {
  constructor(
    @InjectRepository(PuzzleSubmission)
    private readonly puzzleSubmissionRepo: Repository<PuzzleSubmission>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getRecentActivity(userId: string, page = 1, limit = 5): Promise<UserActivityEvent[]> {
    // Validate user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Fetch puzzle submissions
    const puzzleSubmissions = await this.puzzleSubmissionRepo.find({
      where: { user: { id: userId }, isCorrect: true },
      relations: ['puzzle'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch achievements
    const achievements = await this.userAchievementRepo.find({
      where: { user: { id: userId } },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map to activity events
    const puzzleEvents: UserActivityEvent[] = puzzleSubmissions.map((sub) => ({
      description: `Completed "${sub.puzzle.title}" puzzle`,
      timestamp: sub.createdAt.toISOString(),
    }));
    const achievementEvents: UserActivityEvent[] = achievements.map((ach) => ({
      description: `Unlocked "${ach.achievement.title}" achievement`,
      timestamp: ach.unlockedAt.toISOString(),
    }));

    // Merge and sort by timestamp DESC
    const allEvents = [...puzzleEvents, ...achievementEvents].sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp)
    );

    // Paginate merged events
    const start = 0;
    const end = limit;
    return allEvents.slice(start, end);
  }
}