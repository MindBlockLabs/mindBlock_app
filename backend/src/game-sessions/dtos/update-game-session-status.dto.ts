import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { GameSessionStatus } from '../enums/game-session-status.enum';

export class UpdateGameSessionStatusDto {
  @ApiProperty({
    description: 'The target status for this session',
    enum: GameSessionStatus,
    example: GameSessionStatus.ACTIVE,
  })
  @IsEnum(GameSessionStatus)
  status: GameSessionStatus;

  /**
   * Fallback score, only used when completing a session that has no
   * tracked ChallengeAttempt records. Whenever attempts exist, the final
   * score is calculated server-side from those records and this value
   * is ignored.
   */
  @ApiPropertyOptional({
    description:
      'Fallback score used only when the session has no tracked challenge attempts',
    example: 850,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  /**
   * Fallback XP, only used when completing a session that has no tracked
   * ChallengeAttempt records. See `score` above.
   */
  @ApiPropertyOptional({
    description:
      'Fallback XP used only when the session has no tracked challenge attempts',
    example: 120,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpEarned?: number;

  /**
   * IANA timezone (e.g. "America/New_York") used to evaluate streak
   * continuity when completing a session. Defaults to UTC if omitted.
   */
  @ApiPropertyOptional({
    description:
      'IANA timezone used for streak calculation on completion, defaults to UTC',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  userTimezone?: string;
}
