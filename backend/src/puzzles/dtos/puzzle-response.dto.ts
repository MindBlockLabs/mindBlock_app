import { ApiProperty } from '@nestjs/swagger';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';

export class PuzzleResponseDto {
  @ApiProperty({ description: 'The unique identifier of the puzzle' })
  id: string;

  @ApiProperty({ description: 'The puzzle question' })
  question: string;

  @ApiProperty({ description: 'The options for the puzzle', type: [String] })
  options: string[];

  @ApiProperty({ description: 'The difficulty level of the puzzle', enum: PuzzleDifficulty })
  difficulty: PuzzleDifficulty;

  @ApiProperty({ description: 'The ID of the category this puzzle belongs to' })
  categoryId: string;

  @ApiProperty({ description: 'The points awarded for solving the puzzle' })
  points: number;

  @ApiProperty({ description: 'The time limit for the puzzle in seconds' })
  timeLimit: number;

  @ApiProperty({ description: 'The explanation for the puzzle answer', required: false })
  explanation?: string;

  @ApiProperty({ description: 'The date and time the puzzle was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date and time the puzzle was last updated' })
  updatedAt: Date;
}
