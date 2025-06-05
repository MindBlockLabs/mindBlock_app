import { ApiProperty } from '@nestjs/swagger';
import { StreakUpdateResult } from 'src/daily-streak/daily_streak_service';

export class PuzzleRewardResponseDto {
  @ApiProperty({ example: { xp: 100, tokens: 10 } })
  puzzleRewards: any;

  @ApiProperty({ type: 'object', required: false })
  streakResult: StreakUpdateResult | null;
}