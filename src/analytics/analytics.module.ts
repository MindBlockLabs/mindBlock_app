import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsExportService } from './providers/analytics-export.service';
import { AnalyticsListener } from './dto/analytics.listener';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  providers: [AnalyticsService, AnalyticsExportService, AnalyticsListener],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsExportService],
})
export class AnalyticsModule {}