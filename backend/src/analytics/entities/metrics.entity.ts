import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_metrics')
@Index(['date'])
@Index(['metricType'])
export class AnalyticsMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date')
  @Index()
  date: string; // YYYY-MM-DD format

  @Column({
    type: 'enum',
    enum: [
      'dau', // Daily Active Users
      'wau', // Weekly Active Users
      'mau', // Monthly Active Users
      'session_duration_avg',
      'session_duration_median',
      'total_sessions',
      'total_activities',
      'feature_usage',
      'event_type_distribution',
      'platform_distribution',
      'device_distribution',
      'geographic_distribution',
      'retention_rate',
      'churn_rate',
    ],
  })
  metricType: string;

  @Column('jsonb')
  value: Record<string, any>;

  @Column('varchar', { length: 10, nullable: true })
  period?: string; // For weekly/monthly aggregations: '2024-W01', '2024-01'

  @Column('integer', { default: 0 })
  count: number;

  @Column('bigint', { default: 0 })
  sum?: number; // For aggregatable metrics

  @Column('jsonb', { nullable: true })
  breakdown?: Record<string, any>; // Detailed breakdown by category/type

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
