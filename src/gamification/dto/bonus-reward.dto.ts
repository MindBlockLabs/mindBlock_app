import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, Min } from 'class-validator';

export class BonusRewardDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  bonusXp: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  bonusTokens: number;

  @ApiProperty({ example: 'Completed 5-day challenge' })
  @IsString()
  reason: string;
}