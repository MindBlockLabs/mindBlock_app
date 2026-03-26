import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PuzzlesService } from '../providers/puzzles.service';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleQueryDto } from '../dtos/puzzle-query.dto';
import { Roles } from '../../roles/roles.decorator';
import { userRole } from '../../users/enums/userRole.enum';

@Controller('puzzles')
@Version('1')
@ApiTags('puzzles-v1')
@ApiHeader({
  name: 'X-API-Version',
  required: false,
  description: 'Alternative version selector. Supported values: 1 or v1.',
})
@ApiQuery({
  name: 'api_version',
  required: false,
  description: 'Fallback version selector. Supported values: 1 or v1.',
})
export class PuzzlesV1Controller {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @Post()
  @Roles(userRole.ADMIN)
  @ApiOperation({ summary: 'Create a new puzzle (v1 contract)' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle created successfully',
    type: Puzzle,
  })
  async create(@Body() createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.puzzlesService.create(createPuzzleDto);
  }

  @Get('daily-quest')
  @ApiOperation({ summary: 'Get the legacy v1 daily quest puzzle selection' })
  @ApiResponse({
    status: 200,
    description: 'Daily quest puzzles retrieved successfully',
    type: Puzzle,
    isArray: true,
  })
  getDailyQuest() {
    return this.puzzlesService.getDailyQuestPuzzles();
  }

  @Get()
  @ApiOperation({ summary: 'Get puzzles with the v1 pagination contract' })
  @ApiResponse({
    status: 200,
    description: 'Puzzles retrieved successfully',
  })
  findAll(@Query() query: PuzzleQueryDto) {
    return this.puzzlesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a puzzle by ID with the v1 response shape' })
  @ApiResponse({
    status: 200,
    description: 'Puzzle retrieved successfully',
    type: Puzzle,
  })
  getById(@Param('id') id: string) {
    return this.puzzlesService.getPuzzleById(id);
  }
}
