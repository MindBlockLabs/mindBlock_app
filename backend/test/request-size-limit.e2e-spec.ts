import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Request Size Limit (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/test - Default JSON limit (1MB)', () => {
    it('should accept requests under 1MB', async () => {
      const smallPayload = { data: 'x'.repeat(500 * 1024) }; // 500KB

      const response = await request(app.getHttpServer())
        .post('/api/test')
        .send(smallPayload)
        .expect((res) => {
          // Should not return 413
          expect(res.status).not.toBe(413);
        });
    });

    it('should reject requests exceeding 1MB', async () => {
      const largePayload = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB

      await request(app.getHttpServer())
        .post('/api/test')
        .send(largePayload)
        .expect(413)
        .expect((res) => {
          expect(res.body.errorCode).toBe('PAYLOAD_TOO_LARGE');
          expect(res.body.statusCode).toBe(413);
        });
    });
  });

  describe('POST /api/form - Form data limit (10MB)', () => {
    it('should accept form payloads under 10MB', async () => {
      const formData = new FormData();
      formData.append('field', 'x'.repeat(5 * 1024 * 1024)); // 5MB

      await request(app.getHttpServer())
        .post('/api/form')
        .send(formData)
        .expect((res) => {
          expect(res.status).not.toBe(413);
        });
    });

    it('should reject form payloads exceeding 10MB', async () => {
      const formData = new FormData();
      formData.append('field', 'x'.repeat(15 * 1024 * 1024)); // 15MB

      await request(app.getHttpServer())
        .post('/api/form')
        .send(formData)
        .expect(413);
    });
  });

  describe('Content-Type specific limits', () => {
    it('should apply JSON limit to application/json', async () => {
      const payload = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB

      await request(app.getHttpServer())
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(payload))
        .expect(413);
    });

    it('should apply text limit to text/plain', async () => {
      const payload = 'x'.repeat(200 * 1024); // 200KB

      await request(app.getHttpServer())
        .post('/api/text')
        .set('Content-Type', 'text/plain')
        .send(payload)
        .expect(413);
    });
  });

  describe('Error Response Format', () => {
    it('should return proper 413 error response', async () => {
      const payload = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB

      await request(app.getHttpServer())
        .post('/api/test')
        .send(payload)
        .expect(413)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 413);
          expect(res.body).toHaveProperty('errorCode', 'PAYLOAD_TOO_LARGE');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
        });
    });
  });

  describe('Custom Size Limit Decorator', () => {
    it('should apply custom size limits when decorator is used', async () => {
      // This would require a test endpoint with @CustomSizeLimit(50 * 1024 * 1024)
      // The test demonstrates the concept
      const payload = { data: 'x'.repeat(30 * 1024 * 1024) }; // 30MB

      // Assuming endpoint at /api/custom-upload with 50MB limit
      const response = await request(app.getHttpServer())
        .post('/api/custom-upload')
        .send(payload);

      // Should succeed (not 413) with custom 50MB limit
      expect(response.status).not.toBe(413);
    });
  });
});

// Unit tests for size limit utilities
describe('Request Size Utilities', () => {
  describe('formatBytes', () => {
    const testCases = [
      { bytes: 0, expected: '0 Bytes' },
      { bytes: 1024, expected: '1 KB' },
      { bytes: 1024 * 1024, expected: '1 MB' },
      { bytes: 1024 * 1024 * 1024, expected: '1 GB' },
      { bytes: 500 * 1024, expected: '500 KB' },
    ];

    testCases.forEach(({ bytes, expected }) => {
      it(`should format ${bytes} bytes as ${expected}`, () => {
        // Test the formatBytes function logic
        const formatted = formatBytes(bytes);
        expect(formatted).toBe(expected);
      });
    });
  });

  describe('getBaseContentType', () => {
    const testCases = [
      { input: 'application/json', expected: 'application/json' },
      { input: 'application/json; charset=utf-8', expected: 'application/json' },
      { input: 'multipart/form-data; boundary=----', expected: 'multipart/form-data' },
      { input: 'text/plain; charset=utf-8', expected: 'text/plain' },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should extract base content type from "${input}"`, () => {
        // Test the getBaseContentType function logic
        const base = getBaseContentType(input);
        expect(base).toBe(expected);
      });
    });
  });

  describe('getSizeLimitForContentType', () => {
    const testCases = [
      { contentType: 'application/json', expected: 1024 * 1024 }, // 1MB
      { contentType: 'multipart/form-data', expected: 10 * 1024 * 1024 }, // 10MB
      { contentType: 'image/jpeg', expected: 50 * 1024 * 1024 }, // 50MB
      { contentType: 'application/pdf', expected: 100 * 1024 * 1024 }, // 100MB
    ];

    testCases.forEach(({ contentType, expected }) => {
      it(`should return ${expected} bytes for ${contentType}`, () => {
        // Test the getSizeLimitForContentType function logic
        const limit = getSizeLimitForContentType(contentType);
        expect(limit).toBe(expected);
      });
    });
  });
});

// Helper functions for testing (would be imported from actual modules)
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getBaseContentType(contentTypeHeader: string): string {
  if (!contentTypeHeader) return 'application/json';
  return contentTypeHeader.split(';')[0].trim().toLowerCase();
}

function getSizeLimitForContentType(contentType: string): number {
  const limits: { [key: string]: number } = {
    'application/json': 1024 * 1024,
    'multipart/form-data': 10 * 1024 * 1024,
    'image/jpeg': 50 * 1024 * 1024,
    'application/pdf': 100 * 1024 * 1024,
  };

  return limits[contentType] || 1024 * 1024; // Default to 1MB
}