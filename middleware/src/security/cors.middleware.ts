import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface CorsOptions {
  origins?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULTS: Required<CorsOptions> = {
  origins: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Idempotency-Key'],
  exposedHeaders: ['X-Correlation-ID'],
  credentials: false,
  maxAge: 86400,
};

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly opts: Required<CorsOptions>;

  constructor(options: CorsOptions = {}) {
    this.opts = { ...DEFAULTS, ...options };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const { origins, methods, allowedHeaders, exposedHeaders, credentials, maxAge } = this.opts;
    const reqOrigin = req.headers.origin;

    if (Array.isArray(origins)) {
      if (reqOrigin && origins.includes(reqOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', reqOrigin);
        res.setHeader('Vary', 'Origin');
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', origins);
    }

    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    if (exposedHeaders.length) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Max-Age', String(maxAge));
      res.status(204).end();
      return;
    }

    next();
  }
}

/** Factory for use with NestJS consumer.apply() */
export function corsMiddleware(options?: CorsOptions) {
  const mw = new CorsMiddleware(options);
  return (req: Request, res: Response, next: NextFunction) => mw.use(req, res, next);
}
