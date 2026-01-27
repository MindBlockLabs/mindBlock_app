import {
  IsString,
  IsArray,
  IsEnum,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';
import {
  CorrectAnswerInOptionsConstraint,
  CreatePuzzleDto,
  OptionsMinimumLengthConstraint,
} from './create-puzzle.dto';

export class UpdatePuzzleDto extends PartialType(CreatePuzzleDto) {
  @ApiPropertyOptional({
    description: 'The puzzle question text',
    example: "What has keys but can't open locks?",
    minLength: 10,
    nullable: true,
  })
  @IsString()
  @MinLength(10, { message: 'Question must be at least 10 characters long' })
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({
    description: 'Array of possible answer options',
    example: ['A piano', 'A map', 'A keyboard', 'A code'],
    type: [String],
    minItems: 2,
    nullable: true,
  })
  @IsArray()
  @IsString({ each: true })
  @Validate(OptionsMinimumLengthConstraint)
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({
    description: 'The correct answer from the options array',
    example: 'A piano',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the puzzle',
    enum: PuzzleDifficulty,
    enumName: 'PuzzleDifficulty',
    example: PuzzleDifficulty.INTERMEDIATE,
    nullable: true,
  })
  @IsEnum(PuzzleDifficulty)
  @IsOptional()
  difficulty?: PuzzleDifficulty;

  @ApiPropertyOptional({
    description: 'UUID of the category this puzzle belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Points awarded for solving this puzzle',
    example: 250,
    minimum: 0,
    nullable: true,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({
    description: 'Time limit to solve the puzzle in seconds',
    example: 60,
    minimum: 10,
    nullable: true,
  })
  @IsNumber()
  @Min(10, { message: 'Time limit must be at least 10 seconds' })
  @Type(() => Number)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'Explanation of the correct answer',
    example: 'A piano has keys (musical keys) but cannot open locks.',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  // Note: This getter is for validation only, not for API documentation
  // Override validation for correctAnswer to work with partial updates
  @Validate(CorrectAnswerInOptionsConstraint, {
    message: 'correctAnswer must be one of the provided options',
  })
  @IsOptional()
  get validatedCorrectAnswer(): string | undefined {
    // Only validate if both options and correctAnswer are provided
    if (this.options && this.correctAnswer) {
      return this.correctAnswer;
    }
    return undefined;
  }
}
