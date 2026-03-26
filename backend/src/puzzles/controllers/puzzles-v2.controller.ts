import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PuzzlesService } from '../providers/puzzles.service';
import { CreatePuzzleDto } from '../dtos/create-puzzle.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';

class PuzzleV2QueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(PuzzleDifficulty)
  difficulty?: PuzzleDifficulty;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeCategorySummary?: boolean = true;
}

class PuzzleV2MetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  includeCategorySummary!: boolean;
}

class PuzzleV2CollectionResponseDto {
  @ApiProperty({ type: Puzzle, isArray: true })
  data!: Puzzle[];

  @ApiProperty({ type: PuzzleV2MetaDto })
  meta!: PuzzleV2MetaDto;
}

class PuzzleV2ItemResponseDto {
  @ApiProperty({ type: Puzzle })
  data!: Puzzle;

  @ApiProperty()
  version!: string;
}

@Controller('puzzles')
@Version('2')
@ApiTags('puzzles-v2')
@ApiHeader({
  name: 'X-API-Version',
  required: false,
  description: 'Alternative version selector. Supported values: 2 or v2.',
})
@ApiQuery({
  name: 'api_version',
  required: false,
  description: 'Fallback version selector. Supported values: 2 or v2.',
})
export class PuzzlesV2Controller {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new puzzle (v2 contract)' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle created successfully',
    type: PuzzleV2ItemResponseDto,
  })
  async create(@Body() createPuzzleDto: CreatePuzzleDto) {
    const puzzle = await this.puzzlesService.create(createPuzzleDto);

    return {
      data: puzzle,
      version: '2',
    };
  }

  @Get('daily-quest')
  @ApiOperation({ summary: 'Get daily quest puzzles with the v2 envelope' })
  @ApiResponse({
    status: 200,
    description: 'Daily quest puzzles retrieved successfully',
    type: PuzzleV2CollectionResponseDto,
  })
  async getDailyQuest() {
    const puzzles = await this.puzzlesService.getDailyQuestPuzzles();

    return {
      data: puzzles,
      meta: {
        page: 1,
        pageSize: puzzles.length,
        total: puzzles.length,
        version: '2',
        includeCategorySummary: true,
      },
    };
  }

  @Get()
  @ApiOperation({
    summary:
      'Get puzzles with the v2 response envelope and stricter pagination contract',
  })
  @ApiResponse({
    status: 200,
    description: 'Puzzles retrieved successfully',
    type: PuzzleV2CollectionResponseDto,
  })
  async findAll(@Query() query: PuzzleV2QueryDto) {
    const result = await this.puzzlesService.findAll({
      categoryId: query.categoryId,
      difficulty: query.difficulty,
      page: query.page,
      limit: query.pageSize,
    });

    return {
      data: result.data,
      meta: {
        page: result.meta.page,
        pageSize: result.meta.limit,
        total: result.meta.total,
        version: '2',
        includeCategorySummary: query.includeCategorySummary ?? true,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a puzzle by ID with the v2 response envelope' })
  @ApiResponse({
    status: 200,
    description: 'Puzzle retrieved successfully',
    type: PuzzleV2ItemResponseDto,
  })
  async getById(@Param('id') id: string) {
    const puzzle = await this.puzzlesService.getPuzzleById(id);

    return {
      data: puzzle,
      version: '2',
    };
  }
}
