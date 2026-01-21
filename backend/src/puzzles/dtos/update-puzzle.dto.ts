import {
  IsString,
  IsArray,
  IsEnum,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  ArrayMinSize,
  MinLength,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';
import {
  CorrectAnswerInOptionsConstraint,
  CreatePuzzleDto,
  OptionsMinimumLengthConstraint,
} from './create-puzzle.dto';

export class UpdatePuzzleDto extends PartialType(CreatePuzzleDto) {
  @IsString()
  @MinLength(10, { message: 'Question must be at least 10 characters long' })
  @IsOptional()
  question?: string;

  @IsArray()
  @IsString({ each: true })
  @Validate(OptionsMinimumLengthConstraint)
  @IsOptional()
  options?: string[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsEnum(PuzzleDifficulty)
  @IsOptional()
  difficulty?: PuzzleDifficulty;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number;

  @IsNumber()
  @Min(10, { message: 'Time limit must be at least 10 seconds' })
  @Type(() => Number)
  @IsOptional()
  timeLimit?: number;

  @IsString()
  @IsOptional()
  explanation?: string;

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