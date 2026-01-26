import { ApiProperty } from '@nestjs/swagger';

export class SubmitResponseDto {
  @ApiProperty({
    description: 'Whether the answer was correct',
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Points earned for this submission',
    example: 150,
  })
  pointsEarned: number;

  @ApiProperty({
    description: 'User\'s new XP total after submission',
    example: 1250,
  })
  newXP: number;

  @ApiProperty({
    description: 'User\'s new level after submission',
    example: 3,
  })
  newLevel: number;

  @ApiProperty({
    description: 'User\'s new puzzles completed count',
    example: 25,
  })
  puzzlesCompleted: number;

  @ApiProperty({
    description: 'Explanation of the correct answer (if available)',
    example: 'A piano has keys (musical keys) but cannot open locks.',
    nullable: true,
  })
  explanation?: string;

  @ApiProperty({
    description: 'Time bonus multiplier applied (if any)',
    example: 1.2,
    nullable: true,
  })
  timeMultiplier?: number;
}