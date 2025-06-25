import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsListener } from './dto/analytics.listener';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  providers: [AnalyticsService, AnalyticsListener],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}