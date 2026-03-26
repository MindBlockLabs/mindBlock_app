# Request Size Limit Configuration

## Overview
This document describes the configuration options for the request body size limit middleware.

## Environment Variables

### REQUEST_SIZE_LIMIT_ENABLED
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable or disable request body size limiting globally
- **Example**: `REQUEST_SIZE_LIMIT_ENABLED=true`

### LOG_OVERSIZED_REQUESTS
- **Type**: Boolean
- **Default**: `true`
- **Description**: Log all requests that exceed size limits for security monitoring
- **Example**: `LOG_OVERSIZED_REQUESTS=true`

### ENFORCE_ON_SIZE_LIMIT_ERROR
- **Type**: Boolean
- **Default**: `false`
- **Description**: Whether to halt processing on size limit errors
- **Example**: `ENFORCE_ON_SIZE_LIMIT_ERROR=false`

## Size Limits by Content Type

### Default Configuration

The middleware automatically applies size limits based on `Content-Type` header:

```
JSON (application/json): 1 MB
Form Data (multipart/form-data): 10 MB
URL-encoded (application/x-www-form-urlencoded): 10 MB
Text (text/plain, text/html): 100 KB
Images (image/*): 50 MB
Documents (application/pdf, application/msword): 100 MB
Raw Binary: 100 MB
```

## Per-Endpoint Configuration

Use the `@CustomSizeLimit()` or `@SizeLimitConfig()` decorators to override defaults:

### Example 1: Custom Byte Size
```typescript
@Post('upload')
@CustomSizeLimit(50 * 1024 * 1024) // 50 MB
uploadFile(@Body() data: any) {
  // ...
}
```

### Example 2: Predefined Config
```typescript
@Post('profile-picture')
@SizeLimitConfig({ type: 'profilePictureUpload' }) // 5 MB
uploadProfilePicture(@Body() data: any) {
  // ...
}
```

## Available Predefined Configs

| Type | Size | Description |
|------|------|-------------|
| `json` | 1 MB | Standard JSON API requests |
| `form` | 10 MB | Form submissions |
| `text` | 100 KB | Text content |
| `imageUpload` | 50 MB | Image files |
| `documentUpload` | 100 MB | Document files |
| `profilePictureUpload` | 5 MB | Avatar images |
| `puzzleCreation` | 10 MB | Puzzles with content |
| `bulkOperations` | 20 MB | Bulk data operations |
| `webhookPayloads` | 5 MB | Webhook data |

## Express Middleware Configuration

The following Express middleware is configured in `main.ts`:

```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.raw({ limit: '100mb', type: 'application/octet-stream' }));
```

## Error Response

When a request exceeds the configured limit, the server responds with HTTP 413:

```json
{
  "statusCode": 413,
  "errorCode": "PAYLOAD_TOO_LARGE",
  "message": "Request body exceeds maximum allowed size",
  "timestamp": "2026-03-26T10:15:30.123Z",
  "path": "/api/endpoint"
}
```

## Security Considerations

### DoS Prevention
- Requests are rejected **before** full body is read
- Prevents memory exhaustion
- Works with rate limiting for comprehensive protection

### Attack Mitigation
- **Zip Bomb Protection**: Raw limit prevents decompression attacks
- **Slowloris Protection**: Inherent in Express timeout settings
- **Multipart Boundary Validation**: Enforced by Express

## Logging

The system logs:

1. **Oversized Request Attempts**
   - Level: WARN
   - Format: `Request body exceeds size limit: {bytes} > {limit} - {method} {path} from {ip}`

2. **Large Request Monitoring** (>5MB)
   - Level: WARN
   - Format: `Large request detected: {size} - {method} {path} from {ip}`

3. **Request Size Metrics**
   - Level: DEBUG
   - Format: `Request size: {size} - {method} {path}`

## Performance Tuning

### For High-Volume Uploads
```typescript
// Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=8192"

// Use streaming for files > 100MB
// See main.ts for streaming configuration
```

### For Restricted Networks
```typescript
// Reduce limits for security
// In decorator: @CustomSizeLimit(1024 * 512) // 512KB
```

## Compatibility

### Supported Express Versions
- Express 4.x and above
- NestJS 8.x and above

### Supported Node.js Versions
- Node.js 14.x and above
- Node.js 16.x (recommended)
- Node.js 18.x

## Troubleshooting

### Issue: Legitimate uploads rejected
**Solution**: Use `@CustomSizeLimit()` decorator on the endpoint

### Issue: Memory usage spikes
**Solution**: Enable streaming for large files or reduce global limit

### Issue: False positives on image uploads
**Solution**: Verify Content-Type header matches actual content