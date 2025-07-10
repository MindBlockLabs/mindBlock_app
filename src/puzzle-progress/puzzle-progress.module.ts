import { Module } from '@nestjs/common';
import { PuzzleProgressService } from './puzzle-progress.service';
import { PuzzleProgressController } from './puzzle-progress.controller';

@Module({
  providers: [PuzzleProgressService],
  controllers: [PuzzleProgressController],
  exports: [PuzzleProgressService],
})
export class PuzzleProgressModule {}