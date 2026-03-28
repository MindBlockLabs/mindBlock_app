import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { CorrelationIdStorage } from './correlation-id.storage';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly HEADER_NAME = 'X-Correlation-ID';

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Extract from header or generate new UUID v4
    const correlationId = (req.header(this.HEADER_NAME) || randomUUID()) as string;

    // 2. Attach to request headers for propagation
    req.headers[this.HEADER_NAME.toLowerCase()] = correlationId;

    // 3. Attach to response headers
    res.setHeader(this.HEADER_NAME, correlationId);

    // 4. Run the rest of the request lifecycle within CorrelationIdStorage context
    const userId = (req as any).user?.id || (req as any).userId;
    CorrelationIdStorage.run(correlationId, userId, () => {
      // 5. Store in request object as well for easy access without storage if needed
      (req as any).correlationId = correlationId;
      next();
    });
  }
}
