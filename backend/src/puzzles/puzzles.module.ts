import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { Category } from '../categories/entities/category.entity';
import { UserProgress } from '../progress/entities/user-progress.entity';
import { PuzzlesController } from './controllers/puzzles.controller';
import { PuzzlesService } from './providers/puzzles.service';
import { CreatePuzzleProvider } from './providers/create-puzzle.provider';
import { GetAllPuzzlesProvider } from './providers/getAll-puzzle.provider';
import { SubmitPuzzleProvider } from './providers/submit-puzzle.provider';
import { CacheWarmingService } from './providers/cache-warming.service';
import { UsersModule } from '../users/users.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, Category, UserProgress]), UsersModule, ScheduleModule.forRoot()],
  controllers: [PuzzlesController],
  providers: [PuzzlesService, CreatePuzzleProvider, GetAllPuzzlesProvider, SubmitPuzzleProvider, CacheWarmingService],
  exports: [TypeOrmModule, PuzzlesService, SubmitPuzzleProvider],
})
export class PuzzlesModule {}
