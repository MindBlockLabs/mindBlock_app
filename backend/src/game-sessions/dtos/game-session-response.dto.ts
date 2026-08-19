import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameSessionStatus } from '../enums/game-session-status.enum';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';

export class GameSessionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ example: 'user-uuid', nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ example: 'guest-abc123', nullable: true })
  guestId: string | null;

  @ApiProperty({ enum: GameSessionStatus, example: GameSessionStatus.ACTIVE })
  status: GameSessionStatus;

  @ApiPropertyOptional({ enum: PuzzleDifficulty, nullable: true })
  difficulty: PuzzleDifficulty | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['coding', 'logic'],
    nullable: true,
  })
  selectedCategories: string[] | null;

  @ApiProperty({ example: 10 })
  challengeCount: number;

  @ApiProperty({ example: 2 })
  currentChallenge: number;

  @ApiProperty({ example: 300 })
  score: number;

  @ApiProperty({ example: 50 })
  xpEarned: number;

  @ApiPropertyOptional({ example: '2026-08-19T12:00:00.000Z', nullable: true })
  startedAt: Date | null;

  @ApiPropertyOptional({ example: '2026-08-19T12:15:00.000Z', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ example: '2026-08-19T11:59:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-19T12:00:00.000Z' })
  updatedAt: Date;
}
