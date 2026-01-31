import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './entities/streak.entity';
import { UpdateStreakProvider } from './providers/update-streak.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Streak])],
  providers: [UpdateStreakProvider],
  exports: [TypeOrmModule, UpdateStreakProvider],
})
export class StreakModule {}
