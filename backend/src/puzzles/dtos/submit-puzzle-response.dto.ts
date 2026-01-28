import { ApiProperty } from '@nestjs/swagger';

export class SubmitPuzzleResponseDto {
  @ApiProperty({
    description: 'Whether the answer was correct',
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Points earned from this submission',
    example: 50,
  })
  pointsEarned: number;

  @ApiProperty({
    description: 'User\'s new XP total after submission',
    example: 120,
  })
  newXP: number;

  @ApiProperty({
    description: 'User\'s new level after submission',
    example: 3,
  })
  newLevel: number;

  @ApiProperty({
    description: 'User\'s total puzzles completed after submission',
    example: 10,
  })
  puzzlesCompleted: number;
}