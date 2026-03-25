import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a unique Correlation ID to every incoming request.
 *
 * The ID is sourced (in order of priority):
 *   1. `X-Correlation-ID` request header (forwarded by API gateways / clients).
 *   2. `X-Request-ID` (common alternative header name).
 *   3. A fresh UUID v4 generated per request.
 *
 * The resolved ID is:
 *   - Stored on `req.correlationId` for downstream handlers.
 *   - Echoed back in the `X-Correlation-ID` response header so clients
 *     can correlate their request with server logs.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-correlation-id'] as string | undefined) ||
      (req.headers['x-request-id'] as string | undefined) ||
      uuidv4();

    // Attach to request for downstream use (filters, interceptors, services)
    (req as any).correlationId = correlationId;

    // Reflect back to the client for easy log correlation
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
