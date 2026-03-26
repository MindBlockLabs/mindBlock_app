# API Key Authentication

This document describes the API key authentication system for external integrations in MindBlock.

## Overview

The API key authentication system allows external services, webhooks, and third-party applications to authenticate with the MindBlock API using secure API keys.

## Key Features

- **Secure Generation**: API keys are cryptographically random and follow a specific format
- **Hashed Storage**: Keys are stored as bcrypt hashes, never in plain text
- **Scope-based Permissions**: Keys can have different permission levels (read, write, delete, admin)
- **Rate Limiting**: Per-key rate limiting to prevent abuse
- **Expiration**: Keys can have expiration dates
- **Revocation**: Keys can be instantly revoked
- **Usage Tracking**: All API key usage is logged and tracked
- **IP Whitelisting**: Optional IP address restrictions

## API Key Format

API keys follow this format:
```
mbk_{environment}_{random_string}
```

- **Prefix**: `mbk_` (MindBlock Key)
- **Environment**: `live_` or `test_`
- **Random String**: 32 characters (base62)

Example: `mbk_live_Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1U`

## Authentication Methods

API keys can be provided in two ways:

1. **Header**: `X-API-Key: mbk_live_...`
2. **Query Parameter**: `?apiKey=mbk_live_...`

## Scopes and Permissions

- `read`: Can read data (GET requests)
- `write`: Can create/update data (POST, PUT, PATCH)
- `delete`: Can delete data (DELETE requests)
- `admin`: Full access to all operations
- `custom`: Define specific endpoint access

## API Endpoints

### Managing API Keys

All API key management endpoints require JWT authentication.

#### Generate API Key
```
POST /api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Integration Key",
  "scopes": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "ipWhitelist": ["192.168.1.1"]
}
```

Response:
```json
{
  "apiKey": "mbk_live_Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1U",
  "apiKeyEntity": {
    "id": "key-uuid",
    "name": "My Integration Key",
    "scopes": ["read", "write"],
    "expiresAt": "2024-12-31T23:59:59Z",
    "isActive": true,
    "usageCount": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### List API Keys
```
GET /api-keys
Authorization: Bearer <jwt_token>
```

#### Revoke API Key
```
DELETE /api-keys/{key_id}
Authorization: Bearer <jwt_token>
```

#### Rotate API Key
```
POST /api-keys/{key_id}/rotate
Authorization: Bearer <jwt_token>
```

### Using API Keys

To authenticate with an API key, include it in requests:

#### Header Authentication
```
GET /users/api-keys/stats
X-API-Key: mbk_live_Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1U
```

#### Query Parameter Authentication
```
GET /users/api-keys/stats?apiKey=mbk_live_Ab3Cd5Ef7Gh9Ij1Kl3Mn5Op7Qr9St1U
```

## Error Responses

### Invalid API Key
```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

### Insufficient Permissions
```json
{
  "statusCode": 401,
  "message": "Insufficient API key permissions",
  "error": "Unauthorized"
}
```

### Expired Key
```json
{
  "statusCode": 401,
  "message": "API key has expired",
  "error": "Unauthorized"
}
```

### Rate Limited
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests"
}
```

## Rate Limiting

- API keys have a default limit of 100 requests per minute
- Rate limits are tracked per API key
- Exceeding limits returns HTTP 429

## Security Best Practices

1. **Store Keys Securely**: Never expose API keys in client-side code or logs
2. **Use Appropriate Scopes**: Grant only necessary permissions
3. **Set Expiration**: Use expiration dates for temporary access
4. **IP Whitelisting**: Restrict access to known IP addresses when possible
5. **Monitor Usage**: Regularly review API key usage logs
6. **Rotate Keys**: Periodically rotate keys for security
7. **Revoke Compromised Keys**: Immediately revoke keys if compromised

## Implementation Details

### Middleware Order
1. `ApiKeyMiddleware` - Extracts and validates API key (optional)
2. `ApiKeyGuard` - Enforces authentication requirements
3. `ApiKeyThrottlerGuard` - Applies rate limiting
4. `ApiKeyLoggingInterceptor` - Logs usage

### Database Schema
API keys are stored in the `api_keys` table with:
- `keyHash`: Bcrypt hash of the API key
- `userId`: Associated user ID
- `scopes`: Array of permission scopes
- `expiresAt`: Optional expiration timestamp
- `isActive`: Active status
- `usageCount`: Number of uses
- `lastUsedAt`: Last usage timestamp
- `ipWhitelist`: Optional IP restrictions

## Testing

API keys can be tested using the test environment:
- Use `mbk_test_` prefixed keys for testing
- Test keys don't affect production data
- All features work identically in test mode