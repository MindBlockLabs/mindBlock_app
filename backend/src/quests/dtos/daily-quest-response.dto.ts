import { ApiProperty } from '@nestjs/swagger';
import { PuzzleResponseDto } from './puzzle-response.dto';

export class DailyQuestResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the daily quest',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The date of this quest (YYYY-MM-DD)',
    example: '2026-01-23',
  })
  questDate: string;

  @ApiProperty({
    description: 'Total number of questions in this quest',
    example: 10,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Number of questions completed',
    example: 3,
  })
  completedQuestions: number;

  @ApiProperty({
    description: 'Whether the entire quest is completed',
    example: false,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: 'Total points earned so far in this quest',
    example: 750,
  })
  pointsEarned: number;

  @ApiProperty({
    description: 'When this quest was created',
    example: '2026-01-23T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When this quest was completed (if applicable)',
    example: '2026-01-23T15:45:00Z',
    nullable: true,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Array of puzzles in this daily quest',
    type: [PuzzleResponseDto],
  })
  puzzles: PuzzleResponseDto[];
}
