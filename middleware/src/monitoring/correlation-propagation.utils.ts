import { CorrelationIdStorage } from './correlation-id.storage';

/**
 * Utility to get headers for downstream calls to propagate correlation ID.
 */
export const getCorrelationHeaders = (headers: Record<string, string> = {}) => {
  const correlationId = CorrelationIdStorage.getCorrelationId();
  if (correlationId) {
    return {
      ...headers,
      'X-Correlation-ID': correlationId,
    };
  }
  return headers;
};

/**
 * Wraps a function to execute within the current correlation context.
 * Useful for async workers, emitters, and timers.
 */
export const withCorrelation = <T extends (...args: any[]) => any>(fn: T): T => {
  const correlationId = CorrelationIdStorage.getCorrelationId();
  const userId = CorrelationIdStorage.getUserId();
  if (!correlationId) {
    return fn;
  }
  return ((...args: any[]) => {
    return CorrelationIdStorage.run(correlationId, userId, () => fn(...args));
  }) as T;
};
