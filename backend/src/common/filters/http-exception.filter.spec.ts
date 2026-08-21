import { AllExceptionsFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { AppException, ValidationError } from '../errors/app.exception';
import { AppErrorCode } from '../errors/error-codes.enum';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockHost: Partial<ArgumentsHost>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      status: statusSpy,
    } as unknown as Partial<Response>;
    mockRequest = {
      url: '/api/test',
      method: 'GET',
    } as Partial<Request>;
    // Add correlationId as a custom property
    (mockRequest as any).correlationId = 'test-correlation-id';
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
    process.env.NODE_ENV = 'development';
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should format AppException correctly', () => {
    const exception = new ValidationError(
      [{ field: 'email', message: 'Email is invalid' }],
      'Validation failed'
    );

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: 'Validation failed',
      code: AppErrorCode.VALIDATION_ERROR,
      path: '/api/test',
      requestId: 'test-correlation-id',
      details: [{ field: 'email', message: 'Email is invalid' }],
    }));
  });

  it('should format NestJS HttpException correctly', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: 'Not found',
      code: AppErrorCode.NOT_FOUND,
    }));
  });

  it('should format TypeORM EntityNotFoundError correctly', () => {
    const exception = new EntityNotFoundError('User', '123');

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: AppErrorCode.NOT_FOUND,
    }));
  });

  it('should format Postgres unique violation error correctly', () => {
    const exception = new QueryFailedError('SELECT * FROM users', [], { code: '23505' } as any);

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: AppErrorCode.CONFLICT,
    }));
  });

  it('should format unknown errors as internal server error', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      code: AppErrorCode.INTERNAL_SERVER_ERROR,
    }));
  });

  it('should hide stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost as ArgumentsHost);

    const response = jsonSpy.mock.calls[0][0];
    expect(response.stack).toBeUndefined();
  });

  it('should include stack trace in development', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost as ArgumentsHost);

    const response = jsonSpy.mock.calls[0][0];
    expect(response.stack).toBeDefined();
  });
});