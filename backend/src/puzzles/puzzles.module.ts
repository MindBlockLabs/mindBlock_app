import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, Category])],
  exports: [TypeOrmModule],
})
export class PuzzlesModule {}
