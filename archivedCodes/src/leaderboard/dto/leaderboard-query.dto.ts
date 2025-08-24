import { IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortBy {
  TOKENS = 'tokens',
  SCORE = 'score',
  PUZZLES = 'puzzlesCompleted',
}

export enum TimePeriod {
  ALL_TIME = 'all',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
}

export class LeaderboardQueryDto {
  @IsOptional()
  @IsEnum(SortBy)
  sort?: SortBy = SortBy.TOKENS;

  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.ALL_TIME;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value))
  offset?: number = 0;
}
