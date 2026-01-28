import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { RedisCacheService } from '../../redis/redis-cache.service';

export interface XPUpdateResult {
  newXP: number;
  newLevel: number;
  puzzlesCompleted: number;
}

@Injectable()
export class UpdateUserXPService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  /**
   * Updates user XP and level based on points earned
   * Also increments puzzles completed count if answer is correct
   * @param userId User ID to update
   * @param pointsEarned Points to add to user's XP
   * @param isCorrect Whether the answer was correct (to increment puzzles completed)
   * @returns Updated XP, level, and puzzles completed count
   */
  async updateUserXP(
    userId: string,
    pointsEarned: number,
    isCorrect: boolean,
  ): Promise<XPUpdateResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update XP
    const newXP = user.xp + pointsEarned;

    // Calculate new level based on XP
    // Level progression: Level 1 = 0-99 XP, Level 2 = 100-299 XP, Level 3 = 300-599 XP, etc.
    const newLevel = this.calculateLevel(newXP);

    // Update puzzles completed if answer is correct
    const puzzlesCompleted = isCorrect
      ? user.puzzlesCompleted + 1
      : user.puzzlesCompleted;

    // Update user entity
    user.xp = newXP;
    user.level = newLevel;
    user.puzzlesCompleted = puzzlesCompleted;

    try {
      await this.userRepository.save(user);
      
      // Cache the updated user profile
      await this.redisCacheService.cacheUserProfile(user);
      
      return {
        newXP,
        newLevel,
        puzzlesCompleted,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update user XP: ${error}`);
    }
  }

  /**
   * Calculates user level based on XP using a simple progression formula
   * Level = floor(sqrt(XP / 100)) + 1
   * @param xp Total XP points
   * @returns Calculated level
   */
  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }
}