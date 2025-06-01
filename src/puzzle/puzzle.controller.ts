// src/puzzle/puzzle.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Puzzle')
@Controller('puzzle')
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Get()
  getPuzzleStub() {
    return this.puzzleService.getPuzzleStub();
  }
}