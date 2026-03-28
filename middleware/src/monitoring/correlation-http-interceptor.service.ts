import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CorrelationIdStorage } from '../monitoring/correlation-id.storage';

@Injectable()
export class CorrelationHttpInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const correlationId = CorrelationIdStorage.getCorrelationId();
    if (correlationId) {
      // If we are dealing with standard req/res, 
      // the middleware already handled it. 
    }
    return next.handle();
  }
}
