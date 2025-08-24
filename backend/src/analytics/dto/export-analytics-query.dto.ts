import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetAnalyticsQueryDto } from './get-analytics-query.dto';

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export class ExportAnalyticsQueryDto extends GetAnalyticsQueryDto {
  @ApiPropertyOptional({ 
    enum: ExportFormat, 
    default: ExportFormat.CSV,
    description: 'Export format (csv or pdf)' 
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
} 