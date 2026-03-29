import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Extract correlation ID from request headers or generate a new one
 */
export function getCorrelationId(request: Request): string {
  const existing = request.headers[CORRELATION_ID_HEADER];
  if (typeof existing === 'string' && existing.length > 0) {
    return existing;
  }
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0];
  }
  return generateCorrelationId();
}

/**
 * Get the correlation ID header name
 */
export function getCorrelationIdHeader(): string {
  return CORRELATION_ID_HEADER;
}
