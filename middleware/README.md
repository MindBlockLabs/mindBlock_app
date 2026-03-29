# @mindblock/middleware

## Package Overview

This package contains reusable, framework-friendly middleware building blocks for the Mind Block backend.

### Why a separate package?

Keeping middleware in its own workspace package makes it:

- easier to reuse across backend modules/services
- easier to test in isolation
- easier to version and evolve without coupling to app runtime concerns

### Main features / categories

- Auth
- Security
- Performance
- Monitoring
- Validation
- Common utilities

## Installation

From the monorepo root:

```bash
npm install
```

### Using from the backend

The backend can import from this workspace package:

```ts
import { /* future exports */ } from '@mindblock/middleware';
```

You can also import by category (once the exports exist):

```ts
import { /* future exports */ } from '@mindblock/middleware/auth';
```

## Quick Start

Example placeholder usage (actual middleware implementations will be added in later issues):

```ts
// import { AuthMiddleware } from '@mindblock/middleware/auth';

// app.use(new AuthMiddleware().handle);
```

## Available Middleware

- **Auth**: authentication/authorization helpers and middleware.
- **Security**: headers, CORS, rate limiting, and other security-related middleware.
- **Performance**: caching, compression, and performance instrumentation.
- **Monitoring**: logging, tracing, and metrics related middleware.
- **Validation**: request/DTO validation helpers.

Detailed documentation will live in the `docs/` folder (to be added in later issues).

## Configuration

A full configuration guide will be added at `docs/CONFIGURATION.md`.

Common environment variables (expected across middleware in the future) may include:

- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`
- `RATE_LIMIT_AUTH_LIMIT`
- `RATE_LIMIT_AUTH_WINDOW_MS`
- `RATE_LIMIT_PUZZLE_SUBMIT_LIMIT`
- `RATE_LIMIT_DAILY_QUEST_LIMIT`
- `RATE_LIMIT_READ_LIMIT`
- `RATE_LIMIT_ADMIN_LIMIT`
- `RATE_LIMIT_PUBLIC_LIMIT`
- `RATE_LIMIT_WHITELIST_IPS`

## Rate Limiting

The `security` package now includes a Redis-backed `RateLimitMiddleware` with:

- Per-tier limits for authentication, puzzle submission, daily quest generation, admin routes, read-only routes, and the public landing page
- User ID tracking for authenticated requests, with IP fallback for anonymous traffic
- Whitelisted IP exemptions
- `429 Too Many Requests` responses with `Retry-After`
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers
- Configurable burst allowance per tier
- Fail-open behavior when Redis is temporarily unavailable

Use `createDefaultRateLimitConfig()` from `src/security/rate-limit.config.ts` to build tier settings from environment variables.

## Testing

Run unit/integration tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:cov
```

Coverage requirements:

- 80% branches
- 80% functions
- 80% lines
- 80% statements

## Development

Build the package:

```bash
npm run build
```

Lint:

```bash
npm run lint
npm run lint:fix
```

Format:

```bash
npm run format
npm run format:check
```

## Contributing

A package-level contributing guide will be added at `docs/CONTRIBUTING.md`.

For now, follow the main project contributing guidelines:

- `../CONTRIBUTING.md`

## License

MIT License (or whatever the Mind Block repository uses).
