# Middleware Configuration Documentation

## Overview

### Purpose of Configuration Management

The middleware package uses a comprehensive configuration system designed to provide flexibility, security, and maintainability across different deployment environments. Configuration management follows the 12-factor app principles, ensuring that configuration is stored in the environment rather than code.

### Configuration Philosophy (12-Factor App Principles)

Our configuration system adheres to the following 12-factor app principles:

1. **One codebase, many deployments**: Same code runs in development, staging, and production
2. **Explicitly declare and isolate dependencies**: All dependencies declared in package.json
3. **Store config in the environment**: All configuration comes from environment variables
4. **Treat backing services as attached resources**: Database, Redis, and external services configured via URLs
5. **Strict separation of config and code**: No hardcoded configuration values
6. **Execute the app as one or more stateless processes**: Configuration makes processes stateless
7. **Export services via port binding**: Port configuration via environment
8. **Scale out via the process model**: Configuration supports horizontal scaling
9. **Maximize robustness with fast startup and graceful shutdown**: Health check configuration
10. **Keep development, staging, and production as similar as possible**: Consistent config structure
11. **Treat logs as event streams**: Log level and format configuration
12. **Admin processes should run as one-off processes**: Configuration supports admin tools

### How Configuration is Loaded

Configuration is loaded in the following order of precedence (highest to lowest):

1. **Environment Variables** - Runtime environment variables
2. **.env Files** - Local environment files (development only)
3. **Default Values** - Built-in safe defaults

```typescript
// Configuration loading order
const config = {
  // 1. Environment variables (highest priority)
  jwtSecret: process.env.JWT_SECRET,
  
  // 2. .env file values
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  
  // 3. Default values (lowest priority)
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
};
```

## Environment Variables

### JWT Authentication

#### JWT_SECRET
- **Type**: String
- **Required**: Yes
- **Description**: Secret key used for signing and verifying JWT tokens
- **Example**: `"your-super-secret-jwt-key-minimum-32-characters-long"`
- **Security**: Never commit to Git, use different secrets per environment
- **Validation**: Must be at least 32 characters long

```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
```

#### JWT_EXPIRATION
- **Type**: String
- **Required**: No
- **Default**: `"1h"`
- **Description**: Token expiration time for access tokens
- **Format**: Zeit/ms format (e.g., "2h", "7d", "10m", "30s")
- **Examples**: 
  - `"15m"` - 15 minutes
  - `"2h"` - 2 hours
  - `"7d"` - 7 days
  - `"30d"` - 30 days

#### JWT_REFRESH_EXPIRATION
- **Type**: String
- **Required**: No
- **Default**: `"7d"`
- **Description**: Expiration time for refresh tokens
- **Format**: Zeit/ms format
- **Security**: Should be longer than access token expiration

#### JWT_ISSUER
- **Type**: String
- **Required**: No
- **Default**: `"mindblock-api"`
- **Description**: JWT token issuer claim
- **Validation**: Must match between services in distributed systems

#### JWT_AUDIENCE
- **Type**: String
- **Required**: No
- **Default**: `"mindblock-users"`
- **Description**: JWT token audience claim
- **Security**: Restricts token usage to specific audiences

### Rate Limiting

#### RATE_LIMIT_WINDOW
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `900000` (15 minutes)
- **Description**: Time window for rate limiting in milliseconds
- **Examples**:
  - `60000` - 1 minute
  - `300000` - 5 minutes
  - `900000` - 15 minutes
  - `3600000` - 1 hour

#### RATE_LIMIT_MAX_REQUESTS
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Maximum number of requests per window per IP/user
- **Examples**:
  - `10` - Very restrictive (admin endpoints)
  - `100` - Standard API endpoints
  - `1000` - Permissive (public endpoints)

#### RATE_LIMIT_REDIS_URL
- **Type**: String
- **Required**: No
- **Description**: Redis connection URL for distributed rate limiting
- **Format**: Redis connection string
- **Example**: `"redis://localhost:6379"`
- **Note**: If not provided, rate limiting falls back to in-memory storage

#### RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Whether to count successful requests against rate limit
- **Values**: `true`, `false`

#### RATE_LIMIT_KEY_GENERATOR
- **Type**: String
- **Required**: No
- **Default**: `"ip"`
- **Description**: Strategy for generating rate limit keys
- **Values**: `"ip"`, `"user"`, `"ip+path"`, `"user+path"`

### CORS

#### CORS_ORIGIN
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: `"*"`
- **Description**: Allowed origins for cross-origin requests
- **Examples**:
  - `"*"` - Allow all origins (development only)
  - `"https://mindblock.app"` - Single origin
  - `"https://mindblock.app,https://admin.mindblock.app"` - Multiple origins
  - `"false"` - Disable CORS

#### CORS_CREDENTIALS
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Allow credentials (cookies, authorization headers) in CORS requests
- **Values**: `true`, `false`

#### CORS_METHODS
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: `"GET,POST,PUT,DELETE,OPTIONS"`
- **Description**: HTTP methods allowed for CORS requests

#### CORS_ALLOWED_HEADERS
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: `"Content-Type,Authorization"`
- **Description**: HTTP headers allowed in CORS requests

#### CORS_MAX_AGE
- **Type**: Number (seconds)
- **Required**: No
- **Default**: `86400` (24 hours)
- **Description**: How long results of a preflight request can be cached

### Security Headers

#### HSTS_MAX_AGE
- **Type**: Number (seconds)
- **Required**: No
- **Default**: `31536000` (1 year)
- **Description**: HTTP Strict Transport Security max-age value
- **Security**: Set to 0 to disable HSTS in development

#### HSTS_INCLUDE_SUBDOMAINS
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Whether to include subdomains in HSTS policy

#### HSTS_PRELOAD
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Whether to include preload directive in HSTS policy

#### CSP_DIRECTIVES
- **Type**: String
- **Required**: No
- **Default**: `"default-src 'self'"`
- **Description**: Content Security Policy directives
- **Examples**:
  - `"default-src 'self'; script-src 'self' 'unsafe-inline'"`
  - `"default-src 'self'; img-src 'self' data: https:"`

#### CSP_REPORT_ONLY
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Enable CSP report-only mode for testing

### Logging

#### LOG_LEVEL
- **Type**: String
- **Required**: No
- **Default**: `"info"`
- **Description**: Minimum log level to output
- **Values**: `"debug"`, `"info"`, `"warn"`, `"error"`
- **Hierarchy**: `debug` → `info` → `warn` → `error`

#### LOG_FORMAT
- **Type**: String
- **Required**: No
- **Default**: `"json"`
- **Description**: Log output format
- **Values**: `"json"`, `"pretty"`, `"simple"`

#### LOG_FILE_PATH
- **Type**: String
- **Required**: No
- **Description**: Path to log file (if logging to file)
- **Example**: `"/var/log/mindblock/middleware.log"`

#### LOG_MAX_FILE_SIZE
- **Type**: String
- **Required**: No
- **Default**: `"10m"`
- **Description**: Maximum log file size before rotation
- **Format**: Human-readable size (e.g., "10m", "100M", "1G")

#### LOG_MAX_FILES
- **Type**: Number
- **Required**: No
- **Default**: `5`
- **Description**: Maximum number of log files to keep

#### LOG_REQUEST_BODY
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Whether to log request bodies (security consideration)

#### LOG_RESPONSE_BODY
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Whether to log response bodies (security consideration)

### Performance

#### COMPRESSION_ENABLED
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable response compression
- **Values**: `true`, `false`

#### COMPRESSION_LEVEL
- **Type**: Number
- **Required**: No
- **Default**: `6`
- **Description**: Compression level (1-9, where 9 is maximum compression)
- **Trade-off**: Higher compression = more CPU, less bandwidth

#### COMPRESSION_THRESHOLD
- **Type**: Number (bytes)
- **Required**: No
- **Default**: `1024`
- **Description**: Minimum response size to compress
- **Example**: `1024` (1KB)

#### COMPRESSION_TYPES
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: `"text/html,text/css,text/javascript,application/json"`
- **Description**: MIME types to compress

#### REQUEST_TIMEOUT
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `30000` (30 seconds)
- **Description**: Default request timeout
- **Examples**:
  - `5000` - 5 seconds (fast APIs)
  - `30000` - 30 seconds (standard)
  - `120000` - 2 minutes (slow operations)

#### KEEP_ALIVE_TIMEOUT
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `5000` (5 seconds)
- **Description**: Keep-alive timeout for HTTP connections

#### HEADERS_TIMEOUT
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `60000` (1 minute)
- **Description**: Timeout for receiving headers

### Monitoring

#### ENABLE_METRICS
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable metrics collection
- **Values**: `true`, `false`

#### METRICS_PORT
- **Type**: Number
- **Required**: No
- **Default**: `9090`
- **Description**: Port for metrics endpoint
- **Note**: Must be different from main application port

#### METRICS_PATH
- **Type**: String
- **Required**: No
- **Default**: `"/metrics"`
- **Description**: Path for metrics endpoint

#### METRICS_PREFIX
- **Type**: String
- **Required**: No
- **Default**: `"mindblock_middleware_"`
- **Description**: Prefix for all metric names

#### ENABLE_TRACING
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Enable distributed tracing
- **Values**: `true`, `false`

#### JAEGER_ENDPOINT
- **Type**: String
- **Required**: No
- **Description**: Jaeger collector endpoint
- **Example**: `"http://localhost:14268/api/traces"`

#### ZIPKIN_ENDPOINT
- **Type**: String
- **Required**: No
- **Description**: Zipkin collector endpoint
- **Example**: `"http://localhost:9411/api/v2/spans"`

### Validation

#### VALIDATION_STRICT
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable strict validation mode
- **Values**: `true`, `false`

#### VALIDATION_WHITELIST
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Strip non-whitelisted properties from input
- **Values**: `true`, `false`

#### VALIDATION_TRANSFORM
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Transform input to match expected types
- **Values**: `true`, `false`

#### VALIDATION_FORBID_NON_WHITELISTED
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Reject requests with non-whitelisted properties
- **Values**: `true`, `false`

#### MAX_REQUEST_SIZE
- **Type**: String
- **Required**: No
- **Default**: `"10mb"`
- **Description**: Maximum request body size
- **Format**: Human-readable size (e.g., "1mb", "100kb")

#### MAX_URL_LENGTH
- **Type**: Number
- **Required**: No
- **Default**: `2048`
- **Description**: Maximum URL length in characters

## Configuration Files

### Development (.env.development)

```bash
# Development environment configuration
NODE_ENV=development

# JWT Configuration (less secure for development)
JWT_SECRET=dev-secret-key-for-development-only-not-secure
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Rate Limiting (relaxed for development)
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# CORS (permissive for development)
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Security Headers (relaxed for development)
HSTS_MAX_AGE=0
CSP_DIRECTIVES=default-src 'self' 'unsafe-inline' 'unsafe-eval'

# Logging (verbose for development)
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_REQUEST_BODY=true
LOG_RESPONSE_BODY=true

# Performance (optimized for development)
COMPRESSION_ENABLED=false
REQUEST_TIMEOUT=60000

# Monitoring (enabled for development)
ENABLE_METRICS=true
METRICS_PORT=9090

# Validation (relaxed for development)
VALIDATION_STRICT=false

# Database (local development)
DATABASE_URL=postgresql://localhost:5432/mindblock_dev
REDIS_URL=redis://localhost:6379

# External Services (local development)
EXTERNAL_API_BASE_URL=http://localhost:3001
```

### Staging (.env.staging)

```bash
# Staging environment configuration
NODE_ENV=staging

# JWT Configuration (secure)
JWT_SECRET=staging-super-secret-jwt-key-32-chars-minimum
JWT_EXPIRATION=2h
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=staging-mindblock-api
JWT_AUDIENCE=staging-mindblock-users

# Rate Limiting (moderate restrictions)
RATE_LIMIT_WINDOW=300000
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_REDIS_URL=redis://staging-redis:6379
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# CORS (staging domains)
CORS_ORIGIN=https://staging.mindblock.app,https://admin-staging.mindblock.app
CORS_CREDENTIALS=true

# Security Headers (standard security)
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
CSP_DIRECTIVES=default-src 'self'; script-src 'self' 'unsafe-inline'

# Logging (standard logging)
LOG_LEVEL=info
LOG_FORMAT=json
LOG_REQUEST_BODY=false
LOG_RESPONSE_BODY=false

# Performance (production-like)
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
REQUEST_TIMEOUT=30000

# Monitoring (full monitoring)
ENABLE_METRICS=true
ENABLE_TRACING=true
JAEGER_ENDPOINT=http://jaeger-staging:14268/api/traces

# Validation (standard validation)
VALIDATION_STRICT=true
MAX_REQUEST_SIZE=5mb

# Database (staging)
DATABASE_URL=postgresql://staging-db:5432/mindblock_staging
REDIS_URL=redis://staging-redis:6379

# External Services (staging)
EXTERNAL_API_BASE_URL=https://api-staging.mindblock.app
```

### Production (.env.production)

```bash
# Production environment configuration
NODE_ENV=production

# JWT Configuration (maximum security)
JWT_SECRET=production-super-secret-jwt-key-64-chars-minimum-length
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=production-mindblock-api
JWT_AUDIENCE=production-mindblock-users

# Rate Limiting (strict restrictions)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REDIS_URL=redis://prod-redis-cluster:6379
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true

# CORS (production domains only)
CORS_ORIGIN=https://mindblock.app,https://admin.mindblock.app
CORS_CREDENTIALS=true

# Security Headers (maximum security)
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
CSP_DIRECTIVES=default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
CSP_REPORT_ONLY=false

# Logging (error-only for production)
LOG_LEVEL=error
LOG_FORMAT=json
LOG_REQUEST_BODY=false
LOG_RESPONSE_BODY=false
LOG_FILE_PATH=/var/log/mindblock/middleware.log
LOG_MAX_FILE_SIZE=100M
LOG_MAX_FILES=10

# Performance (optimized for production)
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=9
COMPRESSION_THRESHOLD=512
REQUEST_TIMEOUT=15000
KEEP_ALIVE_TIMEOUT=5000

# Monitoring (full observability)
ENABLE_METRICS=true
ENABLE_TRACING=true
METRICS_PREFIX=mindblock_prod_middleware_
JAEGER_ENDPOINT=https://jaeger-production.internal/api/traces

# Validation (strict validation)
VALIDATION_STRICT=true
VALIDATION_FORBID_NON_WHITELISTED=true
MAX_REQUEST_SIZE=1mb
MAX_URL_LENGTH=1024

# Database (production)
DATABASE_URL=postgresql://prod-db-cluster:5432/mindblock_prod
REDIS_URL=redis://prod-redis-cluster:6379

# External Services (production)
EXTERNAL_API_BASE_URL=https://api.mindblock.app
EXTERNAL_API_TIMEOUT=5000
```

## Configuration Loading

### How Environment Variables are Loaded

```typescript
// Configuration loading implementation
export class ConfigLoader {
  static load(): MiddlewareConfig {
    // 1. Load from environment variables
    const envConfig = this.loadFromEnvironment();
    
    // 2. Validate configuration
    this.validate(envConfig);
    
    // 3. Apply defaults
    const config = this.applyDefaults(envConfig);
    
    // 4. Transform/clean configuration
    return this.transform(config);
  }
  
  private static loadFromEnvironment(): Partial<MiddlewareConfig> {
    return {
      // JWT Configuration
      jwt: {
        secret: process.env.JWT_SECRET,
        expiration: process.env.JWT_EXPIRATION || '1h',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
        issuer: process.env.JWT_ISSUER || 'mindblock-api',
        audience: process.env.JWT_AUDIENCE || 'mindblock-users',
      },
      
      // Rate Limiting
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        redisUrl: process.env.RATE_LIMIT_REDIS_URL,
        skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
      },
      
      // CORS
      cors: {
        origin: this.parseArray(process.env.CORS_ORIGIN || '*'),
        credentials: process.env.CORS_CREDENTIALS !== 'false',
        methods: this.parseArray(process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS'),
        allowedHeaders: this.parseArray(process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization'),
        maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'),
      },
      
      // Security Headers
      security: {
        hsts: {
          maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
          includeSubdomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
          preload: process.env.HSTS_PRELOAD === 'true',
        },
        csp: {
          directives: process.env.CSP_DIRECTIVES || "default-src 'self'",
          reportOnly: process.env.CSP_REPORT_ONLY === 'true',
        },
      },
      
      // Logging
      logging: {
        level: (process.env.LOG_LEVEL as LogLevel) || 'info',
        format: (process.env.LOG_FORMAT as LogFormat) || 'json',
        filePath: process.env.LOG_FILE_PATH,
        maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        logRequestBody: process.env.LOG_REQUEST_BODY === 'true',
        logResponseBody: process.env.LOG_RESPONSE_BODY === 'true',
      },
      
      // Performance
      performance: {
        compression: {
          enabled: process.env.COMPRESSION_ENABLED !== 'false',
          level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
          threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024'),
          types: this.parseArray(process.env.COMPRESSION_TYPES || 'text/html,text/css,text/javascript,application/json'),
        },
        timeout: {
          request: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
          keepAlive: parseInt(process.env.KEEP_ALIVE_TIMEOUT || '5000'),
          headers: parseInt(process.env.HEADERS_TIMEOUT || '60000'),
        },
      },
      
      // Monitoring
      monitoring: {
        metrics: {
          enabled: process.env.ENABLE_METRICS !== 'false',
          port: parseInt(process.env.METRICS_PORT || '9090'),
          path: process.env.METRICS_PATH || '/metrics',
          prefix: process.env.METRICS_PREFIX || 'mindblock_middleware_',
        },
        tracing: {
          enabled: process.env.ENABLE_TRACING === 'true',
          jaegerEndpoint: process.env.JAEGER_ENDPOINT,
          zipkinEndpoint: process.env.ZIPKIN_ENDPOINT,
        },
      },
      
      // Validation
      validation: {
        strict: process.env.VALIDATION_STRICT !== 'false',
        whitelist: process.env.VALIDATION_WHITELIST !== 'false',
        transform: process.env.VALIDATION_TRANSFORM !== 'false',
        forbidNonWhitelisted: process.env.VALIDATION_FORBID_NON_WHITELISTED !== 'false',
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        maxUrlLength: parseInt(process.env.MAX_URL_LENGTH || '2048'),
      },
    };
  }
  
  private static parseArray(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
}
```

### Precedence Order (environment > file > defaults)

```typescript
// Configuration precedence example
export class ConfigManager {
  private config: MiddlewareConfig;
  
  constructor() {
    this.config = this.loadConfiguration();
  }
  
  private loadConfiguration(): MiddlewareConfig {
    // 1. Start with defaults (lowest priority)
    let config = this.getDefaultConfig();
    
    // 2. Load from .env files (medium priority)
    config = this.mergeConfig(config, this.loadFromEnvFiles());
    
    // 3. Load from environment variables (highest priority)
    config = this.mergeConfig(config, this.loadFromEnvironment());
    
    return config;
  }
  
  private mergeConfig(base: MiddlewareConfig, override: Partial<MiddlewareConfig>): MiddlewareConfig {
    return {
      jwt: { ...base.jwt, ...override.jwt },
      rateLimit: { ...base.rateLimit, ...override.rateLimit },
      cors: { ...base.cors, ...override.cors },
      security: { ...base.security, ...override.security },
      logging: { ...base.logging, ...override.logging },
      performance: { ...base.performance, ...override.performance },
      monitoring: { ...base.monitoring, ...override.monitoring },
      validation: { ...base.validation, ...override.validation },
    };
  }
}
```

### Validation of Configuration on Startup

```typescript
// Configuration validation
export class ConfigValidator {
  static validate(config: MiddlewareConfig): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Validate JWT configuration
    this.validateJwt(config.jwt, errors);
    
    // Validate rate limiting
    this.validateRateLimit(config.rateLimit, errors);
    
    // Validate CORS
    this.validateCors(config.cors, errors);
    
    // Validate security headers
    this.validateSecurity(config.security, errors);
    
    // Validate logging
    this.validateLogging(config.logging, errors);
    
    // Validate performance
    this.validatePerformance(config.performance, errors);
    
    // Validate monitoring
    this.validateMonitoring(config.monitoring, errors);
    
    // Validate validation settings (meta!)
    this.validateValidation(config.validation, errors);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  private static validateJwt(jwt: JwtConfig, errors: ValidationError[]): void {
    if (!jwt.secret) {
      errors.push({
        field: 'jwt.secret',
        message: 'JWT_SECRET is required',
        severity: 'error',
      });
    } else if (jwt.secret.length < 32) {
      errors.push({
        field: 'jwt.secret',
        message: 'JWT_SECRET must be at least 32 characters long',
        severity: 'error',
      });
    }
    
    if (jwt.expiration && !this.isValidDuration(jwt.expiration)) {
      errors.push({
        field: 'jwt.expiration',
        message: 'Invalid JWT_EXPIRATION format',
        severity: 'error',
      });
    }
  }
  
  private static validateRateLimit(rateLimit: RateLimitConfig, errors: ValidationError[]): void {
    if (rateLimit.windowMs < 1000) {
      errors.push({
        field: 'rateLimit.windowMs',
        message: 'RATE_LIMIT_WINDOW must be at least 1000ms',
        severity: 'error',
      });
    }
    
    if (rateLimit.maxRequests < 1) {
      errors.push({
        field: 'rateLimit.maxRequests',
        message: 'RATE_LIMIT_MAX_REQUESTS must be at least 1',
        severity: 'error',
      });
    }
    
    if (rateLimit.redisUrl && !this.isValidRedisUrl(rateLimit.redisUrl)) {
      errors.push({
        field: 'rateLimit.redisUrl',
        message: 'Invalid RATE_LIMIT_REDIS_URL format',
        severity: 'error',
      });
    }
  }
  
  private static isValidDuration(duration: string): boolean {
    const durationRegex = /^\d+(ms|s|m|h|d|w)$/;
    return durationRegex.test(duration);
  }
  
  private static isValidRedisUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('redis://') || url.startsWith('rediss://');
    } catch {
      return false;
    }
  }
}

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}
```

### Handling Missing Required Variables

```typescript
// Required variable handling
export class RequiredConfigHandler {
  static handleMissing(required: string[]): never {
    const missing = required.filter(name => !process.env[name]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(name => {
        console.error(`   - ${name}`);
      });
      console.error('\nPlease set these environment variables and restart the application.');
      console.error('Refer to the documentation for required values and formats.\n');
      process.exit(1);
    }
  }
  
  static handleOptionalMissing(optional: string[]): void {
    const missing = optional.filter(name => !process.env[name]);
    
    if (missing.length > 0) {
      console.warn('⚠️  Optional environment variables not set (using defaults):');
      missing.forEach(name => {
        const defaultValue = this.getDefaultValue(name);
        console.warn(`   - ${name} (default: ${defaultValue})`);
      });
    }
  }
  
  private static getDefaultValue(name: string): string {
    const defaults: Record<string, string> = {
      'JWT_EXPIRATION': '1h',
      'RATE_LIMIT_WINDOW': '900000',
      'RATE_LIMIT_MAX_REQUESTS': '100',
      'LOG_LEVEL': 'info',
      'COMPRESSION_ENABLED': 'true',
      'ENABLE_METRICS': 'true',
    };
    
    return defaults[name] || 'not specified';
  }
}
```

## Default Values

### Complete Configuration Defaults Table

| Variable | Default | Description | Category |
|----------|---------|-------------|----------|
| `JWT_SECRET` | *required* | JWT signing secret | Auth |
| `JWT_EXPIRATION` | `"1h"` | Access token expiration | Auth |
| `JWT_REFRESH_EXPIRATION` | `"7d"` | Refresh token expiration | Auth |
| `JWT_ISSUER` | `"mindblock-api"` | Token issuer | Auth |
| `JWT_AUDIENCE` | `"mindblock-users"` | Token audience | Auth |
| `RATE_LIMIT_WINDOW` | `900000` | Rate limit window (15 min) | Security |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window | Security |
| `RATE_LIMIT_REDIS_URL` | `undefined` | Redis URL for distributed limiting | Security |
| `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS` | `false` | Skip successful requests | Security |
| `CORS_ORIGIN` | `"*"` | Allowed origins | Security |
| `CORS_CREDENTIALS` | `true` | Allow credentials | Security |
| `CORS_METHODS` | `"GET,POST,PUT,DELETE,OPTIONS"` | Allowed methods | Security |
| `CORS_ALLOWED_HEADERS` | `"Content-Type,Authorization"` | Allowed headers | Security |
| `CORS_MAX_AGE` | `86400` | Preflight cache duration | Security |
| `HSTS_MAX_AGE` | `31536000` | HSTS max age (1 year) | Security |
| `HSTS_INCLUDE_SUBDOMAINS` | `true` | Include subdomains in HSTS | Security |
| `HSTS_PRELOAD` | `false` | HSTS preload directive | Security |
| `CSP_DIRECTIVES` | `"default-src 'self'"` | Content Security Policy | Security |
| `CSP_REPORT_ONLY` | `false` | CSP report-only mode | Security |
| `LOG_LEVEL` | `"info"` | Minimum log level | Monitoring |
| `LOG_FORMAT` | `"json"` | Log output format | Monitoring |
| `LOG_FILE_PATH` | `undefined` | Log file path | Monitoring |
| `LOG_MAX_FILE_SIZE` | `"10m"` | Max log file size | Monitoring |
| `LOG_MAX_FILES` | `5` | Max log files to keep | Monitoring |
| `LOG_REQUEST_BODY` | `false` | Log request bodies | Monitoring |
| `LOG_RESPONSE_BODY` | `false` | Log response bodies | Monitoring |
| `COMPRESSION_ENABLED` | `true` | Enable compression | Performance |
| `COMPRESSION_LEVEL` | `6` | Compression level (1-9) | Performance |
| `COMPRESSION_THRESHOLD` | `1024` | Min size to compress | Performance |
| `COMPRESSION_TYPES` | `"text/html,text/css,text/javascript,application/json"` | Types to compress | Performance |
| `REQUEST_TIMEOUT` | `30000` | Request timeout (30s) | Performance |
| `KEEP_ALIVE_TIMEOUT` | `5000` | Keep-alive timeout | Performance |
| `HEADERS_TIMEOUT` | `60000` | Headers timeout | Performance |
| `ENABLE_METRICS` | `true` | Enable metrics collection | Monitoring |
| `METRICS_PORT` | `9090` | Metrics endpoint port | Monitoring |
| `METRICS_PATH` | `"/metrics"` | Metrics endpoint path | Monitoring |
| `METRICS_PREFIX` | `"mindblock_middleware_"` | Metrics name prefix | Monitoring |
| `ENABLE_TRACING` | `false` | Enable distributed tracing | Monitoring |
| `JAEGER_ENDPOINT` | `undefined` | Jaeger collector endpoint | Monitoring |
| `ZIPKIN_ENDPOINT` | `undefined` | Zipkin collector endpoint | Monitoring |
| `VALIDATION_STRICT` | `true` | Strict validation mode | Validation |
| `VALIDATION_WHITELIST` | `true` | Strip non-whitelisted props | Validation |
| `VALIDATION_TRANSFORM` | `true` | Transform input types | Validation |
| `VALIDATION_FORBID_NON_WHITELISTED` | `true` | Reject non-whitelisted | Validation |
| `MAX_REQUEST_SIZE` | `"10mb"` | Max request body size | Validation |
| `MAX_URL_LENGTH` | `2048` | Max URL length | Validation |

## Security Best Practices

### Never Commit Secrets to Git

```bash
# .gitignore - Always include these patterns
.env
.env.local
.env.development
.env.staging
.env.production
*.key
*.pem
*.p12
secrets/
```

```typescript
// Secure configuration loading
export class SecureConfigLoader {
  static load(): SecureConfig {
    // Never log secrets
    const config = {
      jwtSecret: process.env.JWT_SECRET, // Don't log this
      databaseUrl: process.env.DATABASE_URL, // Don't log this
    };
    
    // Validate without exposing values
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
    
    return config;
  }
}
```

### Use Secret Management Tools

#### AWS Secrets Manager
```typescript
// AWS Secrets Manager integration
export class AWSSecretsManager {
  static async loadSecret(secretName: string): Promise<string> {
    const client = new SecretsManagerClient();
    
    try {
      const response = await client.send(new GetSecretValueCommand({
        SecretId: secretName,
      }));
      
      return response.SecretString as string;
    } catch (error) {
      console.error(`Failed to load secret ${secretName}:`, error);
      throw error;
    }
  }
  
  static async loadAllSecrets(): Promise<Record<string, string>> {
    const secrets = {
      JWT_SECRET: await this.loadSecret('mindblock/jwt-secret'),
      DATABASE_URL: await this.loadSecret('mindblock/database-url'),
      REDIS_URL: await this.loadSecret('mindblock/redis-url'),
    };
    
    return secrets;
  }
}
```

#### HashiCorp Vault
```typescript
// Vault integration
export class VaultSecretLoader {
  static async loadSecret(path: string): Promise<any> {
    const vault = new Vault({
      endpoint: process.env.VAULT_ENDPOINT,
      token: process.env.VAULT_TOKEN,
    });
    
    try {
      const result = await vault.read(path);
      return result.data;
    } catch (error) {
      console.error(`Failed to load secret from Vault: ${path}`, error);
      throw error;
    }
  }
}
```

### Rotate Secrets Regularly

```typescript
// Secret rotation monitoring
export class SecretRotationMonitor {
  static checkSecretAge(secretName: string, maxAge: number): void {
    const createdAt = process.env[`${secretName}_CREATED_AT`];
    
    if (createdAt) {
      const age = Date.now() - parseInt(createdAt);
      if (age > maxAge) {
        console.warn(`⚠️  Secret ${secretName} is ${Math.round(age / (24 * 60 * 60 * 1000))} days old. Consider rotation.`);
      }
    }
  }
  
  static monitorAllSecrets(): void {
    this.checkSecretAge('JWT_SECRET', 90 * 24 * 60 * 60 * 1000); // 90 days
    this.checkSecretAge('DATABASE_PASSWORD', 30 * 24 * 60 * 60 * 1000); // 30 days
    this.checkSecretAge('API_KEY', 60 * 24 * 60 * 60 * 1000); // 60 days
  }
}
```

### Different Secrets Per Environment

```bash
# Environment-specific secret naming convention
# Development
JWT_SECRET_DEV=dev-secret-1
DATABASE_URL_DEV=postgresql://localhost:5432/mindblock_dev

# Staging  
JWT_SECRET_STAGING=staging-secret-1
DATABASE_URL_STAGING=postgresql://staging-db:5432/mindblock_staging

# Production
JWT_SECRET_PROD=prod-secret-1
DATABASE_URL_PROD=postgresql://prod-db:5432/mindblock_prod
```

```typescript
// Environment-specific secret loading
export class EnvironmentSecretLoader {
  static loadSecret(baseName: string): string {
    const env = process.env.NODE_ENV || 'development';
    const envSpecificName = `${baseName}_${env.toUpperCase()}`;
    
    return process.env[envSpecificName] || process.env[baseName];
  }
  
  static loadAllSecrets(): Record<string, string> {
    return {
      jwtSecret: this.loadSecret('JWT_SECRET'),
      databaseUrl: this.loadSecret('DATABASE_URL'),
      redisUrl: this.loadSecret('REDIS_URL'),
    };
  }
}
```

### Minimum Secret Lengths

```typescript
// Secret strength validation
export class SecretStrengthValidator {
  static validateJwtSecret(secret: string): ValidationResult {
    const errors: string[] = [];
    
    if (secret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    
    if (secret.length < 64) {
      errors.push('JWT_SECRET should be at least 64 characters for production');
    }
    
    if (!this.hasEnoughEntropy(secret)) {
      errors.push('JWT_SECRET should contain a mix of letters, numbers, and symbols');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  static hasEnoughEntropy(secret: string): boolean {
    const hasLetters = /[a-zA-Z]/.test(secret);
    const hasNumbers = /\d/.test(secret);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);
    
    return (hasLetters && hasNumbers && hasSymbols) || secret.length >= 128;
  }
}
```

### Secret Generation Recommendations

```bash
# Generate secure secrets using different methods

# OpenSSL (recommended)
JWT_SECRET=$(openssl rand -base64 32)
JWT_SECRET_LONG=$(openssl rand -base64 64)

# Node.js crypto
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python secrets
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# UUID (less secure, but better than nothing)
JWT_SECRET=$(uuidgen | tr -d '-')
```

```typescript
// Programmatic secret generation
export class SecretGenerator {
  static generateSecureSecret(length: number = 64): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomBytes = require('crypto').randomBytes(length);
    
    return Array.from(randomBytes)
      .map(byte => chars[byte % chars.length])
      .join('');
  }
  
  static generateJwtSecret(): string {
    return this.generateSecureSecret(64);
  }
  
  static generateApiKey(): string {
    return `mk_${this.generateSecureSecret(32)}`;
  }
}
```

## Performance Tuning

### Rate Limiting Configuration for Different Loads

#### Low Traffic Applications (< 100 RPS)
```bash
# Relaxed rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

#### Medium Traffic Applications (100-1000 RPS)
```bash
# Standard rate limiting
RATE_LIMIT_WINDOW=300000
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379
```

#### High Traffic Applications (> 1000 RPS)
```bash
# Strict rate limiting with Redis
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
RATE_LIMIT_REDIS_URL=redis://redis-cluster:6379
```

#### API Gateway / CDN Edge
```bash
# Very strict rate limiting
RATE_LIMIT_WINDOW=10000
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_REDIS_URL=redis://edge-redis:6379
```

### Compression Settings by Server Capacity

#### Low-CPU Servers
```bash
# Minimal compression
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=1
COMPRESSION_THRESHOLD=2048
COMPRESSION_TYPES=text/html,text/css
```

#### Medium-CPU Servers
```bash
# Balanced compression
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024
COMPRESSION_TYPES=text/html,text/css,text/javascript,application/json
```

#### High-CPU Servers
```bash
# Maximum compression
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=9
COMPRESSION_THRESHOLD=512
COMPRESSION_TYPES=text/html,text/css,text/javascript,application/json,application/xml
```

### Timeout Values for Different Endpoint Types

#### Fast API Endpoints (< 100ms response time)
```bash
REQUEST_TIMEOUT=5000
KEEP_ALIVE_TIMEOUT=2000
HEADERS_TIMEOUT=10000
```

#### Standard API Endpoints (100ms-1s response time)
```bash
REQUEST_TIMEOUT=15000
KEEP_ALIVE_TIMEOUT=5000
HEADERS_TIMEOUT=30000
```

#### Slow API Endpoints (> 1s response time)
```bash
REQUEST_TIMEOUT=60000
KEEP_ALIVE_TIMEOUT=10000
HEADERS_TIMEOUT=60000
```

#### File Upload Endpoints
```bash
REQUEST_TIMEOUT=300000
KEEP_ALIVE_TIMEOUT=15000
HEADERS_TIMEOUT=120000
MAX_REQUEST_SIZE=100mb
```

### Cache TTL Recommendations

#### Static Content
```bash
# Long cache for static assets
CACHE_TTL_STATIC=86400000  # 24 hours
CACHE_TTL_IMAGES=31536000000  # 1 year
```

#### API Responses
```bash
# Short cache for dynamic content
CACHE_TTL_API=300000  # 5 minutes
CACHE_TTL_USER_DATA=60000  # 1 minute
CACHE_TTL_PUBLIC_DATA=1800000  # 30 minutes
```

#### Rate Limiting Data
```bash
# Rate limit cache duration
RATE_LIMIT_CACHE_TTL=900000  # 15 minutes
RATE_LIMIT_CLEANUP_INTERVAL=300000  # 5 minutes
```

### Redis Connection Pool Sizing

#### Small Applications
```bash
REDIS_POOL_MIN=2
REDIS_POOL_MAX=10
REDIS_POOL_ACQUIRE_TIMEOUT=30000
```

#### Medium Applications
```bash
REDIS_POOL_MIN=5
REDIS_POOL_MAX=20
REDIS_POOL_ACQUIRE_TIMEOUT=15000
```

#### Large Applications
```bash
REDIS_POOL_MIN=10
REDIS_POOL_MAX=50
REDIS_POOL_ACQUIRE_TIMEOUT=10000
```

## Environment-Specific Configurations

### Development

#### Relaxed Rate Limits
```bash
# Very permissive for development
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=10000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# No Redis required for development
# RATE_LIMIT_REDIS_URL not set
```

#### Verbose Logging
```bash
# Debug logging with full details
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_REQUEST_BODY=true
LOG_RESPONSE_BODY=true

# Console output (no file logging)
# LOG_FILE_PATH not set
```

#### Disabled Security Features
```bash
# Relaxed security for testing
HSTS_MAX_AGE=0
CSP_DIRECTIVES=default-src 'self' 'unsafe-inline' 'unsafe-eval'
CORS_ORIGIN=*

# Compression disabled for easier debugging
COMPRESSION_ENABLED=false
```

#### Local Service Endpoints
```bash
# Local development services
DATABASE_URL=postgresql://localhost:5432/mindblock_dev
REDIS_URL=redis://localhost:6379
EXTERNAL_API_BASE_URL=http://localhost:3001
```

### Staging

#### Moderate Rate Limits
```bash
# Production-like but more permissive
RATE_LIMIT_WINDOW=300000
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_REDIS_URL=redis://staging-redis:6379
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
```

#### Standard Logging
```bash
# Production-like logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_REQUEST_BODY=false
LOG_RESPONSE_BODY=false

# File logging enabled
LOG_FILE_PATH=/var/log/mindblock/staging.log
LOG_MAX_FILE_SIZE=50M
LOG_MAX_FILES=5
```

#### Security Enabled but Not Strict
```bash
# Standard security settings
HSTS_MAX_AGE=86400  # 1 day instead of 1 year
HSTS_PRELOAD=false
CSP_DIRECTIVES=default-src 'self'; script-src 'self' 'unsafe-inline'
CSP_REPORT_ONLY=true

# Compression enabled
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
```

#### Staging Service Endpoints
```bash
# Staging environment services
DATABASE_URL=postgresql://staging-db:5432/mindblock_staging
REDIS_URL=redis://staging-redis:6379
EXTERNAL_API_BASE_URL=https://api-staging.mindblock.app
```

### Production

#### Strict Rate Limits
```bash
# Production rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REDIS_URL=redis://prod-redis-cluster:6379
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
```

#### Error-Level Logging Only
```bash
# Minimal logging for production
LOG_LEVEL=error
LOG_FORMAT=json
LOG_REQUEST_BODY=false
LOG_RESPONSE_BODY=false

# File logging with rotation
LOG_FILE_PATH=/var/log/mindblock/production.log
LOG_MAX_FILE_SIZE=100M
LOG_MAX_FILES=10
```

#### All Security Features Enabled
```bash
# Maximum security
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
CSP_DIRECTIVES=default-src 'self'; script-src 'self'; object-src 'none'
CSP_REPORT_ONLY=false

# Maximum compression
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=9
```

#### Production Service Endpoints
```bash
# Production services with failover
DATABASE_URL=postgresql://prod-db-cluster:5432/mindblock_prod
DATABASE_URL_FAILOVER=postgresql://prod-db-backup:5432/mindblock_prod
REDIS_URL=redis://prod-redis-cluster:6379
EXTERNAL_API_BASE_URL=https://api.mindblock.app
```

#### Performance Optimizations
```bash
# Optimized timeouts
REQUEST_TIMEOUT=15000
KEEP_ALIVE_TIMEOUT=5000
HEADERS_TIMEOUT=30000

# Connection pooling
REDIS_POOL_MIN=10
REDIS_POOL_MAX=50
REDIS_POOL_ACQUIRE_TIMEOUT=10000

# Monitoring enabled
ENABLE_METRICS=true
ENABLE_TRACING=true
METRICS_PREFIX=prod_mindblock_
```

## Troubleshooting

### Common Configuration Issues

#### Issue: JWT Verification Fails

**Symptoms:**
- 401 Unauthorized responses
- "Invalid token" errors
- Authentication failures

**Causes:**
- JWT_SECRET not set or incorrect
- JWT_SECRET differs between services
- Token expired

**Solutions:**
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify JWT_SECRET length (should be >= 32 chars)
echo $JWT_SECRET | wc -c

# Check token expiration
JWT_EXPIRATION=2h  # Increase for testing

# Verify JWT_SECRET matches between services
# Ensure all services use the same JWT_SECRET
```

#### Issue: Rate Limiting Not Working

**Symptoms:**
- No rate limiting effect
- All requests allowed
- Rate limit headers not present

**Causes:**
- RATE_LIMIT_REDIS_URL not configured for distributed setup
- Redis connection failed
- Rate limiting middleware not applied correctly

**Solutions:**
```bash
# Check Redis configuration
echo $RATE_LIMIT_REDIS_URL

# Test Redis connection
redis-cli -u $RATE_LIMIT_REDIS_URL ping

# Verify Redis is running
docker ps | grep redis

# Check rate limit values
echo "Window: $RATE_LIMIT_WINDOW ms"
echo "Max requests: $RATE_LIMIT_MAX_REQUESTS"

# For single instance, remove Redis URL
unset RATE_LIMIT_REDIS_URL
```

#### Issue: CORS Errors

**Symptoms:**
- Browser CORS errors
- "No 'Access-Control-Allow-Origin' header"
- Preflight request failures

**Causes:**
- CORS_ORIGIN doesn't include frontend URL
- Credentials mismatch
- Preflight methods not allowed

**Solutions:**
```bash
# Check CORS origin
echo $CORS_ORIGIN

# Add your frontend URL
CORS_ORIGIN=https://your-frontend-domain.com

# For multiple origins
CORS_ORIGIN=https://domain1.com,https://domain2.com

# Check credentials setting
echo $CORS_CREDENTIALS  # Should be 'true' if using cookies/auth

# Check allowed methods
echo $CORS_METHODS  # Should include your HTTP methods
```

#### Issue: Security Headers Missing

**Symptoms:**
- Missing security headers in responses
- Security scanner warnings
- HSTS not applied

**Causes:**
- Security middleware not applied
- Configuration values set to disable features
- Headers being overridden by other middleware

**Solutions:**
```bash
# Check security header configuration
echo $HSTS_MAX_AGE
echo $CSP_DIRECTIVES

# Ensure HSTS is enabled (not 0)
HSTS_MAX_AGE=31536000

# Check CSP is not empty
CSP_DIRECTIVES=default-src 'self'

# Verify middleware is applied in correct order
# Security middleware should be applied before other middleware
```

#### Issue: Configuration Not Loading

**Symptoms:**
- Default values being used
- Environment variables ignored
- Configuration validation errors

**Causes:**
- .env file not in correct location
- Environment variables not exported
- Configuration loading order issues

**Solutions:**
```bash
# Check .env file location
ls -la .env*

# Verify .env file is being loaded
cat .env

# Export environment variables manually (for testing)
export JWT_SECRET="test-secret-32-chars-long"
export LOG_LEVEL="debug"

# Restart application after changing .env
npm run restart
```

### Configuration Validation Errors

#### JWT Secret Too Short
```bash
# Error: JWT_SECRET must be at least 32 characters long

# Solution: Generate a proper secret
JWT_SECRET=$(openssl rand -base64 32)
export JWT_SECRET
```

#### Invalid Rate Limit Window
```bash
# Error: RATE_LIMIT_WINDOW must be at least 1000ms

# Solution: Use valid time window
RATE_LIMIT_WINDOW=900000  # 15 minutes
export RATE_LIMIT_WINDOW
```

#### Invalid Redis URL
```bash
# Error: Invalid RATE_LIMIT_REDIS_URL format

# Solution: Use correct Redis URL format
RATE_LIMIT_REDIS_URL=redis://localhost:6379
# or
RATE_LIMIT_REDIS_URL=redis://user:pass@host:port/db
export RATE_LIMIT_REDIS_URL
```

#### Invalid Log Level
```bash
# Error: Invalid LOG_LEVEL

# Solution: Use valid log level
LOG_LEVEL=debug  # or info, warn, error
export LOG_LEVEL
```

### Performance Issues

#### Slow Middleware Execution
```bash
# Check compression level
echo $COMPRESSION_LEVEL  # Lower for better performance

# Check timeout values
echo $REQUEST_TIMEOUT  # Lower for faster failure

# Check rate limit configuration
echo $RATE_LIMIT_MAX_REQUESTS  # Higher if too restrictive
```

#### High Memory Usage
```bash
# Check rate limit cache settings
RATE_LIMIT_CACHE_TTL=300000  # Lower TTL
RATE_LIMIT_CLEANUP_INTERVAL=60000  # More frequent cleanup

# Check log file size limits
LOG_MAX_FILE_SIZE=10M  # Lower max file size
LOG_MAX_FILES=3  # Fewer files
```

#### Database Connection Issues
```bash
# Check database URL format
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool settings
echo $DB_POOL_MIN
echo $DB_POOL_MAX
```

### Debug Configuration Loading

#### Enable Configuration Debugging
```typescript
// Add to your application startup
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuration Debug:');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('JWT Secret set:', !!process.env.JWT_SECRET);
  console.log('Rate Limit Window:', process.env.RATE_LIMIT_WINDOW);
  console.log('Log Level:', process.env.LOG_LEVEL);
  console.log('CORS Origin:', process.env.CORS_ORIGIN);
}
```

#### Validate All Configuration
```typescript
// Add comprehensive validation
import { ConfigValidator } from '@mindblock/middleware/config';

const validation = ConfigValidator.validate(config);
if (!validation.isValid) {
  console.error('❌ Configuration validation failed:');
  validation.errors.forEach(error => {
    console.error(`  ${error.field}: ${error.message}`);
  });
  process.exit(1);
} else {
  console.log('✅ Configuration validation passed');
}
```

#### Test Individual Middleware
```typescript
// Test middleware configuration individually
import { RateLimitingMiddleware } from '@mindblock/middleware/security';

try {
  const rateLimit = new RateLimitingMiddleware(config.rateLimit);
  console.log('✅ Rate limiting middleware configured successfully');
} catch (error) {
  console.error('❌ Rate limiting middleware configuration failed:', error.message);
}
```

This comprehensive configuration documentation provides complete guidance for configuring the middleware package in any environment, with detailed troubleshooting information and best practices for security and performance.
