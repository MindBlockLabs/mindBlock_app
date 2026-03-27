import { Injectable, NestMiddleware, Inject, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as geoip from 'geoip-lite';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import Redis from 'ioredis';
import { GeolocationData } from '../interfaces/geolocation.interface';

@Injectable()
export class GeolocationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GeolocationMiddleware.name);
  
  // 24 hours in seconds
  private readonly CACHE_TTL = 86400;
  
  // Default fallback location
  private readonly DEFAULT_LOCATION: Partial<GeolocationData> = {
    country: 'US',
    region: 'NY',
    city: 'New York',
    timezone: 'America/New_York',
  };

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Detect language from Accept-Language header
      const acceptLanguage = req.headers['accept-language'] as string;
      const language = this.parseAcceptLanguage(acceptLanguage);

      // 2. Check for manual location override via headers or query
      const overrideCountry = req.headers['x-override-country'] as string;
      const overrideCity = req.headers['x-override-city'] as string;
      const overrideTimezone = req.headers['x-override-timezone'] as string;
      
      const ip = this.getClientIp(req);

      if (overrideCountry || overrideCity || overrideTimezone) {
        req.location = {
          ip,
          country: overrideCountry || this.DEFAULT_LOCATION.country!,
          region: '',
          city: overrideCity || this.DEFAULT_LOCATION.city!,
          timezone: overrideTimezone || this.DEFAULT_LOCATION.timezone!,
          language,
          isOverride: true,
        };
        return next();
      }
      
      if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
        // Localhost access fallback
        req.location = {
          ip: ip || '127.0.0.1',
          country: this.DEFAULT_LOCATION.country!,
          region: this.DEFAULT_LOCATION.region!,
          city: this.DEFAULT_LOCATION.city!,
          timezone: this.DEFAULT_LOCATION.timezone!,
          language,
          isOverride: false,
        };
        return next();
      }

      // 4. Check Cache
      const cacheKey = `geoip:${ip}`;
      const cachedData = await this.redisClient.get(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData) as Partial<GeolocationData>;
        req.location = { 
          ip: parsed.ip || ip,
          country: parsed.country!,
          region: parsed.region!,
          city: parsed.city!,
          timezone: parsed.timezone!,
          language, 
          isOverride: false 
        };
        return next();
      }

      // 5. Lookup GeoIP
      const geo = geoip.lookup(ip);

      if (geo) {
        const locationData: GeolocationData = {
          ip,
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          language,
          isOverride: false,
        };

        req.location = locationData;

        // Cache result (store only needed parts to comply with privacy)
        await this.redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify({
          ip: locationData.ip,
          country: locationData.country,
          region: locationData.region,
          city: locationData.city,
          timezone: locationData.timezone,
        }));
      } else {
        // Fallback
        req.location = {
          ip,
          country: this.DEFAULT_LOCATION.country!,
          region: this.DEFAULT_LOCATION.region!,
          city: this.DEFAULT_LOCATION.city!,
          timezone: this.DEFAULT_LOCATION.timezone!,
          language,
          isOverride: false,
        };
      }
      
      next();
    } catch (error) {
      this.logger.error(`Geolocation error: ${(error as Error).message}`, (error as Error).stack);
      // Don't break application if geolocation fails
      req.location = {
        ip: this.getClientIp(req),
        country: this.DEFAULT_LOCATION.country!,
        region: this.DEFAULT_LOCATION.region!,
        city: this.DEFAULT_LOCATION.city!,
        timezone: this.DEFAULT_LOCATION.timezone!,
        language: 'en',
        isOverride: false,
      };
      next();
    }
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      if (Array.isArray(xForwardedFor)) {
        return xForwardedFor[0].split(',')[0].trim();
      }
      return xForwardedFor.split(',')[0].trim();
    }
    
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  private parseAcceptLanguage(acceptLanguage?: string): string {
    if (!acceptLanguage) return 'en';
    // Example: "en-US,en;q=0.9" -> "en-US"
    const parsed = acceptLanguage.split(',')[0].split(';')[0].trim();
    return parsed || 'en';
  }
}
