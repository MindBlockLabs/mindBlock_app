import { forwardRef, Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { PuzzleModule } from 'src/puzzle/puzzle.module';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    forwardRef(() => PuzzleModule),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
