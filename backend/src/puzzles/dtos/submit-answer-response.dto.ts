import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the answer is correct',
  })
  isCorrect: boolean;

  @ApiProperty({
    example: 50,
    description: 'Points earned from this submission',
  })
  pointsEarned: number;

  @ApiProperty({
    example: 150,
    description: 'User total XP after submission',
  })
  newXP: number;

  @ApiProperty({
    example: 2,
    description: 'User level after submission',
  })
  newLevel: number;

  @ApiProperty({
    example: 5,
    description: 'Total puzzles completed by user',
  })
  puzzlesCompleted: number;

  @ApiProperty({
    example: 'Correct! You earned 50 XP',
    description: 'Message about the submission result',
  })
  message: string;
}
