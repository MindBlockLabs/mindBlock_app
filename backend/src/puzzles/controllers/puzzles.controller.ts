import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PuzzlesService } from '../providers/puzzles.service';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';

@Controller('puzzles')
@ApiTags('puzzles')
export class PuzzlesController {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new puzzle' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle created successfully',
    type: Puzzle,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Category not found or inactive' })
  async create(@Body() createPuzzleDto: CreatePuzzleDto): Promise<Puzzle> {
    return this.puzzlesService.create(createPuzzleDto);
  }
}
