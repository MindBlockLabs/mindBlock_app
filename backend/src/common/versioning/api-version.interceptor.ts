import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiVersionService } from './api-version.service';

@Injectable()
export class ApiVersionInterceptor implements NestInterceptor {
  constructor(private readonly apiVersionService: ApiVersionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    const versionContext = request.apiVersionContext;

    if (versionContext) {
      const { definition, resolvedVersion, latestVersion } = versionContext;

      response.setHeader('X-API-Version', resolvedVersion);
      response.setHeader('X-API-Latest-Version', latestVersion);
      response.setHeader('X-API-Version-Status', definition.status);

      if (this.apiVersionService.isDeprecated(definition)) {
        response.setHeader('X-API-Deprecation', 'true');
        response.setHeader(
          'Warning',
          `299 - "${this.apiVersionService.buildDeprecationNotice(definition, versionContext.source)}"`,
        );
      }

      if (definition.sunsetDate) {
        response.setHeader('Sunset', new Date(definition.sunsetDate).toUTCString());
      }

      if (definition.successorVersion) {
        response.setHeader(
          'Link',
          `</api/docs/migrations/v${definition.version}-to-v${definition.successorVersion}>; rel="successor-version"`,
        );
      }
    }

    return next.handle();
  }
}
