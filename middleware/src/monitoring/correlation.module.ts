import { Module, Global } from '@nestjs/common';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { CorrelationLoggerService } from './correlation-logger.service';

@Global()
@Module({
  providers: [
    CorrelationLoggerService,
  ],
  exports: [
    CorrelationLoggerService,
  ],
})
export class CorrelationModule {}
