import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetStreakResponseDto {
  @ApiProperty({ description: 'Current streak count', example: 5 })
  streakCount: number;

  @ApiProperty({ description: 'Longest streak achieved', example: 15 })
  longestStreak: number;

  @ApiProperty({ description: 'Last active date', example: '2024-12-01' })
  lastActiveDate: string;

  @ApiProperty({ description: 'Whether streak is currently active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Days until streak expires', example: 0 })
  daysUntilExpiry: number;

  @ApiProperty({ description: 'Next milestone day', example: 7, required: false })
  nextMilestone?: number;

  @ApiProperty({ description: 'Progress to next milestone (0-100)', example: 71.4 })
  milestoneProgress: number;
}

export class StreakLeaderboardEntryDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  userId: number;

  @ApiProperty({ description: 'Current streak count', example: 25 })
  streakCount: number;

  @ApiProperty({ description: 'Longest streak achieved', example: 45 })
  longestStreak: number;

  @ApiProperty({ description: 'Last active date', example: '2024-12-01' })
  lastActiveDate: string;

  @ApiProperty({ description: 'Leaderboard rank', example: 1 })
  rank: number;
}

export class GetStreakLeaderboardResponseDto {
  @ApiProperty({ type: [StreakLeaderboardEntryDto] })
  leaderboard: StreakLeaderboardEntryDto[];

  @ApiProperty({ description: 'Total number of users with active streaks', example: 1247 })
  totalActiveUsers: number;

  @ApiProperty({ description: 'Current user rank', example: 15, required: false })
  userRank?: number;
}

export class GetStreakLeaderboardQueryDto {
  @ApiProperty({ 
    description: 'Number of top users to return',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

export class StreakStatsDto {
  @ApiProperty({ description: 'Total number of active streaks', example: 1247 })
  totalActiveStreaks: number;

  @ApiProperty({ description: 'Average streak length', example: 8.5 })
  averageStreakLength: number;

  @ApiProperty({ description: 'Longest current streak', example: 156 })
  longestCurrentStreak: number;
}

export class StreakMilestoneDto {
  @ApiProperty({ description: 'Milestone day', example: 7 })
  day: number;

  @ApiProperty({ description: 'Bonus XP reward', example: 150 })
  bonusXp: number;

  @ApiProperty({ description: 'Bonus tokens reward', example: 15 })
  bonusTokens: number;

  @ApiProperty({ description: 'Milestone title', example: 'Weekly Warrior' })
  title: string;
}

export class StreakUpdateResultDto {
  @ApiProperty({ description: 'Updated streak information' })
  streak: GetStreakResponseDto;

  @ApiProperty({ description: 'Whether this was a new streak', example: false })
  isNewStreak: boolean;

  @ApiProperty({ description: 'Whether streak was incremented', example: true })
  streakIncremented: boolean;

  @ApiProperty({ description: 'Whether a milestone was reached', example: true })
  milestoneReached: boolean;

  @ApiProperty({ description: 'Milestone reward details', required: false })
  milestoneReward?: StreakMilestoneDto;
}