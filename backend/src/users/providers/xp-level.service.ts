import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../user.entity';

@Injectable()
export class XpLevelService {
  private readonly XP_PER_LEVEL = 500;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
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

    const eventTimestamp = new Date();
    const xpAwardedEvent = {
      userId: user.id,
      entityId: user.id,
      xpAmount,
      previousLevel,
      currentLevel: user.level,
      timestamp: eventTimestamp,
    };

    // Fire-and-forget analytics event emission. Do not await to avoid blocking request path.
    setImmediate(() => {
      try {
        this.eventEmitter.emit('xp_awarded', xpAwardedEvent);
      } catch {
        // swallow listener errors to keep request path safe
      }
    });

    if (levelUp) {
      const leveledUpEvent = {
        userId: user.id,
        entityId: user.id,
        previousLevel,
        currentLevel: user.level,
        timestamp: eventTimestamp,
      };

      setImmediate(() => {
        try {
          this.eventEmitter.emit('user_leveled_up', leveledUpEvent);
        } catch {
          // swallow listener errors to keep request path safe
        }
      });
    }

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
