import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsString()
  @IsNotEmpty()
  event?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}