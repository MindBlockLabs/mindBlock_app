import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class XpLevelService {
  private readonly XP_PER_LEVEL = 500;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Adds XP to a user and handles level-up logic.
   * Returns details about the update.
   */
  async addXp(
    userId: string,
    xpAmount: number,
  ): Promise<{
    levelUp: boolean;
    currentLevel: number;
    currentXp: number;
    previousLevel: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const previousLevel = user.level;
    user.xp += xpAmount;

    // Calculate new level
    // Rules: every 500 XP = new level.
    // Level 1: 0-499
    // Level 2: 500-999
    // Formula: floor(xp / 500) + 1
    const newLevel = Math.floor(user.xp / this.XP_PER_LEVEL) + 1;
    let levelUp = false;

    if (newLevel > user.level) {
      user.level = newLevel;
      levelUp = true;
    }

    await this.userRepository.save(user);

    return {
      levelUp,
      currentLevel: user.level,
      currentXp: user.xp,
      previousLevel,
    };
  }

  /**
   * Gets the user's current XP, level, and XP needed for the next level.
   */
  async getUserXpLevel(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Next level threshold is simply the start of the next level.
    // If current level is L, next level is L+1.
    // Xp needed for L+1 is L * 500.
    // Example: Level 1 (0 xp). Next level 2 starts at 1 * 500 = 500.
    // Example: Level 2 (500 xp). Next level 3 starts at 2 * 500 = 1000.
    const nextLevelThreshold = user.level * this.XP_PER_LEVEL;

    return {
      level: user.level,
      xp: user.xp,
      nextLevel: nextLevelThreshold,
    };
  }
}
