import { Module } from '@nestjs/common';
import { PaginationProvider } from './pagination/provider/pagination-provider';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  providers: [PaginationProvider, CorrelationIdMiddleware],
  exports: [PaginationProvider, CorrelationIdMiddleware],
})
export class CommonModule {}

// Re-export public API so other modules can import from '@/common'
export * from './errors';
export * from './filters/http-exception.filter';
export * from './middleware/correlation-id.middleware';

