/**
 * Centralized error codes for programmatic handling on the frontend.
 * Every error returned by the API carries one of these codes so clients
 * can react without string-matching on human-readable messages.
 */
export enum AppErrorCode {
  // ── Authentication ──────────────────────────────────────────────────────────
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_BLACKLISTED = 'AUTH_TOKEN_BLACKLISTED',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',

  // ── Authorization ────────────────────────────────────────────────────────────
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // ── Validation ───────────────────────────────────────────────────────────────
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',

  // ── Resource ─────────────────────────────────────────────────────────────────
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // ── Database ──────────────────────────────────────────────────────────────────
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',

  // ── Generic ───────────────────────────────────────────────────────────────────
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}
