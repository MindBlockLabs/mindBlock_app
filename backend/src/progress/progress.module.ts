import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/progress.entity';
import { ProgressController } from './controllers/progress.controller';
import { ProgressService } from './progress.service';
import { GetProgressHistoryProvider } from './providers/get-progress-history.provider';
import { GetCategoryStatsProvider } from './providers/get-category-stats.provider';
import { GetOverallStatsProvider } from './providers/get-overall-stats.provider';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgress])],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    GetProgressHistoryProvider,
    GetCategoryStatsProvider,
    GetOverallStatsProvider,
    ProgressCalculationProvider,
  ],
  exports: [TypeOrmModule],
})
export class ProgressModule {}
