import {
  IsString,
  IsArray,
  IsEnum,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  ArrayMinSize,
  ArrayContains,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PuzzleDifficulty, getPointsByDifficulty } from '../enums/puzzle-difficulty.enum';

@ValidatorConstraint({ name: 'correctAnswerInOptions', async: false })
export class CorrectAnswerInOptionsConstraint implements ValidatorConstraintInterface {
  validate(correctAnswer: string, args: ValidationArguments) {
    const object = args.object as CreatePuzzleDto;
    return object.options?.includes(correctAnswer) || false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'correctAnswer must be one of the provided options';
  }
}

@ValidatorConstraint({ name: 'optionsMinimumLength', async: false })
export class OptionsMinimumLengthConstraint implements ValidatorConstraintInterface {
  validate(options: string[], args: ValidationArguments) {
    return options?.length >= 2;
  }

  defaultMessage(args: ValidationArguments) {
    return 'options must contain at least 2 items';
  }
}

export class CreatePuzzleDto {
  @ApiProperty({
    description: 'The puzzle question text',
    example: 'What has keys but can\'t open locks?',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Question must be at least 10 characters long' })
  question: string;

  @ApiProperty({
    description: 'Array of possible answer options',
    example: ['A piano', 'A map', 'A keyboard', 'A code'],
    type: [String],
    minItems: 2,
  })
  @IsArray()
  @IsString({ each: true })
  @Validate(OptionsMinimumLengthConstraint)
  options: string[];

  @ApiProperty({
    description: 'The correct answer from the options array',
    example: 'A piano',
  })
  @IsString()
  @Validate(CorrectAnswerInOptionsConstraint)
  correctAnswer: string;

  @ApiProperty({
    description: 'Difficulty level of the puzzle',
    enum: PuzzleDifficulty,
    enumName: 'PuzzleDifficulty',
    example: PuzzleDifficulty.INTERMEDIATE,
  })
  @IsEnum(PuzzleDifficulty)
  difficulty: PuzzleDifficulty;

  @ApiProperty({
    description: 'UUID of the category this puzzle belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Points awarded for solving this puzzle. If not provided, will be calculated based on difficulty',
    example: 250,
    minimum: 0,
    default: null,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number;

  @ApiProperty({
    description: 'Time limit to solve the puzzle in seconds',
    example: 60,
    minimum: 10,
    default: 60,
  })
  @IsNumber()
  @Min(10, { message: 'Time limit must be at least 10 seconds' })
  @Type(() => Number)
  timeLimit: number;

  @ApiPropertyOptional({
    description: 'Explanation of the correct answer',
    example: 'A piano has keys (musical keys) but cannot open locks.',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  // This method can be called after validation to set default points
  setDefaultPointsIfNeeded(): void {
    if (!this.points) {
      this.points = getPointsByDifficulty(this.difficulty);
    }
  }
}