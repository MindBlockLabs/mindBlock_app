// src/puzzle/puzzle.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { PuzzleController } from './puzzle.controller';
import { GamificationModule } from 'src/gamification/gamification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';

@Module({
  imports: [
    forwardRef(() => GamificationModule),
    TypeOrmModule.forFeature([Puzzle]),
  ],
  controllers: [PuzzleController],
  providers: [],
  exports: [],
})
export class PuzzleModule {}
