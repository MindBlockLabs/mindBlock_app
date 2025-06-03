import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../decorators/user-id.decorator';

@Controller('puzzles')
@UseGuards(AuthGuard)
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Post(':id/submit')
  async submitPuzzle(
    @UserId() userId: string,
    @Param('id') puzzleId: string,
    @Body() attemptData: any,
  ) {
    return this.puzzleService.submitPuzzleSolution(userId, puzzleId, attemptData);
  }
}