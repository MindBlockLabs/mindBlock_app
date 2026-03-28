// frontend/lib/api/error-handler.ts
import { ApiError } from './types';

export function handleApiError(error: any): ApiError {
  const response = error.response || {};
  return {
    message: response.data?.message || 'Unexpected error occurred',
    code: response.data?.code || 'UNKNOWN_ERROR',
    status: response.status || 500,
  };
}
