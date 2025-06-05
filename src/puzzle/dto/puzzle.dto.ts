import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PuzzleType } from '../enums/puzzle-type.enum';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';

export class PuzzleFilterDto {
  @ApiPropertyOptional({ enum: PuzzleType })
  @IsOptional()
  @IsEnum(PuzzleType)
  type?: PuzzleType;

  @ApiPropertyOptional({ enum: PuzzleDifficulty })
  @IsOptional()
  @IsEnum(PuzzleDifficulty)
  difficulty?: PuzzleDifficulty;

  @ApiPropertyOptional({ description: 'Solved status: true or false' })
  @IsOptional()
  solved?: boolean;
}

export class SubmitPuzzleDto {
  @ApiProperty({ description: 'User solution to the puzzle' })
  @IsNotEmpty()
  @IsString()
  solution: string;
}

export class PuzzleProgressDto {
  @ApiProperty({ enum: PuzzleType })
  @IsEnum(PuzzleType)
  type: PuzzleType;

  @ApiProperty({ description: 'Number of puzzles solved' })
  @IsNumber()
  solved: number;

  @ApiProperty({ description: 'Total puzzles available' })
  @IsNumber()
  total: number;
}
