import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PuzzlesService } from '../providers/puzzles.service';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';
import { SubmitPuzzleDto } from '../dtos/submit-puzzle.dto';
import { SubmitPuzzleResponseDto } from '../dtos/submit-puzzle-response.dto';
import { SubmitPuzzleProvider } from '../providers/submit-puzzle.provider';

@Controller('puzzles')
@ApiTags('puzzles')
export class PuzzlesController {
  constructor(
    private readonly puzzlesService: PuzzlesService,
    private readonly submitPuzzleProvider: SubmitPuzzleProvider,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new puzzle' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle created successfully',
    type: Puzzle,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input, category not found, or category inactive',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(@Body() createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.puzzlesService.create(createPuzzleDto);
  }

  @ApiOperation({ summary: 'Get a puzzle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Puzzle retrieved successfully',
    type: Puzzle,
  })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.puzzlesService.getPuzzleById(id);
  }

  @ApiOperation({ summary: 'Get daily quest puzzles' })
  @ApiResponse({
    status: 200,
    description: 'Daily quest puzzles retrieved successfully',
    type: Puzzle,
  })
  @Get('daily-quest')
  getDailyQuest() {
    return this.puzzlesService.getDailyQuestPuzzles();
  }
  @ApiOperation({ summary: 'Get all puzzles' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle retrieved successfully',
    type: Puzzle,
  })
  @Get()
  findAll(@Query() query: PuzzleQueryDto) {
    return this.puzzlesService.findAll(query);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit answer to a puzzle' })
  @ApiResponse({
    status: 201,
    description: 'Answer submitted successfully',
    type: SubmitPuzzleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or puzzle not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Puzzle not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate submission detected',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async submit(@Body() submitPuzzleDto: SubmitPuzzleDto): Promise<SubmitPuzzleResponseDto> {
    return this.submitPuzzleProvider.execute(submitPuzzleDto);
  }
}
