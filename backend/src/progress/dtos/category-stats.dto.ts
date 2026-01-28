import { ApiProperty } from '@nestjs/swagger';

export class CategoryStatsDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID',
  })
  categoryId: string;

  @ApiProperty({
    example: 'Algorithms',
    description: 'Category name',
  })
  categoryName: string;

  @ApiProperty({
    example: 25,
    description: 'Total number of attempts in this category',
  })
  totalAttempts: number;

  @ApiProperty({
    example: 20,
    description: 'Number of correct answers',
  })
  correctAnswers: number;

  @ApiProperty({
    example: 80,
    description: 'Accuracy percentage',
  })
  accuracy: number;
}
