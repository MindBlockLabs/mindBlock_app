import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLeaderboardDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  puzzlesCompleted?: number;

  @IsOptional()
  @IsNumber()
  badgeId?: number;
}
