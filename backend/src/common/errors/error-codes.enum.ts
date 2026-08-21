/**
 * Centralized error codes for programmatic handling on the frontend.
 * Every error returned by the API carries one of these codes so clients
 * can react without string-matching on human-readable messages.
 */
export enum AppErrorCode {
  // ── Validation ───────────────────────────────────────────────────────────────
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // ── Authentication ──────────────────────────────────────────────────────────
  UNAUTHORIZED = 'UNAUTHORIZED',

  // ── Authorization ────────────────────────────────────────────────────────────
  FORBIDDEN = 'FORBIDDEN',

  // ── Resource ─────────────────────────────────────────────────────────────────
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  RATE_LIMITED = 'RATE_LIMITED',

  // ── Session Errors ─────────────────────────────────────────────────────────────
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',

  // ── Challenge Errors ───────────────────────────────────────────────────────────
  CHALLENGE_UNAVAILABLE = 'CHALLENGE_UNAVAILABLE',
  INVALID_ANSWER = 'INVALID_ANSWER',
  DUPLICATE_SUBMISSION = 'DUPLICATE_SUBMISSION',

  // ── Reward Errors ─────────────────────────────────────────────────────────────
  REWARD_NOT_ELIGIBLE = 'REWARD_NOT_ELIGIBLE',

  // ── Blockchain Errors ─────────────────────────────────────────────────────────
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',

  // ── Internal ───────────────────────────────────────────────────────────────────
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  // ── Legacy (still supported for backward compatibility) ───────────────────────
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_BLACKLISTED = 'AUTH_TOKEN_BLACKLISTED',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}