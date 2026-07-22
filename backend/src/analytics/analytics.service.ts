import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  /**
   * No-op health check method for the analytics module.
   * Can be extended with actual analytics logic in subsequent issues.
   */
  ping(): { status: string; module: string; timestamp: string } {
    return {
      status: 'ok',
      module: 'analytics',
      timestamp: new Date().toISOString(),
    };
  }
}
