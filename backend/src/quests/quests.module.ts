import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyQuest } from './entities/daily-quest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyQuest])],
  exports: [TypeOrmModule],
})
export class QuestsModule {}
