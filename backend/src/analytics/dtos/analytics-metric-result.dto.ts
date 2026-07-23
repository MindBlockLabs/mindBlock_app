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

/** Risk band derived from `riskScore`. `null` when there is no usable baseline. */
export type ChurnRiskBand = 'none' | 'low' | 'medium' | 'high';

export class ChurnRiskDataPoint {
  @ApiProperty({
    example: 'user-123',
    description: 'User the score belongs to',
  })
  userId: string;

  @ApiProperty({
    example: 78,
    nullable: true,
    description:
      'Churn risk 0-100. Null when the user has too little history for a ' +
      'baseline — deliberately not 0, which would read as "safe".',
  })
  riskScore: number | null;

  @ApiProperty({
    example: 'high',
    nullable: true,
    enum: ['none', 'low', 'medium', 'high'],
  })
  riskBand: ChurnRiskBand | null;

  @ApiProperty({
    example: 12.5,
    description: 'Mean events per baseline bucket',
  })
  baselineMean: number;

  @ApiProperty({
    example: 2.1,
    description:
      'Std deviation of the baseline buckets. The drop is scored against this, ' +
      'so a naturally spiky user needs a bigger drop to flag.',
  })
  baselineStdDev: number;

  @ApiProperty({
    example: 9,
    description: 'Baseline buckets backing the score',
  })
  baselineBuckets: number;

  @ApiProperty({ example: 1, description: 'Event count in the recent bucket' })
  recentCount: number;

  @ApiProperty({
    example: 0,
    description:
      'Trailing buckets with no activity, most recent included. Reported but ' +
      'not scored: this measures the drop, not sustained dormancy.',
  })
  consecutiveSilentBuckets: number;

  @ApiProperty({
    example: 0.92,
    nullable: true,
    description: 'Proportional drop from the baseline mean, for readability.',
  })
  dropRatio: number | null;

  @ApiProperty({ example: false, description: 'History too short to score' })
  insufficientBaseline: boolean;
}

export class AnalyticsMetricResult<T = RetentionDataPoint> {
  @ApiProperty({ example: '2024-01-01', description: 'Start of queried range' })
  startDate: string;

  @ApiProperty({ example: '2024-01-31', description: 'End of queried range' })
  endDate: string;

  @ApiProperty({ example: 'day', description: 'Granularity used' })
  granularity: string;

  @ApiProperty({ type: [RetentionDataPoint] })
  data: T[];

  @ApiProperty({ example: 15, description: 'Total rows returned' })
  total: number;
}
