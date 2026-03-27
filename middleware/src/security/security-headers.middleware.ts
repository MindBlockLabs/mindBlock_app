import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SECURITY_HEADERS_CONFIG } from './security-headers.config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Apply common security headers
    for (const [header, value] of Object.entries(SECURITY_HEADERS_CONFIG.common)) {
      res.setHeader(header, value);
    }

    // Apply HSTS only in production
    if (process.env.NODE_ENV === 'production' && SECURITY_HEADERS_CONFIG.hsts.production) {
      res.setHeader('Strict-Transport-Security', SECURITY_HEADERS_CONFIG.hsts.production);
    }

    // Remove sensitive headers
    SECURITY_HEADERS_CONFIG.removeHeaders.forEach((header) => {
      res.removeHeader(header);
    });

    // Cache control based on content type
    res.on('finish', () => {
      const contentType = res.getHeader('Content-Type') as string;
      if (!contentType) return;

      if (contentType.includes('application/json')) {
        res.setHeader('Cache-Control', SECURITY_HEADERS_CONFIG.cacheControl.dynamic);
      } else if (contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('css')) {
        res.setHeader('Cache-Control', SECURITY_HEADERS_CONFIG.cacheControl.static);
      } else {
        res.setHeader('Cache-Control', SECURITY_HEADERS_CONFIG.cacheControl.private);
      }
    });

    next();
  }
}
