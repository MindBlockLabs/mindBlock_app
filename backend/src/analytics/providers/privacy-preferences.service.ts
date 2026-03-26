import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { Inject } from '@nestjs/common';

@Injectable()
export class PrivacyPreferencesService {
  private readonly logger = new Logger(PrivacyPreferencesService.name);
  private readonly OPT_OUT_PREFIX = 'analytics:optout:';
  private readonly CACHE_TTL = 3600; // 1 hour cache

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if user has opted out of tracking
   */
  async isOptedOut(userId: string | undefined): Promise<boolean> {
    // If no userId, check DNT header preference instead
    if (!userId) {
      return false;
    }

    const cacheKey = `${this.OPT_OUT_PREFIX}${userId}`;
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) {
        return cached === 'true';
      }

      // For now, default to not opted out
      // In production, this would check a database or consent management system
      const isOptedOut = false;
      
      // Cache the result
      await this.redis.setex(cacheKey, this.CACHE_TTL, isOptedOut.toString());
      
      return isOptedOut;
    } catch (error) {
      this.logger.error(`Error checking opt-out status: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Set user opt-out preference
   */
  async setOptOut(userId: string, optOut: boolean): Promise<void> {
    const cacheKey = `${this.OPT_OUT_PREFIX}${userId}`;
    
    try {
      await this.redis.setex(cacheKey, this.CACHE_TTL, optOut.toString());
      this.logger.log(`User ${userId} ${optOut ? 'opted out' : 'opted in'} of analytics tracking`);
    } catch (error) {
      this.logger.error(`Error setting opt-out preference: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Clear opt-out cache for a user
   */
  async clearOptOutCache(userId: string): Promise<void> {
    const cacheKey = `${this.OPT_OUT_PREFIX}${userId}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Check if Do-Not-Track header should be respected
   */
  shouldRespectDntHeader(): boolean {
    return this.configService.get('analytics.respectDntHeader', true);
  }

  /**
   * Get default consent status
   */
  getDefaultConsentStatus(): 'opted-in' | 'opted-out' | 'not-set' {
    const optOutByDefault = this.configService.get('analytics.optOutByDefault', false);
    return optOutByDefault ? 'opted-out' : 'opted-in';
  }
}
