import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
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
   * When completing a session, optionally supply the final score and XP.
   * The service will ignore these values for non-terminal transitions.
   */
  @ApiPropertyOptional({
    description: 'Final score (used when transitioning to COMPLETED)',
    example: 850,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @ApiPropertyOptional({
    description: 'XP earned (used when transitioning to COMPLETED)',
    example: 120,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpEarned?: number;
}
