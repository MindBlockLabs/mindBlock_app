import { SetMetadata } from '@nestjs/common';

export const CUSTOM_SIZE_LIMIT_KEY = 'custom_size_limit';

/**
 * Decorator to set a custom request body size limit for a specific route
 * @param sizeInBytes Maximum size in bytes (can use helper like 50 * 1024 * 1024 for 50MB)
 */
export function CustomSizeLimit(sizeInBytes: number) {
  return SetMetadata(CUSTOM_SIZE_LIMIT_KEY, sizeInBytes);
}

/**
 * Decorator to set size limit using predefined sizes
 */
export function SizeLimitConfig(config: {
  type?:
    | 'json'
    | 'form'
    | 'text'
    | 'imageUpload'
    | 'documentUpload'
    | 'profilePictureUpload'
    | 'puzzleCreation'
    | 'bulkOperations'
    | 'webhookPayloads';
  bytes?: number;
}) {
  if (config.bytes !== undefined) {
    return SetMetadata(CUSTOM_SIZE_LIMIT_KEY, config.bytes);
  }

  const sizeMap = {
    json: 1024 * 1024,
    form: 10 * 1024 * 1024,
    text: 100 * 1024,
    imageUpload: 50 * 1024 * 1024,
    documentUpload: 100 * 1024 * 1024,
    profilePictureUpload: 5 * 1024 * 1024,
    puzzleCreation: 10 * 1024 * 1024,
    bulkOperations: 20 * 1024 * 1024,
    webhookPayloads: 5 * 1024 * 1024,
  };

  const size = config.type ? sizeMap[config.type] : sizeMap.json;
  return SetMetadata(CUSTOM_SIZE_LIMIT_KEY, size);
}