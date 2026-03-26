import {
  BadRequestException,
  GoneException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import {
  API_VERSION_HEADER,
  API_VERSION_QUERY_PARAM,
  API_VERSION_ROUTE_PREFIX,
} from './api-version.constants';
import { ApiVersionService } from './api-version.service';
import { ApiVersionContext } from './api-version.types';

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  constructor(private readonly apiVersionService: ApiVersionService) {}

  use(request: Request, _: Response, next: NextFunction): void {
    const resource = this.extractVersionedResource(request.path);

    if (!resource) {
      next();
      return;
    }

    const pathVersion = this.extractVersionFromPath(request.path);
    const headerVersion = this.apiVersionService.normalizeVersion(
      request.headers[API_VERSION_HEADER],
    );
    const queryVersion = this.apiVersionService.normalizeVersion(
      request.query[API_VERSION_QUERY_PARAM] as string | string[] | undefined,
    );

    const explicitVersions = new Map<string, string>();

    if (pathVersion) {
      explicitVersions.set('url', pathVersion);
    }
    if (headerVersion) {
      explicitVersions.set('header', headerVersion);
    }
    if (queryVersion) {
      explicitVersions.set('query', queryVersion);
    }

    const distinctVersions = [...new Set(explicitVersions.values())];
    if (distinctVersions.length > 1) {
      throw new BadRequestException(
        'Conflicting API versions provided across URL, header, or query parameter.',
      );
    }

    const resolvedVersion =
      distinctVersions[0] ?? this.apiVersionService.getLatestVersion();
    const versionSource = pathVersion
      ? 'url'
      : headerVersion
        ? 'header'
        : queryVersion
          ? 'query'
          : 'default';

    const definition =
      this.apiVersionService.getVersionDefinition(resolvedVersion);

    if (!definition) {
      throw new BadRequestException(
        `Unsupported API version "${resolvedVersion}". Supported versions: ${this.getAvailableVersions()}.`,
      );
    }

    if (!this.apiVersionService.isCompatibleWithResource(resolvedVersion, resource)) {
      throw new BadRequestException(
        `API version "${resolvedVersion}" does not support the "${resource}" resource.`,
      );
    }

    if (this.apiVersionService.isRemoved(definition)) {
      throw new GoneException({
        message: `API version ${resolvedVersion} is no longer available.`,
        upgradeTo: definition.successorVersion
          ? `v${definition.successorVersion}`
          : undefined,
        migrationGuide: definition.successorVersion
          ? `/api/docs/migrations/v${resolvedVersion}-to-v${definition.successorVersion}`
          : undefined,
      });
    }

    const context: ApiVersionContext = {
      requestedVersion: distinctVersions[0],
      resolvedVersion,
      latestVersion: this.apiVersionService.getLatestVersion(),
      source: versionSource,
      definition,
      resource,
    };

    request.apiVersionContext = context;

    if (!pathVersion) {
      request.url = this.injectVersionIntoUrl(
        request.url,
        resource,
        resolvedVersion,
      );
    }

    next();
  }

  private extractVersionedResource(path: string): string | undefined {
    const sanitizedPath = path.replace(/^\/api\/?/, '').replace(/^\/+/, '');
    const segments = sanitizedPath.split('/').filter(Boolean);
    const [firstSegment, secondSegment] = segments;

    if (
      firstSegment &&
      /^v\d+$/i.test(firstSegment) &&
      this.apiVersionService.isVersionedResource(secondSegment)
    ) {
      return secondSegment;
    }

    if (this.apiVersionService.isVersionedResource(firstSegment)) {
      return firstSegment;
    }

    return undefined;
  }

  private extractVersionFromPath(path: string): string | undefined {
    const match = path.match(
      new RegExp(`^/api/${API_VERSION_ROUTE_PREFIX}(\\d+)(?:/|$)`, 'i'),
    );

    return match?.[1];
  }

  private injectVersionIntoUrl(
    url: string,
    resource: string,
    resolvedVersion: string,
  ): string {
    const resourcePattern = new RegExp(`^/api/${resource}(?=/|\\?|$)`, 'i');

    return url.replace(
      resourcePattern,
      `/api/${API_VERSION_ROUTE_PREFIX}${resolvedVersion}/${resource}`,
    );
  }

  private getAvailableVersions(): string {
    return ['v1', 'v2'].join(', ');
  }
}
