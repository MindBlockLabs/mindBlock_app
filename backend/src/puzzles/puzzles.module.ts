import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { Category } from '../categories/entities/category.entity';
import { PuzzlesV1Controller } from './controllers/puzzles-v1.controller';
import { PuzzlesV2Controller } from './controllers/puzzles-v2.controller';
import { PuzzlesService } from './providers/puzzles.service';
import { CreatePuzzleProvider } from './providers/create-puzzle.provider';
import { GetAllPuzzlesProvider } from './providers/getAll-puzzle.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, Category])],
  controllers: [PuzzlesV1Controller, PuzzlesV2Controller],
  providers: [PuzzlesService, CreatePuzzleProvider, GetAllPuzzlesProvider],
  exports: [TypeOrmModule, PuzzlesService],
})
export class PuzzlesModule {}
