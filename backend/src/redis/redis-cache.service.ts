import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RedisCacheService {
  private readonly TTL = {
    PUZZLE: 3600, // 1 hour
    USER_STATS: 1800, // 30 minutes
    USER_PROFILE: 1800, // 30 minutes
    PROGRESS_STATS: 3600, // 1 hour
  };

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // Puzzle Caching
  async cachePuzzle(puzzle: Puzzle): Promise<void> {
    const key = `puzzle:${puzzle.id}`;
    await this.redis.setex(key, this.TTL.PUZZLE, JSON.stringify(puzzle));
  }

  async getPuzzle(puzzleId: string): Promise<Puzzle | null> {
    const key = `puzzle:${puzzleId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidatePuzzle(puzzleId: string): Promise<void> {
    const key = `puzzle:${puzzleId}`;
    await this.redis.del(key);
  }

  // User Profile Caching
  async cacheUserProfile(user: User): Promise<void> {
    const key = `user:profile:${user.id}`;
    const userData = {
      id: user.id,
      xp: user.xp,
      level: user.level,
      puzzlesCompleted: user.puzzlesCompleted,
    };
    await this.redis.setex(key, this.TTL.USER_PROFILE, JSON.stringify(userData));
  }

  async getUserProfile(userId: string): Promise<User | null> {
    const key = `user:profile:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    const key = `user:profile:${userId}`;
    await this.redis.del(key);
  }

  // User Stats Caching
  async cacheUserStats(userId: string, stats: any): Promise<void> {
    const key = `user:stats:${userId}`;
    await this.redis.setex(key, this.TTL.USER_STATS, JSON.stringify(stats));
  }

  async getUserStats(userId: string): Promise<any | null> {
    const key = `user:stats:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateUserStats(userId: string): Promise<void> {
    const key = `user:stats:${userId}`;
    await this.redis.del(key);
  }

  // Progress Stats Caching
  async cacheProgressStats(userId: string, categoryId: string, stats: any): Promise<void> {
    const key = `progress:stats:${userId}:${categoryId}`;
    await this.redis.setex(key, this.TTL.PROGRESS_STATS, JSON.stringify(stats));
  }

  async getProgressStats(userId: string, categoryId: string): Promise<any | null> {
    const key = `progress:stats:${userId}:${categoryId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateProgressStats(userId: string, categoryId: string): Promise<void> {
    const key = `progress:stats:${userId}:${categoryId}`;
    await this.redis.del(key);
  }

  // Bulk Cache Invalidation
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUserProfile(userId),
      this.invalidateUserStats(userId),
    ]);
  }

  // Cache warming for popular puzzles
  async warmPuzzleCache(puzzleIds: string[]): Promise<void> {
    // This would typically be called by a background job or cron
    // For now, we'll implement it as a placeholder
    console.log(`Warming cache for ${puzzleIds.length} puzzles`);
  }

  // Cache health check
  async getCacheInfo(): Promise<any> {
    const info = await this.redis.info();
    const dbSize = await this.redis.dbsize();
    return {
      info,
      dbSize,
    };
  }
}