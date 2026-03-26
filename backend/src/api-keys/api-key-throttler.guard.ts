import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RequestWithApiKey } from './api-key.middleware';

@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestWithApiKey): Promise<string> {
    // Use API key ID as tracker if API key is present
    if (req.apiKey) {
      return `api-key:${req.apiKey.id}`;
    }

    // Fall back to IP-based tracking if no API key
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  }

  protected async getLimit(context: ExecutionContext): Promise<number> {
    const req = context.switchToHttp().getRequest<RequestWithApiKey>();

    // Different limits for API keys vs regular requests
    if (req.apiKey) {
      // API keys get higher limits
      return 100; // 100 requests per ttl
    }

    // Regular requests use default limit
    return 10; // Default from ThrottlerModule config
  }

  protected async getTtl(context: ExecutionContext): Promise<number> {
    const req = context.switchToHttp().getRequest<RequestWithApiKey>();

    // Different TTL for API keys
    if (req.apiKey) {
      return 60000; // 1 minute
    }

    return 60000; // Default from ThrottlerModule config
  }
}