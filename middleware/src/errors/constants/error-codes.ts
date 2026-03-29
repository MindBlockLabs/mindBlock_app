/**
 * Standardized error codes for programmatic handling
 */
export enum ErrorCode {
  // Authentication errors (AUTH_*)
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',

  // Authorization errors (AUTHZ_*)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_NOT_ALLOWED = 'ROLE_NOT_ALLOWED',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Validation errors (VALIDATION_*)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource errors (RESOURCE_*)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Database errors (DB_*)
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  DB_UNIQUE_VIOLATION = 'DB_UNIQUE_VIOLATION',
  DB_FOREIGN_KEY_VIOLATION = 'DB_FOREIGN_KEY_VIOLATION',
  DB_TIMEOUT = 'DB_TIMEOUT',

  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * HTTP status code mapping for error codes
 */
export const ErrorCodeHttpStatus: Record<ErrorCode, number> = {
  // 401 Unauthorized
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_TOKEN_INVALID]: 401,
  [ErrorCode.AUTH_TOKEN_MISSING]: 401,
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_SESSION_EXPIRED]: 401,

  // 403 Forbidden
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.ROLE_NOT_ALLOWED]: 403,
  [ErrorCode.ACCESS_DENIED]: 403,

  // 400 Bad Request
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  // 404 Not Found
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCode.DUPLICATE_RESOURCE]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,

  // 429 Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  // 500+ Server Errors
  [ErrorCode.DB_CONNECTION_ERROR]: 503,
  [ErrorCode.DB_QUERY_ERROR]: 500,
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: 409,
  [ErrorCode.DB_UNIQUE_VIOLATION]: 409,
  [ErrorCode.DB_FOREIGN_KEY_VIOLATION]: 409,
  [ErrorCode.DB_TIMEOUT]: 504,

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 503,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.UNKNOWN_ERROR]: 500,
};

/**
 * Default user-friendly messages for error codes
 */
export const ErrorCodeMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token.',
  [ErrorCode.AUTH_TOKEN_MISSING]: 'Authentication required.',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired.',

  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  [ErrorCode.ROLE_NOT_ALLOWED]: 'Your role does not allow this action.',
  [ErrorCode.ACCESS_DENIED]: 'Access denied.',

  [ErrorCode.VALIDATION_FAILED]: 'Validation failed. Please check your input.',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format.',

  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.DUPLICATE_RESOURCE]: 'A resource with the same identifier already exists.',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict detected.',
  [ErrorCode.RESOURCE_LOCKED]: 'Resource is currently locked.',

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',

  [ErrorCode.DB_CONNECTION_ERROR]: 'Service temporarily unavailable. Please try again.',
  [ErrorCode.DB_QUERY_ERROR]: 'An error occurred while processing your request.',
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: 'Operation violates data constraints.',
  [ErrorCode.DB_UNIQUE_VIOLATION]: 'A record with this value already exists.',
  [ErrorCode.DB_FOREIGN_KEY_VIOLATION]: 'Referenced record does not exist.',
  [ErrorCode.DB_TIMEOUT]: 'Request timed out. Please try again.',

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again.',
  [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: 'External service timed out.',
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service is unavailable.',

  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred.',
};
