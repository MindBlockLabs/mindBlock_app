# Request Body Size Limit Middleware

## Overview

This middleware prevents Denial-of-Service (DoS) attacks by limiting the size of incoming request bodies. Different endpoints have different size limits based on their content type and purpose.

## Default Size Limits

| Type | Limit | Use Case |
|------|-------|----------|
| JSON API requests | 1 MB | Standard API calls |
| Text content | 100 KB | Text-based submissions |
| Form data | 10 MB | Form submissions |
| Image uploads | 50 MB | Image file uploads |
| Document uploads | 100 MB | PDF, Word, Excel files |
| Profile pictures | 5 MB | Avatar/profile images |
| Puzzle creation | 10 MB | Puzzles with images |
| Bulk operations | 20 MB | Batch processing |
| Webhook payloads | 5 MB | Webhook receivers |

## How It Works

The request body size limiting is implemented through multiple layers:

### 1. Express Middleware (main.ts)
- **JSON**: 1MB limit
- **URL-encoded**: 10MB limit
- **Raw/Binary**: 100MB limit
- Returns `413 Payload Too Large` on violation

### 2. Custom Size Limit Decorator
- Override default limits on specific routes
- Applied at the controller method level

### 3. Security Logging
- Logs oversized requests (>5MB) for security monitoring
- Tracks IP addresses and request details

## Usage Examples

### Default Behavior

```typescript
@Post('create')
createPuzzle(@Body() dto: CreatePuzzleDto) {
  // Uses default JSON limit: 1MB
}
```

### Custom Size Limits

```typescript
import { CustomSizeLimit, SizeLimitConfig } from '@common/decorators/size-limit.decorator';

// Using custom byte size
@Post('upload-document')
@CustomSizeLimit(100 * 1024 * 1024) // 100MB
uploadDocument(@Body() file: any) {
  // Uses custom 100MB limit
}

// Using predefined configurations
@Post('upload-profile-picture')
@SizeLimitConfig({ type: 'profilePictureUpload' }) // 5MB
uploadProfilePicture(@Body() file: any) {
  // Uses predefined 5MB profile picture limit
}

// Puzzle creation with images
@Post('puzzles')
@SizeLimitConfig({ type: 'puzzleCreation' }) // 10MB
createPuzzleWithImage(@Body() dto: CreatePuzzleDto) {
  // Uses 10MB limit for puzzles
}
```

## Error Response

When a request exceeds the size limit:

```json
{
  "statusCode": 413,
  "errorCode": "PAYLOAD_TOO_LARGE",
  "message": "Request body exceeds maximum allowed size",
  "timestamp": "2026-03-26T10:15:30.123Z",
  "path": "/api/puzzles"
}
```

## Security Features

### DoS Prevention
- **Early Rejection**: Oversized requests are rejected before being fully read
- **Memory Protection**: Prevents large payloads from exhausting server memory
- **Rate-based Limiting**: Works in conjunction with rate limiting middleware

### Attack Prevention
- **Slowloris Protection**: Uses timeouts on request bodies
- **Compression Bomb Protection**: Raw body limit prevents decompression attacks
- **Multipart Validation**: Enforces boundaries on multipart form data

## Configuration

### Environment Variables

```env
# Enable/disable request size limiting (default: true)
REQUEST_SIZE_LIMIT_ENABLED=true

# Log oversized requests for monitoring (default: true)
LOG_OVERSIZED_REQUESTS=true

# Enforce custom size limits on error (default: false)
ENFORCE_ON_SIZE_LIMIT_ERROR=false
```

## Implementation Details

### Main.ts middleware order:
1. **Express body parsers** - Apply size limits before processing
2. **Error handler** - Catch 413 errors from body parsers
3. **Validation pipes** - Validate structured data
4. **Correlation ID** - Track requests
5. **Exception filters** - Handle all errors uniformly

### Supported Content Types and Limits

```typescript
{
  'application/json': 1MB,
  'application/x-www-form-urlencoded': 10MB,
  'multipart/form-data': 10MB,
  'text/plain': 100KB,
  'text/html': 100KB,
  'image/jpeg': 50MB,
  'image/png': 50MB,
  'image/gif': 50MB,
  'image/webp': 50MB,
  'application/pdf': 100MB,
  'application/msword': 100MB,
  // ... additional MIME types
}
```

## Streaming for Large Files

For applications that need to handle files larger than configured limits, streaming should be used:

```typescript
@Post('large-file-upload')
@UseInterceptors(FileInterceptor('file'))
async uploadLargeFile(@UploadedFile() file: Express.Multer.File) {
  // Use streaming to handle large files
  return this.fileService.processStream(file.stream);
}
```

## Monitoring

The system logs:
- All requests exceeding size limits (with IP address)
- All requests over 5MB (for security monitoring)
- Request size metrics for performance analysis

View logs:
```bash
# Filter for oversized requests
grep "PAYLOAD_TOO_LARGE" logs/application.log

# Monitor large requests
grep "Large request detected" logs/application.log
```

## Testing

### Test Oversized JSON Request

```bash
# Should fail with 413
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d "$(python3 -c 'print("[" + "x" * 2000000 + "]")')"
```

### Test Custom Size Limit

```bash
# Create endpoint with custom 50MB limit
@Post('upload')
@CustomSizeLimit(50 * 1024 * 1024)
upload(@Body() data: any) { }

# Should succeed with file < 50MB
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/octet-stream" \
  --data-binary @large-file.bin
```

## Troubleshooting

### "Payload Too Large" on legitimate uploads
- Increase the custom size limit for that route
- Use `@CustomSizeLimit()` decorator
- Verify content-type header is correct

### Memory issues with uploads
- Enable streaming where possible
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`
- Increase specific endpoint limit incrementally

### False positives on large JSON payloads
- Check if JSON structure is necessary
- Consider pagination for bulk operations
- Use binary/streaming endpoints for large data

## Best Practices

1. **Set appropriate limits** - Match limits to actual use cases
2. **Monitor violations** - Regular review of 413 errors
3. **Inform clients** - Document limits in API documentation
4. **Use streaming** - For file uploads larger than 100MB
5. **Test limits** - Verify size limits work as intended
6. **Log monitoring** - Alert on suspicious patterns

## Related Features

- **Rate Limiting**: Prevents request flooding
- **API Key Validation**: Tracks usage per key
- **CORS**: Handles cross-origin requests
- **Compression**: Gzip middleware (before size check)