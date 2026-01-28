import { ApiProperty } from '@nestjs/swagger';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';

export class PuzzleResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the puzzle',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The puzzle question',
    example: 'What is the time complexity of binary search?',
  })
  question: string;

  @ApiProperty({
    description: 'Array of answer options',
    example: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
    type: [String],
  })
  options: string[];

  @ApiProperty({
    description: 'Difficulty level of the puzzle',
    enum: PuzzleDifficulty,
    example: PuzzleDifficulty.INTERMEDIATE,
  })
  difficulty: PuzzleDifficulty;

  @ApiProperty({
    description: 'UUID of the category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Points awarded for solving this puzzle',
    example: 250,
  })
  points: number;

  @ApiProperty({
    description: 'Time limit in seconds',
    example: 60,
  })
  timeLimit: number;

  @ApiProperty({
    description: 'Whether this puzzle has been completed in the current quest',
    example: false,
  })
  isCompleted: boolean;
}
