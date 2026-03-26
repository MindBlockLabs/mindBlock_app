export type ApiVersionStatus = 'active' | 'deprecated' | 'removed';

export type ApiVersionSource = 'url' | 'header' | 'query' | 'default';

export interface ApiVersionDefinition {
  version: string;
  status: ApiVersionStatus;
  releaseDate: string;
  deprecated: boolean;
  deprecationMessage?: string;
  sunsetDate?: string;
  removedAt?: string;
  successorVersion?: string;
  supportedResources: string[];
}

export interface ApiVersionContext {
  requestedVersion?: string;
  resolvedVersion: string;
  latestVersion: string;
  source: ApiVersionSource;
  definition: ApiVersionDefinition;
  resource: string;
}
