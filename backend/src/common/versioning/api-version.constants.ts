import { ApiVersionDefinition } from './api-version.types';

export const API_VERSION_HEADER = 'x-api-version';
export const API_VERSION_QUERY_PARAM = 'api_version';
export const API_VERSION_ROUTE_PREFIX = 'v';

export const VERSIONED_RESOURCES = ['puzzles'] as const;

export const API_VERSION_DEFINITIONS: ApiVersionDefinition[] = [
  {
    version: '0',
    status: 'removed',
    releaseDate: '2025-01-15T00:00:00.000Z',
    deprecated: true,
    deprecationMessage:
      'Version 0 has been removed. Upgrade to v1 or v2 immediately.',
    removedAt: '2025-12-31T23:59:59.000Z',
    successorVersion: '1',
    supportedResources: ['puzzles'],
  },
  {
    version: '1',
    status: 'deprecated',
    releaseDate: '2025-06-01T00:00:00.000Z',
    deprecated: true,
    deprecationMessage:
      'Version 1 remains available during the migration window. Plan your upgrade to v2.',
    sunsetDate: '2026-06-24T00:00:00.000Z',
    successorVersion: '2',
    supportedResources: ['puzzles'],
  },
  {
    version: '2',
    status: 'active',
    releaseDate: '2026-03-26T00:00:00.000Z',
    deprecated: false,
    supportedResources: ['puzzles'],
  },
];
