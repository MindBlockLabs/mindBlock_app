import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './entities/streak.entity';
import { StreakService } from './streak.service';
import { StreakController } from './streak.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Streak])],
  controllers: [StreakController],
  providers: [StreakService],
  exports: [TypeOrmModule, StreakService],
})
export class StreakModule {}
