// src/puzzle/puzzle.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PuzzleFilterDto, SubmitPuzzleDto, PuzzleProgressDto } from './dto/puzzle.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActiveUser } from '../auth/decorators/activeUser.decorator';

@ApiTags('Puzzle')
@Controller('puzzles')
@ApiBearerAuth()
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Get()
  @ApiOperation({ summary: 'List puzzles with optional filters' })
  @ApiQuery({ name: 'type', required: false, enum: ['LOGIC', 'MATH', 'WORD', 'OTHER'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['EASY', 'MEDIUM', 'HARD'] })
  @ApiQuery({ name: 'solved', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of puzzles' })
  @UseGuards(Auth)
  async listPuzzles(
    @Query(new ValidationPipe({ transform: true })) filters: PuzzleFilterDto,
    @ActiveUser('sub') userId: number,
  ) {
    // TODO: Implement logic in service
    return this.puzzleService.listPuzzles(filters, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single puzzle by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Puzzle details' })
  @UseGuards(Auth)
  async getPuzzleById(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('sub') userId: number,
  ) {
    // TODO: Implement logic in service
    return this.puzzleService.getPuzzleById(id, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a solution for a puzzle' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: SubmitPuzzleDto })
  @ApiResponse({ status: 200, description: 'Submission result' })
  @UseGuards(Auth)
  async submitPuzzle(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true })) submitDto: SubmitPuzzleDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.puzzleService.submitSolution(userId, id, submitDto.solution);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user progress per puzzle type' })
  @ApiResponse({ status: 200, type: [PuzzleProgressDto] })
  @UseGuards(Auth)
  async getUserProgress(@ActiveUser('sub') userId: number) {
    // TODO: Implement logic in service
    return this.puzzleService.getUserProgress(userId);
  }
}