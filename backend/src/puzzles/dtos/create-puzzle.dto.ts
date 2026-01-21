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
  @IsString()
  @MinLength(10, { message: 'Question must be at least 10 characters long' })
  question: string;

  @IsArray()
  @IsString({ each: true })
  @Validate(OptionsMinimumLengthConstraint)
  options: string[];

  @IsString()
  @Validate(CorrectAnswerInOptionsConstraint)
  correctAnswer: string;

  @IsEnum(PuzzleDifficulty)
  difficulty: PuzzleDifficulty;

  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number;

  @IsNumber()
  @Min(10, { message: 'Time limit must be at least 10 seconds' })
  @Type(() => Number)
  timeLimit: number;

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