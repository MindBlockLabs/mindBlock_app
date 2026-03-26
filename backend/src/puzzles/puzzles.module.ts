import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { Category } from '../categories/entities/category.entity';
import { PuzzlesController } from './controllers/puzzles.controller';
import { PuzzlesService } from './providers/puzzles.service';
import { CreatePuzzleProvider } from './providers/create-puzzle.provider';
import { GetAllPuzzlesProvider } from './providers/getAll-puzzle.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, Category])],
  controllers: [PuzzlesController],
  providers: [PuzzlesService, CreatePuzzleProvider, GetAllPuzzlesProvider],
  exports: [TypeOrmModule, PuzzlesService],
})
export class PuzzlesModule {}
