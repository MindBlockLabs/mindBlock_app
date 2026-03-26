import { Injectable, Logger } from '@nestjs/common';

export const DEFAULT_SIZE_LIMITS = {
  // Standard API requests (JSON)
  json: 1024 * 1024, // 1MB

  // Text content
  text: 100 * 1024, // 100KB

  // Form data
  form: 10 * 1024 * 1024, // 10MB

  // File uploads
  imageUpload: 50 * 1024 * 1024, // 50MB
  documentUpload: 100 * 1024 * 1024, // 100MB
  profilePictureUpload: 5 * 1024 * 1024, // 5MB

  // Puzzle creation (with images)
  puzzleCreation: 10 * 1024 * 1024, // 10MB

  // Bulk operations
  bulkOperations: 20 * 1024 * 1024, // 20MB

  // Webhook payloads
  webhookPayloads: 5 * 1024 * 1024, // 5MB
};

export const CONTENT_TYPE_LIMITS = {
  'application/json': DEFAULT_SIZE_LIMITS.json,
  'application/x-www-form-urlencoded': DEFAULT_SIZE_LIMITS.form,
  'multipart/form-data': DEFAULT_SIZE_LIMITS.form,
  'text/plain': DEFAULT_SIZE_LIMITS.text,
  'text/html': DEFAULT_SIZE_LIMITS.text,
  'image/jpeg': DEFAULT_SIZE_LIMITS.imageUpload,
  'image/png': DEFAULT_SIZE_LIMITS.imageUpload,
  'image/gif': DEFAULT_SIZE_LIMITS.imageUpload,
  'image/webp': DEFAULT_SIZE_LIMITS.imageUpload,
  'application/pdf': DEFAULT_SIZE_LIMITS.documentUpload,
  'application/msword': DEFAULT_SIZE_LIMITS.documentUpload,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    DEFAULT_SIZE_LIMITS.documentUpload,
  'application/vnd.ms-excel': DEFAULT_SIZE_LIMITS.documentUpload,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    DEFAULT_SIZE_LIMITS.documentUpload,
};

export interface RequestSizeLimitConfig {
  enabled: boolean;
  logOversizedRequests: boolean;
  enforceOnError: boolean;
}

@Injectable()
export class RequestSizeLimitConfig {
  enabled = process.env.REQUEST_SIZE_LIMIT_ENABLED !== 'false';
  logOversizedRequests = process.env.LOG_OVERSIZED_REQUESTS !== 'false';
  enforceOnError = process.env.ENFORCE_ON_SIZE_LIMIT_ERROR === 'true';
}