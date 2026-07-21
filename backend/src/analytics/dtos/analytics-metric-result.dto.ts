import { ApiProperty } from '@nestjs/swagger';

export class RetentionDataPoint {
  @ApiProperty({ example: '2024-01-15', description: 'Cohort date (YYYY-MM-DD)' })
  cohortDate: string;

  @ApiProperty({ example: 200, description: 'Total users in this cohort' })
  cohortSize: number;

  @ApiProperty({ example: 65.5, description: 'Day-1 retention %', nullable: true })
  day1RetentionPct: number | null;

  @ApiProperty({ example: 42.0, description: 'Day-7 retention %', nullable: true })
  day7RetentionPct: number | null;

  @ApiProperty({ example: 28.5, description: 'Day-30 retention %', nullable: true })
  day30RetentionPct: number | null;
}

export class AnalyticsMetricResult {
  @ApiProperty({ example: '2024-01-01', description: 'Start of queried range' })
  startDate: string;

  @ApiProperty({ example: '2024-01-31', description: 'End of queried range' })
  endDate: string;

  @ApiProperty({ example: 'day', description: 'Granularity used' })
  granularity: string;

  @ApiProperty({ type: [RetentionDataPoint] })
  data: RetentionDataPoint[];

  @ApiProperty({ example: 15, description: 'Total cohort rows returned' })
  total: number;
}