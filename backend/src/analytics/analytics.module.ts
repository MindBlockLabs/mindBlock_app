import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersAnalyticsListener } from './listeners/users-analytics.listener';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  providers: [UsersAnalyticsListener],
})
export class AnalyticsModule {}
