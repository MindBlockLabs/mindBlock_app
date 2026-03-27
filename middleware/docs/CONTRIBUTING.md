# Contributing to @mindblock/middleware

Thank you for your interest in contributing to the Mind Block middleware package! This guide will help you get started with contributing effectively and following our project standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher) or **yarn** (v1.22 or higher)
- **Git** (v2.30 or higher)
- **Docker** (optional, for integration tests)

### Project Structure

```
middleware/
├── src/
│   ├── auth/           # Authentication middleware
│   ├── security/       # Security middleware (CORS, rate limiting, etc.)
│   ├── performance/    # Performance middleware (caching, compression)
│   ├── monitoring/     # Monitoring middleware (logging, metrics)
│   ├── validation/     # Input validation middleware
│   ├── common/         # Shared utilities and base classes
│   ├── config/         # Configuration management
│   └── index.ts        # Main export file
├── tests/              # Integration tests
├── docs/               # Documentation
│   ├── ARCHITECTURE.md
│   ├── CONFIGURATION.md
│   └── CONTRIBUTING.md
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

### Understanding the Codebase

#### Middleware Categories

1. **Auth** (`src/auth/`): Authentication and authorization middleware
2. **Security** (`src/security/`): CORS, rate limiting, security headers
3. **Performance** (`src/performance/`): Caching, compression, optimization
4. **Monitoring** (`src/monitoring/`): Logging, metrics, distributed tracing
5. **Validation** (`src/validation/`): Input validation and sanitization
6. **Common** (`src/common/`): Shared utilities and base classes

#### Key Design Principles

- **Framework Agnostic**: Middleware works with Express, Fastify, Koa, etc.
- **Composable**: Middleware can be chained in any order
- **Configurable**: All middleware supports runtime configuration
- **Type Safe**: Full TypeScript support with comprehensive types
- **Testable**: Each middleware component is easily testable

## Development Setup

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/your-username/mindblock.git
cd mindblock/middleware
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/mindblock/mindblock.git
```

### Install Dependencies

```bash
# Install dependencies
npm install

# or with yarn
yarn install
```

### Development Scripts

```bash
# Development mode with watch
npm run dev

# Build the package
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Environment Setup

Create a `.env.development` file for local development:

```bash
# Copy the example file
cp .env.example .env.development

# Edit the file with your local configuration
nano .env.development
```

### IDE Configuration

#### VS Code

Install these recommended extensions:

- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** - Microsoft
- **Prettier** - Prettier
- **Jest** - Orta
- **Auto Rename Tag** - Jun Han
- **Bracket Pair Colorizer** - CoenraadS

Add this to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html"
  }
}
```

#### WebStorm

1. Enable ESLint: `Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint`
2. Enable Prettier: `Settings > Languages & Frameworks > JavaScript > Prettier`
3. Configure TypeScript: `Settings > Languages & Frameworks > TypeScript`

## Code Standards

### TypeScript Guidelines

#### Use Strict TypeScript

Always enable strict TypeScript mode:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Type Definitions

Always provide explicit type definitions:

```typescript
// Good
interface MiddlewareConfig {
  enabled: boolean;
  options: Record<string, any>;
}

const config: MiddlewareConfig = {
  enabled: true,
  options: {},
};

// Bad
const config = {
  enabled: true,
  options: {},
};
```

#### Use Interfaces for Objects

Prefer interfaces over type aliases for object shapes:

```typescript
// Good
interface User {
  id: string;
  email: string;
}

// Bad
type User = {
  id: string;
  email: string;
};
```

#### Use Generic Types

Make components generic when appropriate:

```typescript
// Good
export class ConfigurableMiddleware<T extends MiddlewareConfig> {
  constructor(private config: T) {}
}

// Bad
export class ConfigurableMiddleware {
  constructor(private config: any) {}
}
```

### Naming Conventions

#### Files and Directories

- Use **kebab-case** for files: `rate-limiting.middleware.ts`
- Use **kebab-case** for directories: `src/security/`
- Test files: `rate-limiting.middleware.spec.ts`

#### Classes and Interfaces

- Use **PascalCase** for classes: `RateLimitingMiddleware`
- Use **PascalCase** for interfaces: `RateLimitConfig`
- Prefix interfaces with `I` only when necessary for clarity

#### Functions and Variables

- Use **camelCase** for functions: `handleRequest()`
- Use **camelCase** for variables: `requestTimeout`
- Use **UPPER_SNAKE_CASE** for constants: `DEFAULT_TIMEOUT`

#### Types

- Use **PascalCase** for type names: `RequestContext`
- Use **PascalCase** for enum names: `LogLevel`

### Code Organization

#### File Structure

Each middleware file should follow this structure:

```typescript
// 1. Imports
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// 2. Type definitions
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// 3. Class implementation
@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  constructor(private readonly config: RateLimitConfig) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Implementation
  }
}
```

#### Export Organization

```typescript
// index.ts
// 1. Public exports
export { RateLimitingMiddleware } from './rate-limiting.middleware';
export { CorsMiddleware } from './cors.middleware';

// 2. Type exports
export type { RateLimitConfig } from './interfaces/rate-limit.interface';
export type { CorsConfig } from './interfaces/cors.interface';

// 3. Internal exports (for testing)
export * from './internal';
```

### Error Handling

#### Custom Error Classes

Create specific error classes for different scenarios:

```typescript
export class MiddlewareError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'MiddlewareError';
  }
}

export class ConfigurationError extends MiddlewareError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500);
    this.name = 'ConfigurationError';
  }
}
```

#### Error Handling Patterns

```typescript
// Good: Specific error handling
try {
  await this.validateConfig(config);
} catch (error) {
  throw new ConfigurationError(`Invalid configuration: ${error.message}`);
}

// Bad: Generic error handling
try {
  await this.validateConfig(config);
} catch (error) {
  throw new Error('Validation failed');
}
```

### Performance Guidelines

#### Avoid Blocking Operations

```typescript
// Good: Async operations
export class AsyncMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const data = await this.fetchData(req);
    req.data = data;
    next();
  }
}

// Bad: Blocking operations
export class BlockingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const data = fs.readFileSync('/tmp/data.json'); // Blocking!
    req.data = JSON.parse(data);
    next();
  }
}
```

#### Memory Management

```typescript
// Good: Efficient memory usage
export class MemoryEfficientMiddleware implements NestMiddleware {
  private cache = new LRUCache<string, any>({ max: 1000 });

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = this.generateKey(req);
    const cached = this.cache.get(key);
    
    if (cached) {
      req.data = cached;
      return next();
    }
    
    const data = await this.fetchData(req);
    this.cache.set(key, data);
    req.data = data;
    next();
  }
}
```

## Testing Guidelines

### Testing Philosophy

We follow the **Testing Pyramid** approach:

1. **Unit Tests**: Fast, isolated tests for individual functions/classes
2. **Integration Tests**: Tests for middleware interactions
3. **End-to-End Tests**: Tests for complete request flows

### Unit Testing

#### Test Structure

Each test file should follow this structure:

```typescript
describe('MiddlewareName', () => {
  let middleware: MiddlewareName;
  let mockConfig: MockConfigType;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Setup mocks
    mockConfig = createMockConfig();
    middleware = new MiddlewareName(mockConfig);
    mockReq = {};
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
  });

  describe('method/scenario', () => {
    it('should handle expected case', async () => {
      // Arrange
      const expected = 'expected result';
      
      // Act
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.result).toBe(expected);
    });

    it('should handle error case', async () => {
      // Arrange
      const error = new Error('Test error');
      jest.spyOn(middleware, 'someMethod').mockRejectedValue(error);
      
      // Act
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
```

#### Mocking Guidelines

```typescript
// Good: Specific mocks
const mockAuthService = {
  validateToken: jest.fn(),
  refreshToken: jest.fn(),
} as jest.Mocked<AuthService>;

// Bad: Mocking entire modules
jest.mock('../services/auth.service');
```

#### Test Coverage Requirements

- **Branch Coverage**: 80%
- **Function Coverage**: 80%
- **Line Coverage**: 80%
- **Statement Coverage**: 80%

```bash
# Check coverage
npm run test:cov

# Coverage threshold check
npm run test:coverage:check
```

### Integration Testing

#### NestJS Integration Tests

```typescript
describe('Middleware Integration', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [TestController],
      providers: [AuthService, ConfigService],
    })
    .overrideProvider(AuthService)
    .useValue(mockAuthService)
    .compile();

    app = module.createNestApplication();
    
    // Apply middleware
    app.use(new AuthMiddleware(authConfig));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should authenticate valid requests', async () => {
    const response = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.message).toBe('Success');
  });
});
```

### Test Utilities

#### Custom Test Helpers

```typescript
// tests/helpers/middleware-test-helper.ts
export class MiddlewareTestHelper {
  static createMockRequest(overrides: Partial<Request> = {}): Request {
    return {
      headers: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
      ...overrides,
    } as Request;
  }

  static createMockResponse(): Response {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
    } as any;
    
    return res;
  }

  static async expectMiddlewareChain(
    middleware: NestMiddleware[],
    req: Request,
    res: Response,
  ): Promise<void> {
    for (const mw of middleware) {
      await new Promise<void>((resolve, reject) => {
        mw.use(req, res, (error?: any) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }
}
```

#### Test Data Factories

```typescript
// tests/factories/config.factory.ts
export class ConfigFactory {
  static createRateLimitConfig(overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
    return {
      windowMs: 900000,
      maxRequests: 100,
      skipSuccessfulRequests: false,
      ...overrides,
    };
  }

  static createAuthConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
    return {
      jwtSecret: 'test-secret-32-chars-long',
      jwtExpiration: '1h',
      ...overrides,
    };
  }
}
```

## Documentation

### Code Documentation

#### JSDoc Comments

All public APIs must have JSDoc comments:

```typescript
/**
 * Rate limiting middleware to prevent abuse and DoS attacks.
 * 
 * @example
 * ```typescript
 * const rateLimit = new RateLimitingMiddleware({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 100, // limit each IP to 100 requests per windowMs
 * });
 * ```
 * 
 * @param config - Configuration for rate limiting
 * @throws {ConfigurationError} When configuration is invalid
 */
export class RateLimitingMiddleware implements NestMiddleware {
  constructor(private readonly config: RateLimitConfig) {}

  /**
   * Handles incoming requests and applies rate limiting.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise that resolves when middleware processing is complete
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Implementation
  }
}
```

#### Type Documentation

Document complex types with examples:

```typescript
/**
 * Configuration options for rate limiting middleware.
 * 
 * @interface RateLimitConfig
 */
export interface RateLimitConfig {
  /**
   * Time window in milliseconds for rate limiting.
   * @default 900000 (15 minutes)
   * @example 60000 // 1 minute
   */
  windowMs: number;

  /**
   * Maximum number of requests allowed per window.
   * @default 100
   * @example 10 // Very restrictive
   */
  maxRequests: number;

  /**
   * Whether to skip counting successful requests.
   * @default false
   */
  skipSuccessfulRequests?: boolean;
}
```

### README Documentation

#### Middleware README

Each middleware category should have its own README:

```markdown
# Security Middleware

## Overview

The security middleware package provides essential security features including CORS, rate limiting, and security headers.

## Installation

```bash
npm install @mindblock/middleware
```

## Usage

### Rate Limiting

```typescript
import { RateLimitingMiddleware } from '@mindblock/middleware/security';

const rateLimit = new RateLimitingMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

app.use(rateLimit.handle.bind(rateLimit));
```

### CORS

```typescript
import { CorsMiddleware } from '@mindblock/middleware/security';

const cors = new CorsMiddleware({
  origin: 'https://yourdomain.com',
  credentials: true,
});

app.use(cors.handle.bind(cors));
```

## Configuration

See [Configuration Documentation](../docs/CONFIGURATION.md) for detailed configuration options.
```

### API Documentation

#### Inline Examples

Include usage examples in code:

```typescript
// Example: Basic rate limiting
const basicRateLimit = new RateLimitingMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

// Example: Custom key generator
const userRateLimit = new RateLimitingMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  keyGenerator: (req) => `rate_limit:${req.user?.id || req.ip}`,
});

// Example: Skip certain requests
const selectiveRateLimit = new RateLimitingMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  skip: (req) => req.path.startsWith('/health'),
});
```

## Pull Request Process

### Branch Naming

Use descriptive branch names:

```bash
# Feature branches
feature/rate-limiting-middleware
feature/jwt-authentication
feature/cors-configuration

# Bugfix branches
fix/rate-limit-memory-leak
fix/cors-preflight-error

# Documentation branches
docs/update-architecture-docs
docs/add-configuration-examples
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: <type>[optional scope]: <description>

feat(auth): add JWT authentication middleware
fix(security): resolve CORS preflight issue
docs(performance): add caching examples
refactor(common): extract base middleware class
test(rate-limit): add integration tests
chore(deps): update dependencies
```

#### Commit Message Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Commit Message Examples

```bash
# Good
feat(auth): add JWT authentication middleware with configurable expiration

- Add JwtAuthMiddleware class
- Support configurable token expiration
- Include comprehensive unit tests
- Add documentation and examples

Closes #123

# Bad
add auth middleware

# Bad
fix stuff
```

### Pull Request Template

Use this template for pull requests:

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Coverage requirements met
- [ ] Manual testing completed

## Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
- [ ] Ready for review

## Issues

Closes #(issue number)

## Additional Notes

Any additional information for reviewers.
```

### Pull Request Review Process

#### Self-Review Checklist

Before submitting a PR, ensure:

1. **Code Quality**
   - [ ] Code follows TypeScript best practices
   - [ ] No ESLint errors or warnings
   - [ ] Code is properly formatted with Prettier
   - [ ] No console.log statements (except in logging middleware)

2. **Testing**
   - [ ] All tests pass
   - [ ] Coverage requirements met
   - [ ] Tests are meaningful and not just for coverage
   - [ ] Integration tests included where appropriate

3. **Documentation**
   - [ ] JSDoc comments added for public APIs
   - [ ] README updated if needed
   - [ ] Examples provided for new features
   - [ ] Configuration documentation updated

4. **Performance**
   - [ ] No performance regressions
   - [ ] Memory usage is reasonable
   - [ ] Async operations are properly handled

#### Review Process

1. **Automated Checks**
   - CI pipeline runs tests
   - Code quality checks pass
   - Build succeeds

2. **Peer Review**
   - At least one team member reviews the PR
   - Reviewer checks for code quality, functionality, and documentation
   - Feedback is addressed before merge

3. **Merge**
   - PR is merged after approval
   - Branch is deleted
   - Release notes are updated

### Code Review Guidelines

#### For Reviewers

1. **Be Constructive**
   - Provide specific, actionable feedback
   - Explain why changes are needed
   - Suggest improvements when possible

2. **Check Thoroughly**
   - Verify functionality matches requirements
   - Check for edge cases and error handling
   - Ensure tests are comprehensive

3. **Performance Impact**
   - Check for performance regressions
   - Verify memory usage is reasonable
   - Ensure async operations are efficient

#### For Contributors

1. **Respond Promptly**
   - Address feedback in a timely manner
   - Ask for clarification if needed
   - Explain design decisions when questioned

2. **Be Open to Feedback**
   - Consider all suggestions seriously
   - Explain reasoning for disagreements
   - Be willing to make improvements

## Release Process

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Checklist

#### Before Release

1. **Testing**
   - [ ] All tests pass
   - [ ] Coverage requirements met
   - [ ] Performance tests pass

2. **Documentation**
   - [ ] README is up to date
   - [ ] API documentation is current
   - [ ] Changelog is updated

3. **Code Quality**
   - [ ] No known bugs
   - [ ] Code is properly formatted
   - [ ] No deprecated features

#### Release Process

1. **Update Version**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Generate Changelog**
   ```bash
   npm run changelog
   ```

3. **Create Release**
   ```bash
   git push origin main --tags
   ```

4. **Publish Package**
   ```bash
   npm publish
   ```

### Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-01-15

### Added
- JWT authentication middleware with configurable expiration
- Rate limiting middleware with Redis support
- Comprehensive configuration validation

### Changed
- Improved error handling in all middleware
- Updated TypeScript to 5.0
- Enhanced performance monitoring

### Fixed
- Memory leak in rate limiting middleware
- CORS preflight handling for complex requests
- Configuration loading in production environments

### Security
- Added input sanitization to prevent XSS
- Improved secret management practices
- Enhanced security headers configuration

## [1.1.0] - 2024-01-01

### Added
- Initial middleware package structure
- Basic authentication and security middleware
- Configuration management system

### Changed
- Migrated from monolithic to modular architecture
- Updated all middleware to be framework-agnostic

## [1.0.0] - 2023-12-15

### Added
- Initial release
- Core middleware functionality
- Basic documentation
```

## Community Guidelines

### Code of Conduct

#### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

#### Our Standards

**Positive Behavior**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable Behavior**

- Harassment, sexualized language, or unwelcome sexual attention
- Trolling, insulting/derogatory comments, or personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Any other conduct which could reasonably be considered inappropriate

#### Reporting Issues

If you experience or witness unacceptable behavior, please:

1. **Contact Maintainers**
   - Email: maintainers@mindblock.app
   - GitHub: @mindblock/maintainers

2. **Report Privately**
   - All reports will be kept confidential
   - We will investigate and respond appropriately

### Getting Help

#### Support Channels

1. **GitHub Issues**
   - Bug reports and feature requests
   - Technical questions
   - Documentation issues

2. **Discussions**
   - General questions
   - Architecture discussions
   - Best practices

3. **Community Chat**
   - Real-time help
   - Quick questions
   - Community discussions

#### Asking Good Questions

1. **Search First**
   - Check existing issues and documentation
   - Search the internet for similar problems
   - Look at examples and tutorials

2. **Provide Context**
   - Describe what you're trying to accomplish
   - Include relevant code snippets
   - Share error messages and stack traces

3. **Be Specific**
   - Include version information
   - Describe your environment
   - Provide minimal reproduction case

#### Question Template

```markdown
## Question

Brief description of your question.

## Context

- Package version: @mindblock/middleware@1.2.0
- Node.js version: 18.17.0
- Framework: NestJS/Express/etc.
- Environment: development/staging/production

## What I've Tried

Description of what you've already tried and the results.

## Code Example

```typescript
// Include relevant code here
```

## Error Message

```
// Include error message and stack trace here
```

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.
```

### Contributing Beyond Code

#### Ways to Contribute

1. **Documentation**
   - Improve README files
   - Add examples and tutorials
   - Fix typos and grammar

2. **Testing**
   - Write test cases
   - Report bugs
   - Test on different environments

3. **Community**
   - Answer questions in discussions
   - Help new contributors
   - Share best practices

4. **Design**
   - Suggest improvements
   - Review architecture
   - Provide user feedback

#### Recognition

Contributors are recognized in:

- README contributors section
- Release notes
- Annual community report
- Contributor Hall of Fame

### First-Time Contributors

#### Getting Started Guide

1. **Start Small**
   - Fix a typo in documentation
   - Add a missing test case
   - Improve an error message

2. **Find Issues**
   - Look for "good first issue" labels
   - Check documentation issues
   - Find simple bug fixes

3. **Ask for Help**
   - Join community discussions
   - Ask maintainers for guidance
   - Pair with experienced contributors

#### Mentorship Program

We offer mentorship for first-time contributors:

1. **Pair Programming**
   - Work with experienced contributors
   - Learn best practices
   - Get code review guidance

2. **Guided Contributions**
   - Step-by-step guidance
   - Regular check-ins
   - Technical support

3. **Learning Resources**
   - Access to internal documentation
   - Training materials
   - Best practice guides

## Additional Resources

### Learning Resources

#### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

#### Node.js
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Node.js Documentation](https://nodejs.org/docs/)

#### NestJS
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Recipes](https://github.com/nestjs/nest/tree/master/sample)

#### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)

#### Middleware Design
- [Express Middleware Guide](https://expressjs.com/en/guide/writing-middleware.html)
- [Middleware Design Patterns](https://medium.com/@mweststrate/middleware-design-patterns-5f5c8a8b6a7e)

### Tools and Resources

#### Development Tools
- **VS Code**: Recommended IDE
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Type safety

#### Collaboration Tools
- **GitHub**: Code hosting and collaboration
- **GitHub Actions**: CI/CD
- **Discord**: Community chat
- **Notion**: Documentation and planning

#### Monitoring and Debugging
- **Chrome DevTools**: Browser debugging
- **Postman**: API testing
- **Docker**: Containerization
- **New Relic**: Performance monitoring

Thank you for contributing to @mindblock/middleware! Your contributions help make this project better for everyone.
