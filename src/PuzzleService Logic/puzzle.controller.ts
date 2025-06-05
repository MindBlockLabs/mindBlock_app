import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
};

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Assumes user object is attached to request by AuthGuard
    return request.user?.id;
  },
);
