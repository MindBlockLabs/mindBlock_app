import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PuzzleFilterDto, SubmitPuzzleDto, PuzzleProgressDto } from './dto/puzzle.dto';
import { ActiveUser } from '../auth/decorators/activeUser.decorator';
import { ActiveUserData } from '../auth/interfaces/activeInterface';
import { PuzzleService } from './puzzle.service';
import { Puzzle } from './entities/puzzle.entity';

@ApiTags('Puzzle')
@Controller('puzzles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all puzzles with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of puzzles',
    type: [Puzzle],
  })
  @ApiQuery({ name: 'type', required: false, enum: ['logic', 'coding', 'blockchain'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  async getPuzzles(@Query() filters: PuzzleFilterDto): Promise<Puzzle[]> {
    return this.puzzleService.getPuzzles(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific puzzle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Puzzle details',
    type: Puzzle,
  })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  @ApiParam({ name: 'id', description: 'Puzzle ID' })
  async getPuzzle(@Param('id', ParseIntPipe) id: number): Promise<Puzzle> {
    return this.puzzleService.getPuzzle(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a solution for a puzzle' })
  @ApiResponse({
    status: 200,
    description: 'Puzzle submission result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        xpEarned: { type: 'number' },
        tokensEarned: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  @ApiParam({ name: 'id', description: 'Puzzle ID' })
  @ApiBody({ type: SubmitPuzzleDto })
  async submitPuzzle(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseIntPipe) puzzleId: number,
    @Body(ValidationPipe) submitDto: SubmitPuzzleDto,
  ) {
    return this.puzzleService.submitPuzzleSolution(user.sub.toString(), puzzleId, submitDto);
  }

  @Get('progress/user')
  @ApiOperation({ summary: 'Get current user puzzle progress' })
  @ApiResponse({
    status: 200,
    description: 'User puzzle progress',
    type: [PuzzleProgressDto],
  })
  async getUserProgress(@ActiveUser() user: ActiveUserData) {
    return this.puzzleService.getUserProgress(user.sub.toString());
  }
}