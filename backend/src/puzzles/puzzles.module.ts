import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/user.entity';
import { UserProgress } from '../progress/entities/user-progress.entity';
import { PuzzlesController } from './controllers/puzzles.controller';
import { PuzzlesService } from './providers/puzzles.service';
import { CreatePuzzleProvider } from './providers/create-puzzle.provider';
import { GetAllPuzzlesProvider } from './providers/getAll-puzzle.provider';
import { PuzzleSubmissionProvider } from './providers/puzzle-submission.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, Category, User, UserProgress])],
  controllers: [PuzzlesController],
  providers: [PuzzlesService, CreatePuzzleProvider, GetAllPuzzlesProvider, PuzzleSubmissionProvider],
  exports: [TypeOrmModule, PuzzlesService],
})
export class PuzzlesModule {}
