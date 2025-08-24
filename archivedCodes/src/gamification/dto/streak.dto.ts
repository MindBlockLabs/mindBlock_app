import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';

export class StreakResponseDto {
  @ApiProperty({ description: 'Current consecutive days streak count' })
  streakCount: number;

  @ApiProperty({ description: 'Longest streak achieved by the user' })
  longestStreak: number;

  @ApiProperty({ description: 'Last date the user was active', required: false })
  lastActiveDate: Date | null;

  @ApiProperty({ description: 'Whether the user has already solved a puzzle today' })
  hasSolvedToday: boolean;

  @ApiProperty({ description: 'Next milestone to reach', required: false })
  nextMilestone?: number;

  @ApiProperty({ description: 'Days until next milestone', required: false })
  daysUntilNextMilestone?: number;
}

export class StreakLeaderboardEntryDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Current streak count' })
  streakCount: number;

  @ApiProperty({ description: 'Longest streak achieved' })
  longestStreak: number;

  @ApiProperty({ description: 'Last active date' })
  lastActiveDate: Date;
}

export class StreakLeaderboardResponseDto {
  @ApiProperty({ description: 'List of top streak holders', type: [StreakLeaderboardEntryDto] })
  entries: StreakLeaderboardEntryDto[];

  @ApiProperty({ description: 'Total number of entries' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of entries per page' })
  limit: number;
}

export class StreakQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Number of entries per page', required: false, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
} 