import { ErrorCode } from '../constants/error-codes';
import { BaseException } from './base.exception';

/**
 * Database connection error
 */
export class DatabaseConnectionException extends BaseException {
  constructor(message?: string) {
    super(
      ErrorCode.DB_CONNECTION_ERROR,
      message ?? 'Database connection failed',
    );
  }
}

/**
 * Database query error
 */
export class DatabaseQueryException extends BaseException {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(
      ErrorCode.DB_QUERY_ERROR,
      message ?? 'Database query failed',
      undefined,
      context,
    );
  }
}

/**
 * Database unique constraint violation
 */
export class UniqueConstraintException extends BaseException {
  public readonly constraintName?: string;
  public readonly columnName?: string;

  constructor(constraintName?: string, columnName?: string) {
    const message = columnName
      ? `A record with this ${columnName} already exists`
      : 'Duplicate entry violates unique constraint';
    super(ErrorCode.DB_UNIQUE_VIOLATION, message);
    this.constraintName = constraintName;
    this.columnName = columnName;
  }
}

/**
 * Database foreign key constraint violation
 */
export class ForeignKeyConstraintException extends BaseException {
  public readonly constraintName?: string;
  public readonly referencedTable?: string;

  constructor(constraintName?: string, referencedTable?: string) {
    const message = referencedTable
      ? `Referenced ${referencedTable} does not exist`
      : 'Foreign key constraint violation';
    super(ErrorCode.DB_FOREIGN_KEY_VIOLATION, message);
    this.constraintName = constraintName;
    this.referencedTable = referencedTable;
  }
}

/**
 * Database timeout error
 */
export class DatabaseTimeoutException extends BaseException {
  constructor(message?: string) {
    super(ErrorCode.DB_TIMEOUT, message ?? 'Database operation timed out');
  }
}

/**
 * General database constraint violation
 */
export class ConstraintViolationException extends BaseException {
  public readonly constraintName?: string;

  constructor(constraintName?: string, message?: string) {
    super(
      ErrorCode.DB_CONSTRAINT_VIOLATION,
      message ?? 'Database constraint violation',
    );
    this.constraintName = constraintName;
  }
}
