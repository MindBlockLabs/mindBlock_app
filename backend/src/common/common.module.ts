import { Module } from '@nestjs/common';
import { PaginationProvider } from './pagination/provider/pagination-provider';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { GeolocationMiddleware } from './middleware/geolocation.middleware';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [PaginationProvider, CorrelationIdMiddleware, GeolocationMiddleware],
  exports: [PaginationProvider, CorrelationIdMiddleware, GeolocationMiddleware],
})
export class CommonModule {}

// Re-export public API so other modules can import from '@/common'
export * from './errors';
export * from './filters/http-exception.filter';
export * from './middleware/correlation-id.middleware';
export * from './middleware/geolocation.middleware';
export * from './interfaces/geolocation.interface';
export * from './decorators/geolocation.decorator';

