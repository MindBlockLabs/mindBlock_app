import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzlesController } from './controllers/puzzles.controller';
import { PuzzlesService } from './providers/puzzles.service';
import { CreatePuzzleService } from './providers/create-puzzle.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Puzzle]),
    CategoriesModule, // Import to use CategoriesService for category validation
  ],
  controllers: [PuzzlesController],
  providers: [PuzzlesService, CreatePuzzleService],
  exports: [PuzzlesService],
})
export class PuzzlesModule {}
