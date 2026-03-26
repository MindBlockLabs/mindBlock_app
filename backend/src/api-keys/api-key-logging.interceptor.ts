import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithApiKey } from './api-key.middleware';

@Injectable()
export class ApiKeyLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiKeyLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();
    const response = context.switchToHttp().getResponse();

    if (request.apiKey) {
      const startTime = Date.now();

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `API Key Usage: ${request.apiKey.id} - ${request.method} ${request.url} - ${response.statusCode} - ${duration}ms`,
          );
        }),
      );
    }

    return next.handle();
  }
}