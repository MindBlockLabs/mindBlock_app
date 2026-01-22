import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/user-progress.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgress, Puzzle])],
  providers: [ProgressCalculationProvider],
  exports: [ProgressCalculationProvider],
})
export class ProgressModule {}
