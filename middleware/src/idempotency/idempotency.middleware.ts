import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IdempotencyService } from './idempotency.service';
import { IDEMPOTENCY_CONFIG } from './idempotency.config';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip GET requests
    if (req.method === 'GET') return next();

    const headerKey = IDEMPOTENCY_CONFIG.headerKey;
    let idempotencyKey = req.headers[headerKey] as string;

    if (!idempotencyKey) {
      // Auto-generate key if not provided
      idempotencyKey = await this.idempotencyService.generateKey(req);
    }

    if (typeof idempotencyKey !== 'string') {
      throw new BadRequestException('Invalid idempotency key format');
    }

    const cachedResponse = await this.idempotencyService.getResponse(idempotencyKey);
    if (cachedResponse) {
      // Return cached response immediately
      res.set(cachedResponse.headers);
      return res.status(cachedResponse.statusCode).send(cachedResponse.body);
    }

    // Intercept response to store it
    const originalSend = res.send.bind(res);
    res.send = async (body: any) => {
      const ttl = this.resolveTTL(req.originalUrl);
      const responsePayload = {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body,
      };
      await this.idempotencyService.storeResponse(idempotencyKey, responsePayload, ttl);
      return originalSend(body);
    };

    next();
  }

  private resolveTTL(url: string): number {
    if (url.includes('/puzzles')) return IDEMPOTENCY_CONFIG.ttl.puzzleSubmission;
    if (url.includes('/points')) return IDEMPOTENCY_CONFIG.ttl.pointClaim;
    if (url.includes('/friends')) return IDEMPOTENCY_CONFIG.ttl.friendRequest;
    if (url.includes('/profile')) return IDEMPOTENCY_CONFIG.ttl.profileUpdate;
    return 300; // default
  }
}
