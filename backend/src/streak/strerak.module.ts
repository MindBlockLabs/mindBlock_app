import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './entities/streak.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Streak])],
  exports: [TypeOrmModule],
})
export class StreakModule {}
