import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as zlib from 'zlib';
import { COMPRESSION_CONFIG } from './compression.config';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const chunks: Buffer[] = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    // Intercept response body
    res.write = function (chunk: any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };

    res.end = function (chunk: any) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const body = Buffer.concat(chunks);

      // Skip compression if too small
      if (body.length < COMPRESSION_CONFIG.threshold) {
        return originalEnd.call(res, body);
      }

      const contentType = res.getHeader('Content-Type') as string;
      if (COMPRESSION_CONFIG.skipTypes.some((regex) => regex.test(contentType))) {
        return originalEnd.call(res, body);
      }

      // Select algorithm
      if (/\bbr\b/.test(acceptEncoding)) {
        zlib.brotliCompress(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: COMPRESSION_CONFIG.brotli.quality } }, (err, compressed) => {
          if (err) return originalEnd.call(res, body);
          res.setHeader('Content-Encoding', 'br');
          originalEnd.call(res, compressed);
        });
      } else if (/\bgzip\b/.test(acceptEncoding)) {
        zlib.gzip(body, { level: COMPRESSION_CONFIG.gzip.level }, (err, compressed) => {
          if (err) return originalEnd.call(res, body);
          res.setHeader('Content-Encoding', 'gzip');
          originalEnd.call(res, compressed);
        });
      } else if (/\bdeflate\b/.test(acceptEncoding)) {
        zlib.deflate(body, (err, compressed) => {
          if (err) return originalEnd.call(res, body);
          res.setHeader('Content-Encoding', 'deflate');
          originalEnd.call(res, compressed);
        });
      } else {
        return originalEnd.call(res, body);
      }
    };

    next();
  }
}
