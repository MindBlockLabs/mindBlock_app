import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/progress.entity';

import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { UsersModule } from '../users/users.module';
import { ProgressService } from './progress.service';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';
import { ProgressController } from './progress.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgress, Puzzle]),
    UsersModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressCalculationProvider],
  exports: [TypeOrmModule, ProgressService],
})
export class ProgressModule {}
