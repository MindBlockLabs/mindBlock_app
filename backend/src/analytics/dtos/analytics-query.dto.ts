import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { DateRangeDto } from './date-range.dto';

export enum ExportMetric {
  RETENTION = 'retention',
  ONBOARDING_FUNNEL = 'onboarding_funnel',
  PUZZLE_STATS = 'puzzle_stats',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class AnalyticsQueryDto extends DateRangeDto {
  // Event tracking fields
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  event?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // Export fields
  @ApiProperty({
    enum: ExportMetric,
    example: ExportMetric.RETENTION,
    description: 'Which analytics metric to export',
  })
  @IsEnum(ExportMetric)
  metric?: ExportMetric;

  @ApiPropertyOptional({
    enum: ExportFormat,
    example: ExportFormat.CSV,
    default: ExportFormat.CSV,
    description: 'Output format for the export',
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
}