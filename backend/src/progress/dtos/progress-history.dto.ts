import { ApiProperty } from '@nestjs/swagger';

export class ProgressHistoryDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Progress record ID',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Puzzle ID',
  })
  puzzleId: string;

  @ApiProperty({
    example: 'What is the time complexity of binary search?',
    description: 'The puzzle question',
  })
  question: string;

  @ApiProperty({
    example: 'O(log n)',
    description: 'User answer',
  })
  userAnswer: string;

  @ApiProperty({
    example: true,
    description: 'Whether the answer was correct',
  })
  isCorrect: boolean;

  @ApiProperty({
    example: 10,
    description: 'Points earned for this attempt',
  })
  pointsEarned: number;

  @ApiProperty({
    example: 45,
    description: 'Time spent on this puzzle in seconds',
  })
  timeSpent: number;

  @ApiProperty({
    example: '2024-01-28T10:30:00Z',
    description: 'When the puzzle was attempted',
  })
  attemptedAt: Date;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Category ID',
  })
  categoryId: string;
}
