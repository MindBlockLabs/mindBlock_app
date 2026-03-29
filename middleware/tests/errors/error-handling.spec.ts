import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ErrorCode,
  ErrorCodeHttpStatus,
  ErrorCodeMessages,
  BaseException,
  ValidationException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  RateLimitException,
  InternalServerException,
  UniqueConstraintException,
  ForeignKeyConstraintException,
  DatabaseConnectionException,
  mapError,
  getCorrelationId,
  generateCorrelationId,
  GlobalExceptionFilter,
  createGlobalExceptionFilter,
  ErrorLoggerService,
} from '../src/errors';

// Mock Request and Response
const createMockRequest = (overrides: Partial<any> = {}) => ({
  url: '/api/test',
  method: 'GET',
  headers: {
    'content-type': 'application/json',
    'user-agent': 'test-agent',
  },
  ip: '127.0.0.1',
  body: {},
  query: {},
  params: {},
  socket: { remoteAddress: '127.0.0.1' },
  ...overrides,
});

const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

const createMockArgumentsHost = (request: any, response: any) => ({
  switchToHttp: () => ({
    getRequest: () => request,
    getResponse: () => response,
  }),
});

describe('Error Handling Module', () => {
  describe('ErrorCode Constants', () => {
    it('should have HTTP status codes for all error codes', () => {
      const errorCodes = Object.values(ErrorCode);
      errorCodes.forEach((code) => {
        expect(ErrorCodeHttpStatus[code]).toBeDefined();
        expect(typeof ErrorCodeHttpStatus[code]).toBe('number');
      });
    });

    it('should have messages for all error codes', () => {
      const errorCodes = Object.values(ErrorCode);
      errorCodes.forEach((code) => {
        expect(ErrorCodeMessages[code]).toBeDefined();
        expect(typeof ErrorCodeMessages[code]).toBe('string');
      });
    });

    it('should map authentication errors to 401', () => {
      expect(ErrorCodeHttpStatus[ErrorCode.AUTH_TOKEN_EXPIRED]).toBe(401);
      expect(ErrorCodeHttpStatus[ErrorCode.AUTH_TOKEN_INVALID]).toBe(401);
      expect(ErrorCodeHttpStatus[ErrorCode.AUTH_INVALID_CREDENTIALS]).toBe(401);
    });

    it('should map authorization errors to 403', () => {
      expect(ErrorCodeHttpStatus[ErrorCode.INSUFFICIENT_PERMISSIONS]).toBe(403);
      expect(ErrorCodeHttpStatus[ErrorCode.ROLE_NOT_ALLOWED]).toBe(403);
    });

    it('should map validation errors to 400', () => {
      expect(ErrorCodeHttpStatus[ErrorCode.VALIDATION_FAILED]).toBe(400);
      expect(ErrorCodeHttpStatus[ErrorCode.INVALID_INPUT]).toBe(400);
    });

    it('should map not found errors to 404', () => {
      expect(ErrorCodeHttpStatus[ErrorCode.RESOURCE_NOT_FOUND]).toBe(404);
    });

    it('should map conflict errors to 409', () => {
      expect(ErrorCodeHttpStatus[ErrorCode.DUPLICATE_RESOURCE]).toBe(409);
      expect(ErrorCodeHttpStatus[ErrorCode.DB_UNIQUE_VIOLATION]).toBe(409);
    });
  });

  describe('BaseException', () => {
    it('should create exception with correct properties', () => {
      const exception = new BaseException(
        ErrorCode.VALIDATION_FAILED,
        'Custom message',
        [{ field: 'email', message: 'Invalid email' }],
      );

      expect(exception.getStatus()).toBe(400);
      expect(exception.errorCode).toBe(ErrorCode.VALIDATION_FAILED);
      expect(exception.message).toBe('Custom message');
      expect(exception.details).toHaveLength(1);
    });

    it('should use default message if not provided', () => {
      const exception = new BaseException(ErrorCode.RESOURCE_NOT_FOUND);
      expect(exception.message).toBe(ErrorCodeMessages[ErrorCode.RESOURCE_NOT_FOUND]);
    });
  });

  describe('HTTP Exceptions', () => {
    describe('ValidationException', () => {
      it('should create with field-specific errors', () => {
        const details = [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ];
        const exception = new ValidationException(details);

        expect(exception.getStatus()).toBe(400);
        expect(exception.errorCode).toBe(ErrorCode.VALIDATION_FAILED);
        expect(exception.details).toEqual(details);
      });

      it('should create from field errors object', () => {
        const exception = ValidationException.fromFieldErrors({
          email: ['Invalid format', 'Already exists'],
          name: ['Required'],
        });

        expect(exception.details).toHaveLength(2);
        expect(exception.details?.[0].field).toBe('email');
      });
    });

    describe('UnauthorizedException', () => {
      it('should create token expired exception', () => {
        const exception = UnauthorizedException.tokenExpired();
        expect(exception.getStatus()).toBe(401);
        expect(exception.errorCode).toBe(ErrorCode.AUTH_TOKEN_EXPIRED);
      });

      it('should create invalid credentials exception', () => {
        const exception = UnauthorizedException.invalidCredentials();
        expect(exception.errorCode).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS);
      });
    });

    describe('ForbiddenException', () => {
      it('should create insufficient permissions exception', () => {
        const exception = ForbiddenException.insufficientPermissions();
        expect(exception.getStatus()).toBe(403);
        expect(exception.errorCode).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
      });

      it('should create role not allowed with custom message', () => {
        const exception = ForbiddenException.roleNotAllowed('user');
        expect(exception.message).toContain('user');
      });
    });

    describe('NotFoundException', () => {
      it('should create with resource name', () => {
        const exception = new NotFoundException('User', '123');
        expect(exception.getStatus()).toBe(404);
        expect(exception.message).toContain('User');
        expect(exception.message).toContain('123');
      });
    });

    describe('ConflictException', () => {
      it('should create duplicate resource exception', () => {
        const exception = ConflictException.duplicate('User', 'email');
        expect(exception.getStatus()).toBe(409);
        expect(exception.message).toContain('email');
      });
    });

    describe('RateLimitException', () => {
      it('should include retry after', () => {
        const exception = new RateLimitException(60);
        expect(exception.getStatus()).toBe(429);
        expect(exception.retryAfter).toBe(60);
        expect(exception.message).toContain('60');
      });
    });
  });

  describe('Database Exceptions', () => {
    it('should create unique constraint exception', () => {
      const exception = new UniqueConstraintException('users_email_key', 'email');
      expect(exception.getStatus()).toBe(409);
      expect(exception.errorCode).toBe(ErrorCode.DB_UNIQUE_VIOLATION);
      expect(exception.columnName).toBe('email');
    });

    it('should create foreign key constraint exception', () => {
      const exception = new ForeignKeyConstraintException('fk_user', 'users');
      expect(exception.getStatus()).toBe(409);
      expect(exception.referencedTable).toBe('users');
    });

    it('should create connection exception', () => {
      const exception = new DatabaseConnectionException();
      expect(exception.getStatus()).toBe(503);
    });
  });

  describe('Correlation ID', () => {
    it('should generate valid UUID', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should extract correlation ID from headers', () => {
      const request = createMockRequest({
        headers: { 'x-correlation-id': 'test-id-123' },
      });
      const id = getCorrelationId(request as any);
      expect(id).toBe('test-id-123');
    });

    it('should generate new ID if not in headers', () => {
      const request = createMockRequest();
      const id = getCorrelationId(request as any);
      expect(id).toBeDefined();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('Error Mapper', () => {
    it('should map BaseException correctly', () => {
      const exception = new NotFoundException('User', '123');
      const mapped = mapError(exception, false);

      expect(mapped.statusCode).toBe(404);
      expect(mapped.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(mapped.stack).toBeDefined();
    });

    it('should map HttpException correctly', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const mapped = mapError(exception, false);

      expect(mapped.statusCode).toBe(404);
      expect(mapped.message).toBe('Not found');
    });

    it('should hide stack in production', () => {
      const exception = new InternalServerException('Oops');
      const mapped = mapError(exception, true);

      expect(mapped.stack).toBeUndefined();
    });

    it('should map PostgreSQL unique violation', () => {
      const pgError = {
        code: '23505',
        detail: 'Key (email)=(test@test.com) already exists.',
      };
      const mapped = mapError(pgError, false);

      expect(mapped.statusCode).toBe(409);
      expect(mapped.errorCode).toBe(ErrorCode.DB_UNIQUE_VIOLATION);
      expect(mapped.message).toContain('email');
    });

    it('should map PostgreSQL foreign key violation', () => {
      const pgError = {
        code: '23503',
        detail: 'Key (user_id)=(123) is not present in table "users".',
      };
      const mapped = mapError(pgError, false);

      expect(mapped.statusCode).toBe(409);
      expect(mapped.errorCode).toBe(ErrorCode.DB_FOREIGN_KEY_VIOLATION);
    });

    it('should map connection errors', () => {
      const error = { name: 'ConnectionError', message: 'ECONNREFUSED' };
      const mapped = mapError(error, false);

      expect(mapped.statusCode).toBe(503);
      expect(mapped.errorCode).toBe(ErrorCode.DB_CONNECTION_ERROR);
    });

    it('should return generic message for unknown errors in production', () => {
      const error = new Error('Some internal detail');
      const mapped = mapError(error, true);

      expect(mapped.message).toBe(ErrorCodeMessages[ErrorCode.INTERNAL_SERVER_ERROR]);
    });
  });

  describe('ErrorLoggerService', () => {
    let logger: ErrorLoggerService;

    beforeEach(() => {
      logger = new ErrorLoggerService();
    });

    it('should create log entry with correct level for client errors', () => {
      const context = {
        correlationId: 'test-123',
        path: '/api/test',
        method: 'POST',
      };
      const entry = logger.createLogEntry(
        new Error('Bad request'),
        context,
        400,
        ErrorCode.VALIDATION_FAILED,
        'Validation failed',
      );

      expect(entry.level).toBe('warn');
    });

    it('should create log entry with error level for server errors', () => {
      const context = {
        correlationId: 'test-123',
        path: '/api/test',
        method: 'POST',
      };
      const entry = logger.createLogEntry(
        new Error('Server error'),
        context,
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Internal error',
      );

      expect(entry.level).toBe('error');
    });
  });

  describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;

    beforeEach(() => {
      filter = createGlobalExceptionFilter({ environment: 'test' });
    });

    it('should format BaseException correctly', () => {
      const request = createMockRequest();
      const response = createMockResponse();
      const host = createMockArgumentsHost(request, response);

      const exception = new NotFoundException('User', '123');
      filter.catch(exception, host as any);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          errorCode: ErrorCode.RESOURCE_NOT_FOUND,
          correlationId: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/test',
        }),
      );
    });

    it('should include correlation ID in response header', () => {
      const request = createMockRequest({
        headers: { 'x-correlation-id': 'custom-id' },
      });
      const response = createMockResponse();
      const host = createMockArgumentsHost(request, response);

      filter.catch(new Error('test'), host as any);

      expect(response.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        'custom-id',
      );
    });

    it('should include validation details', () => {
      const request = createMockRequest();
      const response = createMockResponse();
      const host = createMockArgumentsHost(request, response);

      const exception = new ValidationException([
        { field: 'email', message: 'Invalid' },
      ]);
      filter.catch(exception, host as any);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: [{ field: 'email', message: 'Invalid' }],
        }),
      );
    });

    it('should hide stack trace in production', () => {
      const prodFilter = createGlobalExceptionFilter({ environment: 'production' });
      const request = createMockRequest();
      const response = createMockResponse();
      const host = createMockArgumentsHost(request, response);

      prodFilter.catch(new Error('test'), host as any);

      const jsonCall = response.json.mock.calls[0][0];
      expect(jsonCall.stack).toBeUndefined();
    });

    it('should include stack trace in development', () => {
      const devFilter = createGlobalExceptionFilter({ environment: 'development' });
      const request = createMockRequest();
      const response = createMockResponse();
      const host = createMockArgumentsHost(request, response);

      devFilter.catch(new Error('test'), host as any);

      const jsonCall = response.json.mock.calls[0][0];
      expect(jsonCall.stack).toBeDefined();
    });
  });
});
