import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsExportService } from './providers/analytics-export.service';
import { AnalyticsBreakdownService } from './providers/analytics-breakdown.service';
import { AnalyticsListener } from './dto/analytics.listener';
import { TimeFilterModule } from '../timefilter/timefilter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEvent]),
    TimeFilterModule,
  ],
  providers: [
    AnalyticsService, 
    AnalyticsExportService, 
    AnalyticsBreakdownService, 
    AnalyticsListener
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsExportService, AnalyticsBreakdownService],
})
export class AnalyticsModule {}