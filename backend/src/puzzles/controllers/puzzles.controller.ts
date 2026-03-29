import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PuzzlesService } from '../providers/puzzles.service';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { PuzzleResponseDto } from '../dtos/puzzle-response.dto';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';

@Controller('puzzles')
@ApiTags('puzzles')
export class PuzzlesController {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new puzzle' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle created successfully',
    type: PuzzleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input, category not found, or category inactive',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(@Body() createPuzzleDto: CreatePuzzleDto): Promise<PuzzleResponseDto> {
    return this.puzzlesService.create(createPuzzleDto);
  }

  @ApiOperation({ summary: 'Get daily quest puzzles' })
  @ApiResponse({
    status: 200,
    description: 'Daily quest puzzles retrieved successfully',
    type: PuzzleResponseDto,
    isArray: true,
  })
  @Get('daily-quest')
  getDailyQuest(): Promise<PuzzleResponseDto[]> {
    return this.puzzlesService.getDailyQuestPuzzles();
  }
  @ApiOperation({ summary: 'Get all puzzles' })
  @ApiResponse({
    status: 200,
    description: 'Puzzles retrieved successfully',
  })
  @Get()
  findAll(@Query() query: PuzzleQueryDto) {
    return this.puzzlesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a puzzle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Puzzle retrieved successfully',
    type: PuzzleResponseDto,
  })
  @Get(':id')
  getById(@Param('id') id: string): Promise<PuzzleResponseDto> {
    return this.puzzlesService.getPuzzleById(id);
  }
}
