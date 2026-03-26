import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../providers/activity.service';
import { PrivacyPreferencesService } from '../providers/privacy-preferences.service';
import { DataAnonymizer } from '../utils/data-anonymizer';
import { AnalyticsDbService } from '../providers/analytics-db.service';
import { EventType, EventCategory } from '../entities';

export interface ActivityRequest extends Request {
  activityContext?: {
    startTime: number;
    sessionId: string;
    userId?: string;
    isAnonymous: boolean;
    consentStatus: 'opted-in' | 'opted-out' | 'not-set';
    shouldTrack: boolean;
  };
}

@Injectable()
export class ActivityTrackerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ActivityTrackerMiddleware.name);

  constructor(
    private readonly activityService: ActivityService,
    private readonly privacyService: PrivacyPreferencesService,
    private readonly dataAnonymizer: DataAnonymizer,
    private readonly analyticsDbService: AnalyticsDbService,
  ) {}

  async use(req: ActivityRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Check if analytics is enabled
    if (!this.analyticsDbService.isAnalyticsEnabled()) {
      return next();
    }

    try {
      // Extract user ID from request (set by auth middleware)
      const userId = (req as any).user?.id || (req as any).userId;
      
      // Get or generate session ID
      let sessionId = req.headers['x-session-id'] as string;
      let isAnonymous = !userId;

      if (!sessionId) {
        sessionId = this.dataAnonymizer.generateSessionId();
        isAnonymous = true;
      }

      // Check Do-Not-Track header
      const dntHeader = req.headers['dnt'];
      const hasDnt = dntHeader === '1' || dntHeader === 'true';
      const shouldRespectDnt = this.analyticsDbService.shouldRespectDntHeader();

      // Check opt-out status
      let isOptedOut = false;
      if (userId) {
        isOptedOut = await this.privacyService.isOptedOut(userId);
      }

      // Determine if we should track this request
      const shouldTrack = !isOptedOut && !(hasDnt && shouldRespectDnt);

      // Get consent status
      let consentStatus: 'opted-in' | 'opted-out' | 'not-set' = 'not-set';
      if (isOptedOut) {
        consentStatus = 'opted-out';
      } else if (!isOptedOut && userId) {
        consentStatus = 'opted-in';
      }

      // Attach activity context to request
      req.activityContext = {
        startTime,
        sessionId,
        userId,
        isAnonymous,
        consentStatus,
        shouldTrack,
      };

      // Add session ID to response headers for client-side tracking
      res.setHeader('X-Session-ID', sessionId);

      // Listen for response finish to record activity
      const recordActivity = () => {
        if (!req.activityContext?.shouldTrack) {
          return;
        }

        const duration = Date.now() - req.activityContext.startTime;
        
        // Determine event type and category based on route
        const { eventType, eventCategory } = this.categorizeRoute(req.path, req.method);

        // Get client IP and anonymize it
        const clientIp = this.getClientIp(req);
        const anonymizedIp = this.dataAnonymizer.anonymizeIpAddress(clientIp);

        // Parse user agent
        const userAgent = req.headers['user-agent'];
        const deviceInfo = this.dataAnonymizer.parseUserAgent(userAgent || '');

        // Get location from geolocation middleware (if available)
        const location = (req as any).location;

        // Prepare activity data
        const activityData = {
          userId: req.activityContext.userId,
          sessionId: req.activityContext.sessionId,
          eventType,
          eventCategory,
          duration,
          metadata: this.dataAnonymizer.sanitizeMetadata({
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            params: req.params,
            query: req.query,
          }),
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          platform: this.detectPlatform(req),
          country: location?.country,
          city: location?.city,
          anonymizedIp: anonymizedIp,
          userAgent: userAgent,
          referrer: req.headers.referer || req.headers.referrer,
          isAnonymous: req.activityContext.isAnonymous,
          consentStatus: req.activityContext.consentStatus,
        };

        // Record activity asynchronously (non-blocking)
        this.recordActivityAsync(activityData, req.activityContext.sessionId, duration);
      };

      // Hook into response events
      res.on('finish', recordActivity);
      res.on('close', recordActivity);

    } catch (error) {
      this.logger.error(`Activity tracking error: ${(error as Error).message}`, (error as Error).stack);
      // Don't break the request if tracking fails
    }

    next();
  }

  /**
   * Record activity asynchronously without blocking the response
   */
  private async recordActivityAsync(
    activityData: any,
    sessionId: string,
    duration: number,
  ): Promise<void> {
    try {
      // Record the activity
      await this.activityService.recordActivity(activityData);

      // Upsert session
      await this.activityService.upsertSession({
        sessionId,
        userId: activityData.userId,
        anonymizedIp: activityData.anonymizedIp,
        userAgent: activityData.userAgent,
        browser: activityData.browser,
        os: activityData.os,
        deviceType: activityData.deviceType,
        platform: activityData.platform,
        country: activityData.country,
        city: activityData.city,
        isAnonymous: activityData.isAnonymous,
        consentStatus: activityData.consentStatus,
      });

      // Update session duration
      if (duration > 0) {
        await this.activityService.updateSessionDuration(sessionId, duration);
      }
    } catch (error) {
      this.logger.error(`Failed to record activity: ${(error as Error).message}`);
    }
  }

  /**
   * Categorize route into event type and category
   */
  private categorizeRoute(path: string, method: string): {
    eventType: EventType;
    eventCategory: EventCategory;
  } {
    // Authentication routes
    if (path.includes('/auth/')) {
      if (path.includes('/login')) return { eventType: 'authentication', eventCategory: 'login' };
      if (path.includes('/logout')) return { eventType: 'authentication', eventCategory: 'logout' };
      if (path.includes('/signup') || path.includes('/register')) 
        return { eventType: 'authentication', eventCategory: 'signup' };
      if (path.includes('/reset-password')) 
        return { eventType: 'authentication', eventCategory: 'password_reset_request' };
    }

    // Puzzle routes
    if (path.includes('/puzzles/')) {
      if (method === 'GET') return { eventType: 'puzzle', eventCategory: 'puzzle_started' };
      if (path.includes('/submit')) return { eventType: 'puzzle', eventCategory: 'puzzle_submitted' };
      return { eventType: 'puzzle', eventCategory: 'puzzle_completed' };
    }

    // Quest routes
    if (path.includes('/quests/') || path.includes('/daily-quests/')) {
      if (method === 'GET') return { eventType: 'quest', eventCategory: 'daily_quest_viewed' };
      if (path.includes('/progress')) 
        return { eventType: 'quest', eventCategory: 'daily_quest_progress_updated' };
      if (path.includes('/complete')) 
        return { eventType: 'quest', eventCategory: 'daily_quest_completed' };
      if (path.includes('/claim')) 
        return { eventType: 'quest', eventCategory: 'daily_quest_claimed' };
    }

    // Category routes
    if (path.includes('/categories/')) {
      if (method === 'GET') return { eventType: 'category', eventCategory: 'category_viewed' };
    }

    // Profile routes
    if (path.includes('/profile') || path.includes('/users/')) {
      if (method === 'PUT' || method === 'PATCH') 
        return { eventType: 'profile', eventCategory: 'profile_updated' };
      if (path.includes('/picture') || path.includes('/avatar')) 
        return { eventType: 'profile', eventCategory: 'profile_picture_uploaded' };
      if (path.includes('/preferences') || path.includes('/settings')) 
        return { eventType: 'profile', eventCategory: 'preferences_updated' };
    }

    // Social routes
    if (path.includes('/friends/') || path.includes('/challenges/')) {
      if (path.includes('/request')) 
        return { eventType: 'social', eventCategory: 'friend_request_sent' };
      if (path.includes('/accept')) 
        return { eventType: 'social', eventCategory: 'friend_request_accepted' };
      if (path.includes('/challenge')) 
        return { eventType: 'social', eventCategory: 'challenge_sent' };
    }

    // Achievement/streak routes
    if (path.includes('/achievements/') || path.includes('/streak/')) {
      if (path.includes('/unlock')) 
        return { eventType: 'achievement', eventCategory: 'achievement_unlocked' };
      if (path.includes('/milestone')) 
        return { eventType: 'achievement', eventCategory: 'streak_milestone_reached' };
    }

    // Default: API call
    return { eventType: 'other', eventCategory: 'api_call' };
  }

  /**
   * Detect platform from request
   */
  private detectPlatform(req: Request): 'web' | 'mobile_web' | 'pwa' | 'api' {
    const userAgent = req.headers['user-agent'] || '';
    
    if (userAgent.includes('Mobile')) {
      return 'mobile_web';
    }
    
    // Check for PWA indicators
    if (req.headers['x-pwa'] === 'true') {
      return 'pwa';
    }

    // Check if it's an API call (e.g., from mobile app)
    if (req.headers['x-api-key'] || req.headers['authorization']) {
      return 'api';
    }

    return 'web';
  }

  /**
   * Get client IP address from request
   */
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
}
