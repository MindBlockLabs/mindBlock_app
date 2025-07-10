import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PuzzleProgressService } => './puzzle-progress.service';
import { IsString, IsNotEmpty } from 'class-validator';

class SolvePuzzleDto {
  @IsNotEmpty()
  @IsString()
  puzzleId: string;
}

@Controller('users')
export class PuzzleProgressController {
  private readonly logger = new Logger(PuzzleProgressController.name);

  constructor(private readonly puzzleProgressService: PuzzleProgressService) {}

  @Get(':id/progress')
  @HttpCode(HttpStatus.OK)
  getPuzzleProgress(@Param('id') userId: string): { [key: string]: { completed: number; total: number } } {
    this.logger.log(`Received request for puzzle progress for user: ${userId}`);
    return this.puzzleProgressService.getPuzzleProgress(userId);
  }

  @Post(':id/solve-puzzle')
  @HttpCode(HttpStatus.NO_CONTENT)
  recordPuzzleSolve(@Param('id') userId: string, @Body() solvePuzzleDto: SolvePuzzleDto): void {
    this.logger.log(`Received request to record puzzle solve for user: ${userId}, puzzle: ${solvePuzzleDto.puzzleId}`);
    this.puzzleProgressService.recordPuzzleSolve(userId, solvePuzzleDto.puzzleId);
  }
}