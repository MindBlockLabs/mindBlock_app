import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';

export class CreateGameSessionDto {
  /**
   * Optional guest identifier for unauthenticated sessions.
   * If not provided the session will be tied to the authenticated user.
   */
  @ApiPropertyOptional({
    description: 'Guest ID for unauthenticated sessions',
    example: 'guest-abc123',
  })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level for the session',
    enum: PuzzleDifficulty,
    example: PuzzleDifficulty.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(PuzzleDifficulty)
  difficulty?: PuzzleDifficulty;

  @ApiPropertyOptional({
    description: 'Category IDs or slugs to include in this session',
    example: ['coding', 'logic'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCategories?: string[];

  @ApiProperty({
    description: 'Number of challenges to include in the session',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  challengeCount: number;
}
