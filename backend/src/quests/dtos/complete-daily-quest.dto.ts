import { ApiProperty } from '@nestjs/swagger';

export class CompleteDailyQuestResponseDto {
  @ApiProperty({
    description: 'Whether the quest was completed successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Daily quest completed successfully!',
  })
  message: string;

  @ApiProperty({
    description: 'Bonus XP awarded for completion',
    example: 100,
  })
  bonusXp: number;

  @ApiProperty({
    description: 'Total XP earned in this quest (including bonus)',
    example: 850,
  })
  totalXp: number;

  @ApiProperty({
    description: 'Updated user streak information',
    type: 'object',
    properties: {
      currentStreak: {
        type: 'number',
        example: 5,
      },
      longestStreak: {
        type: 'number',
        example: 10,
      },
      lastActivityDate: {
        type: 'string',
        example: '2026-01-28',
      },
    },
  })
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  };

  @ApiProperty({
    description: 'When the quest was completed',
    example: '2026-01-28T15:30:00Z',
  })
  completedAt: Date;
}
