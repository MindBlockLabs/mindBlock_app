import { Request, Response, NextFunction } from 'express';
import * as zlib from 'zlib';
import { CompressionMiddleware } from '../../src/compression/compression.middleware';
import { COMPRESSION_CONFIG } from '../../src/compression/compression.config';

function makeMiddleware(): CompressionMiddleware {
  return new CompressionMiddleware();
}

/**
 * Builds a mock req/res pair and runs the middleware, then
 * simulates a response body being written via res.end().
 *
 * Returns a promise that resolves with the buffer passed to the
 * *real* end() call so tests can inspect compressed/uncompressed output.
 */
function runMiddleware(
  body: Buffer | string,
  acceptEncoding: string,
  contentType = 'application/json',
): Promise<{ buffer: Buffer; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const mw = makeMiddleware();
    const headers: Record<string, string> = { 'Content-Type': contentType };

    const req: Partial<Request> = {
      method: 'GET',
      path: '/test',
      headers: { 'accept-encoding': acceptEncoding },
    } as any;

    let capturedBuffer: Buffer | null = null;

    const res: Partial<Response> & { [key: string]: any } = {
      getHeader: (name: string) => headers[name],
      setHeader: (name: string, value: any) => { headers[name] = value; },
      removeHeader: jest.fn(),
      write: jest.fn(),
      end: (chunk?: any) => {
        // This is the *original* end — capture what was passed
        capturedBuffer = chunk ? (Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)) : Buffer.alloc(0);
        resolve({ buffer: capturedBuffer, headers });
      },
    } as any;

    const next: NextFunction = jest.fn(() => {
      // After next() the middleware has patched res.end — call it with the body
      try {
        (res as any).end(Buffer.isBuffer(body) ? body : Buffer.from(body));
      } catch (err) {
        reject(err);
      }
    });

    mw.use(req as Request, res as Response, next);
  });
}

describe('CompressionMiddleware', () => {
  describe('passthrough — body below threshold', () => {
    it('does not compress when body is smaller than threshold', async () => {
      const smallBody = 'hi'; // < 1024 bytes
      const { buffer, headers } = await runMiddleware(smallBody, 'gzip');
      expect(headers['Content-Encoding']).toBeUndefined();
      expect(buffer.toString()).toBe(smallBody);
    });
  });

  describe('passthrough — skipped content types', () => {
    it('does not compress image/* responses even when body is large', async () => {
      const largeBody = Buffer.alloc(COMPRESSION_CONFIG.threshold + 1, 'x');
      const { headers } = await runMiddleware(largeBody, 'gzip', 'image/png');
      expect(headers['Content-Encoding']).toBeUndefined();
    });

    it('does not compress video/* responses', async () => {
      const largeBody = Buffer.alloc(COMPRESSION_CONFIG.threshold + 1, 'x');
      const { headers } = await runMiddleware(largeBody, 'gzip', 'video/mp4');
      expect(headers['Content-Encoding']).toBeUndefined();
    });

    it('does not compress audio/* responses', async () => {
      const largeBody = Buffer.alloc(COMPRESSION_CONFIG.threshold + 1, 'x');
      const { headers } = await runMiddleware(largeBody, 'gzip', 'audio/mpeg');
      expect(headers['Content-Encoding']).toBeUndefined();
    });

    it('does not compress application/zip responses', async () => {
      const largeBody = Buffer.alloc(COMPRESSION_CONFIG.threshold + 1, 'x');
      const { headers } = await runMiddleware(largeBody, 'gzip', 'application/zip');
      expect(headers['Content-Encoding']).toBeUndefined();
    });
  });

  describe('no accept-encoding header', () => {
    it('does not compress when client sends no accept-encoding', async () => {
      const largeBody = Buffer.alloc(COMPRESSION_CONFIG.threshold + 1, 'x').toString();
      const { headers } = await runMiddleware(largeBody, '', 'application/json');
      expect(headers['Content-Encoding']).toBeUndefined();
    });
  });

  describe('gzip compression', () => {
    it('sets Content-Encoding: gzip and returns decompressible data', async () => {
      const largeBody = 'a'.repeat(COMPRESSION_CONFIG.threshold + 1);
      const { buffer, headers } = await runMiddleware(largeBody, 'gzip', 'application/json');
      expect(headers['Content-Encoding']).toBe('gzip');
      const decompressed = zlib.gunzipSync(buffer).toString();
      expect(decompressed).toBe(largeBody);
    });
  });

  describe('brotli compression', () => {
    it('sets Content-Encoding: br and returns decompressible data', async () => {
      const largeBody = 'b'.repeat(COMPRESSION_CONFIG.threshold + 1);
      const { buffer, headers } = await runMiddleware(largeBody, 'br', 'application/json');
      expect(headers['Content-Encoding']).toBe('br');
      const decompressed = zlib.brotliDecompressSync(buffer).toString();
      expect(decompressed).toBe(largeBody);
    });
  });

  describe('deflate compression', () => {
    it('sets Content-Encoding: deflate and returns decompressible data', async () => {
      const largeBody = 'c'.repeat(COMPRESSION_CONFIG.threshold + 1);
      const { buffer, headers } = await runMiddleware(largeBody, 'deflate', 'application/json');
      expect(headers['Content-Encoding']).toBe('deflate');
      const decompressed = zlib.inflateSync(buffer).toString();
      expect(decompressed).toBe(largeBody);
    });
  });

  describe('algorithm preference (brotli > gzip > deflate)', () => {
    it('prefers brotli when both br and gzip are advertised', async () => {
      const largeBody = 'd'.repeat(COMPRESSION_CONFIG.threshold + 1);
      const { headers } = await runMiddleware(largeBody, 'gzip, br', 'application/json');
      expect(headers['Content-Encoding']).toBe('br');
    });

    it('uses gzip when br is not listed', async () => {
      const largeBody = 'e'.repeat(COMPRESSION_CONFIG.threshold + 1);
      const { headers } = await runMiddleware(largeBody, 'gzip, deflate', 'application/json');
      expect(headers['Content-Encoding']).toBe('gzip');
    });
  });
});
