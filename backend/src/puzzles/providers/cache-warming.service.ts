import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisCacheService } from '../../redis/redis-cache.service';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';

@Injectable()
export class CacheWarmingService {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  /**
   * Warm cache with popular puzzles (most attempted in last 24 hours)
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async warmPopularPuzzles(): Promise<void> {
    try {
      console.log('🔄 Warming cache with popular puzzles...');
      
      // Get puzzles that were attempted recently (last 24 hours)
      const popularPuzzles = await this.puzzleRepository
        .createQueryBuilder('puzzle')
        .innerJoin('puzzle.progressRecords', 'progress')
        .where('progress.attemptedAt > :yesterday', {
          yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .groupBy('puzzle.id')
        .orderBy('COUNT(progress.id)', 'DESC')
        .limit(50) // Cache top 50 most popular puzzles
        .getMany();

      // Cache each popular puzzle
      for (const puzzle of popularPuzzles) {
        await this.redisCacheService.cachePuzzle(puzzle);
      }

      console.log(`✅ Cached ${popularPuzzles.length} popular puzzles`);
    } catch (error) {
      console.error('❌ Failed to warm puzzle cache:', error);
    }
  }

  /**
   * Warm cache with trending puzzles (most attempted in last hour)
   * Runs every 10 minutes
   */
  @Cron('*/10 * * * *') // Every 10 minutes
  async warmTrendingPuzzles(): Promise<void> {
    try {
      console.log('🔥 Warming cache with trending puzzles...');
      
      // Get puzzles that were attempted recently (last hour)
      const trendingPuzzles = await this.puzzleRepository
        .createQueryBuilder('puzzle')
        .innerJoin('puzzle.progressRecords', 'progress')
        .where('progress.attemptedAt > :oneHourAgo', {
          oneHourAgo: new Date(Date.now() - 60 * 60 * 1000),
        })
        .groupBy('puzzle.id')
        .orderBy('COUNT(progress.id)', 'DESC')
        .limit(20) // Cache top 20 trending puzzles
        .getMany();

      // Cache each trending puzzle
      for (const puzzle of trendingPuzzles) {
        await this.redisCacheService.cachePuzzle(puzzle);
      }

      console.log(`✅ Cached ${trendingPuzzles.length} trending puzzles`);
    } catch (error) {
      console.error('❌ Failed to warm trending puzzle cache:', error);
    }
  }

  /**
   * Pre-cache all easy puzzles for new users
   * Runs once daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async warmEasyPuzzles(): Promise<void> {
    try {
      console.log('🌱 Warming cache with easy puzzles...');
      
      // Get all easy puzzles
      const easyPuzzles = await this.puzzleRepository
        .find({
          where: {
            difficulty: PuzzleDifficulty.BEGINNER,
          },
          relations: ['category'],
          take: 100, // Limit to first 100 easy puzzles
        });

      // Cache each easy puzzle
      for (const puzzle of easyPuzzles) {
        await this.redisCacheService.cachePuzzle(puzzle);
      }

      console.log(`✅ Cached ${easyPuzzles.length} easy puzzles`);
    } catch (error) {
      console.error('❌ Failed to warm easy puzzle cache:', error);
    }
  }

  /**
   * Manual cache warming method
   * Can be called via API endpoint
   */
  async warmCacheManually(puzzleIds?: string[]): Promise<void> {
    if (puzzleIds && puzzleIds.length > 0) {
      // Warm specific puzzles
      const puzzles = await this.puzzleRepository.find({
        where: {
          id: In(puzzleIds),
        },
        relations: ['category'],
      });
      
      for (const puzzle of puzzles) {
        await this.redisCacheService.cachePuzzle(puzzle);
      }
      
      console.log(`✅ Manually cached ${puzzles.length} puzzles`);
    } else {
      // Warm all popular puzzles
      await this.warmPopularPuzzles();
    }
  }
}