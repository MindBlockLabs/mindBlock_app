# Request Size Limit Usage Examples

## Basic Usage

The request size limit middleware is applied automatically to all routes. No configuration is needed for default behavior.

### Default Limits Apply Automatically

```typescript
// This endpoint using default JSON limit (1MB)
@Post('create')
@Controller('api/puzzles')
export class PuzzleController {
  @Post()
  createPuzzle(@Body() dto: CreatePuzzleDto) {
    // Max 1MB JSON payload
    return this.puzzleService.create(dto);
  }
}
```

## Custom Size Limits

### Using CustomSizeLimit Decorator

```typescript
import { CustomSizeLimit } from '@common/decorators/size-limit.decorator';

@Post('upload-document')
@CustomSizeLimit(100 * 1024 * 1024) // 100 MB
uploadDocument(@Body() file: Buffer) {
  // Now accepts up to 100MB
  return this.fileService.process(file);
}
```

### Using SizeLimitConfig Decorator

```typescript
import { SizeLimitConfig } from '@common/decorators/size-limit.decorator';

@Post('profile-picture')
@SizeLimitConfig({ type: 'profilePictureUpload' }) // 5MB
uploadProfilePicture(@Body() file: Buffer) {
  // Uses predefined 5MB limit
  return this.userService.updateProfilePicture(file);
}

@Post('bulk-import')
@SizeLimitConfig({ type: 'bulkOperations' }) // 20MB
bulkImport(@Body() data: any[]) {
  // Uses predefined 20MB limit for bulk operations
  return this.importService.processBulk(data);
}
```

## Real-World Examples

### Example 1: Puzzle Creation with Images

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SizeLimitConfig } from '@common/decorators/size-limit.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/puzzles')
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @SizeLimitConfig({ type: 'puzzleCreation' }) // 10MB for puzzles with images
  async createPuzzleWithImage(
    @Body() createPuzzleDto: CreatePuzzleWithImageDto,
  ) {
    return this.puzzleService.createWithImage(createPuzzleDto);
  }
}
```

### Example 2: Large File Upload

```typescript
@Controller('api/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @CustomSizeLimit(100 * 1024 * 1024) // 100MB for custom large files
  async uploadFile(
    @Body() file: Buffer,
    @Headers('content-type') contentType: string,
  ) {
    return this.fileService.store(file, contentType);
  }

  @Post('document')
  @UseGuards(AuthGuard('jwt'))
  @SizeLimitConfig({ type: 'documentUpload' }) // 100MB for documents
  async uploadDocument(@Body() document: Buffer) {
    return this.fileService.processDocument(document);
  }
}
```

### Example 3: Bulk Operations

```typescript
@Controller('api/bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('import-users')
  @UseGuards(AuthGuard('jwt'))
  @SizeLimitConfig({ type: 'bulkOperations' }) // 20MB limit
  async importUsers(@Body() users: ImportUserDto[]) {
    return this.bulkService.importUsers(users);
  }

  @Post('update-scores')
  @UseGuards(AuthGuard('jwt'))
  @SizeLimitConfig({ type: 'bulkOperations' }) // 20MB limit
  async updateScores(@Body() updates: ScoreUpdateDto[]) {
    return this.bulkService.updateScores(updates);
  }
}
```

### Example 4: Webhook Receivers

```typescript
@Controller('api/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @SizeLimitConfig({ type: 'webhookPayloads' }) // 5MB for webhooks
  async handleStripeWebhook(@Body() event: any) {
    return this.webhookService.processStripe(event);
  }

  @Post('github')
  @SizeLimitConfig({ type: 'webhookPayloads' }) // 5MB for webhooks
  async handleGithubWebhook(@Body() event: any) {
    return this.webhookService.processGithub(event);
  }
}
```

## Error Handling

### Expected Error Response

When a request exceeds the size limit:

```javascript
// Request
POST /api/puzzles HTTP/1.1
Content-Type: application/json
Content-Length: 2097152

{/* 2MB of data */}

// Response
HTTP/1.1 413 Payload Too Large
Content-Type: application/json

{
  "statusCode": 413,
  "errorCode": "PAYLOAD_TOO_LARGE",
  "message": "Request body exceeds maximum allowed size",
  "timestamp": "2026-03-26T10:15:30.123Z",
  "path": "/api/puzzles"
}
```

### Client-Side Handling

```typescript
// Angular/TypeScript Service Example
uploadFile(file: File): Observable<Response> {
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (file.size > maxSize) {
    return throwError(() => new Error(`File exceeds maximum size of 100MB`));
  }

  return this.http.post<Response>('/api/files/upload', file).pipe(
    catchError((error) => {
      if (error.status === 413) {
        return throwError(
          () => new Error('File is too large. Maximum size is 100MB.'),
        );
      }
      return throwError(() => error);
    }),
  );
}
```

## Testing

### Unit Test Example

```typescript
describe('FileController with Custom Size Limit', () => {
  let controller: FileController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FileController],
      providers: [FileService],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should accept files under custom limit', async () => {
    const smallFile = Buffer.alloc(50 * 1024 * 1024); // 50MB
    const result = await controller.uploadFile(smallFile, 'application/pdf');
    expect(result).toBeDefined();
  });

  it('should reject files exceeding custom limit', async () => {
    const largeFile = Buffer.alloc(150 * 1024 * 1024); // 150MB - exceeds 100MB limit
    await expect(
      controller.uploadFile(largeFile, 'application/pdf'),
    ).rejects.toThrow();
  });
});
```

### E2E Test Example

```typescript
describe('File Upload Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /api/files/upload should reject > 100MB', async () => {
    const largePayload = Buffer.alloc(150 * 1024 * 1024);

    await request(app.getHttpServer())
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .send(largePayload)
      .expect(413)
      .expect((res) => {
        expect(res.body.errorCode).toBe('PAYLOAD_TOO_LARGE');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Configuration Tips

### For High-Volume Servers

```typescript
// In environment variables
NODE_OPTIONS="--max-old-space-size=8192" // 8GB heap

// For specific endpoint
@Post('large-import')
@CustomSizeLimit(500 * 1024 * 1024) // 500MB for special cases
async importLargeDataset(@Body() data: any[]): Promise<void> {
  // Handle large dataset
}
```

### For Restricted Networks

```typescript
// Reduce default limits by modifying main.ts
app.use(express.json({ limit: '512kb' })); // Reduce from 1MB
app.use(express.urlencoded({ limit: '5mb', extended: true })); // Reduce from 10MB
```

## Monitoring

### View Size Limit Violations

```bash
# Filter application logs for oversized requests
grep "PAYLOAD_TOO_LARGE" logs/app.log
grep "Large request detected" logs/app.log

# Monitor specific endpoint
grep "POST /api/puzzles.*PAYLOAD_TOO_LARGE" logs/app.log
```

### Metrics Collection

```typescript
// Service to track size limit violations
@Injectable()
export class SizeLimitMetricsService {
  incrementOversizedRequests(endpoint: string, size: number): void {
    // Track in monitoring system (e.g., Prometheus)
  }

  logViolation(endpoint: string, method: string, ip: string): void {
    // Log for security analysis
  }
}
```