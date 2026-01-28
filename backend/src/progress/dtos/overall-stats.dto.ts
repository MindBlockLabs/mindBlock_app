import { ApiProperty } from '@nestjs/swagger';

export class OverallStatsDto {
  @ApiProperty({
    example: 150,
    description: 'Total number of attempts across all categories',
  })
  totalAttempts: number;

  @ApiProperty({
    example: 120,
    description: 'Total number of correct answers',
  })
  totalCorrect: number;

  @ApiProperty({
    example: 80,
    description: 'Overall accuracy percentage',
  })
  accuracy: number;

  @ApiProperty({
    example: 1500,
    description: 'Total points earned across all puzzles',
  })
  totalPointsEarned: number;

  @ApiProperty({
    example: 3600,
    description: 'Total time spent on all puzzles in seconds',
  })
  totalTimeSpent: number;
}
