import { IsEnum, IsOptional, IsISO8601, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeFilter } from '../../timefilter/timefilter.enums/timefilter.enum';

export class GetAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: TimeFilter })
  @IsOptional()
  @IsEnum(TimeFilter)
  timeFilter?: TimeFilter;

  @ApiPropertyOptional({
    type: String,
    description: 'Start date in ISO format',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ type: String, description: 'End date in ISO format' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by session ID (UUID)' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
