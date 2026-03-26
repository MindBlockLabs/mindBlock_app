import { Injectable } from '@nestjs/common';
import {
  API_VERSION_DEFINITIONS,
  VERSIONED_RESOURCES,
} from './api-version.constants';
import {
  ApiVersionDefinition,
  ApiVersionSource,
} from './api-version.types';

@Injectable()
export class ApiVersionService {
  private readonly versions = API_VERSION_DEFINITIONS;
  private readonly versionedResources = [...VERSIONED_RESOURCES];

  getLatestVersion(): string {
    const latestActiveVersion = [...this.versions]
      .filter((definition) => definition.status === 'active')
      .sort((left, right) => Number(right.version) - Number(left.version))[0];

    if (!latestActiveVersion) {
      throw new Error('No active API version is configured.');
    }

    return latestActiveVersion.version;
  }

  getSupportedResources(): string[] {
    return this.versionedResources;
  }

  isVersionedResource(resource?: string): resource is string {
    return !!resource && this.versionedResources.includes(resource);
  }

  getVersionDefinition(version: string): ApiVersionDefinition | undefined {
    return this.versions.find((definition) => definition.version === version);
  }

  isKnownVersion(version: string): boolean {
    return !!this.getVersionDefinition(version);
  }

  isRemoved(definition: ApiVersionDefinition): boolean {
    if (definition.status === 'removed') {
      return true;
    }

    if (definition.sunsetDate && new Date(definition.sunsetDate) <= new Date()) {
      return true;
    }

    return !!definition.removedAt && new Date(definition.removedAt) <= new Date();
  }

  isDeprecated(definition: ApiVersionDefinition): boolean {
    return definition.deprecated || definition.status === 'deprecated';
  }

  isCompatibleWithResource(version: string, resource: string): boolean {
    const definition = this.getVersionDefinition(version);

    return !!definition && definition.supportedResources.includes(resource);
  }

  normalizeVersion(rawVersion?: string | string[]): string | undefined {
    if (!rawVersion) {
      return undefined;
    }

    const value = Array.isArray(rawVersion) ? rawVersion[0] : rawVersion;
    const normalized = value.trim().toLowerCase().replace(/^v/, '');

    return normalized || undefined;
  }

  buildDeprecationNotice(
    definition: ApiVersionDefinition,
    source: ApiVersionSource,
  ): string | undefined {
    if (!this.isDeprecated(definition)) {
      return undefined;
    }

    const sunsetNotice = definition.sunsetDate
      ? ` Sunset on ${definition.sunsetDate}.`
      : '';
    const upgradeNotice = definition.successorVersion
      ? ` Upgrade to v${definition.successorVersion}.`
      : '';

    return `API version ${definition.version} was selected via ${source}.${sunsetNotice}${upgradeNotice} ${definition.deprecationMessage ?? ''}`.trim();
  }
}
