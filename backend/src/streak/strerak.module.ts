import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './entities/streak.entity';
import { UpdateStreakProvider } from './providers/update-streak.provider';
import { StreaksService } from './providers/streaks.service';
import { StreaksController } from './streaks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Streak])],
  controllers: [StreaksController],
  providers: [UpdateStreakProvider, StreaksService],
  exports: [TypeOrmModule, UpdateStreakProvider, StreaksService],
})
export class StreakModule {}
