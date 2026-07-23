import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { DateRangeDto } from './date-range.dto';

export enum ExportMetric {
  RETENTION = 'retention',
  ONBOARDING_FUNNEL = 'onboarding_funnel',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class AnalyticsQueryDto extends DateRangeDto {
  @ApiProperty({
    enum: ExportMetric,
    example: ExportMetric.RETENTION,
    description: 'Which analytics metric to export',
  })
  @IsEnum(ExportMetric)
  metric: ExportMetric;

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
