import { ApiProperty } from '@nestjs/swagger';

export class StreakResponseDto {
  @ApiProperty({ example: 3, description: 'Current active streak length in days' })
  currentStreak: number;

  @ApiProperty({ example: 7, description: 'Longest streak achieved' })
  longestStreak: number;

  @ApiProperty({
    example: '2026-01-26',
    nullable: true,
    description: 'The most recent activity date in YYYY-MM-DD',
  })
  lastActivityDate: string | null;

  @ApiProperty({
    type: [String],
    example: ['2026-01-23', '2026-01-24', '2026-01-25'],
    description: 'List of completion dates recorded for the user',
  })
  streakDates: string[];
}
