import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Pre-aggregated retention cohort row.
 *
 * Each row represents a single acquisition cohort (users who first appeared on
 * `cohortDate`) and records how many of those users returned on day 1, day 7,
 * and day 30. Populated by a nightly aggregation job rather than computed
 * on-the-fly from raw `AnalyticsEvent` rows.
 */
@Entity('retention_cohorts')
@Index(['cohortDate'])
export class RetentionCohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  cohortDate: string;

  @Column({ type: 'int', default: 0 })
  cohortSize: number;

  @Column({ type: 'int', default: 0 })
  retainedDay1: number;

  @Column({ type: 'int', default: 0 })
  retainedDay7: number;

  @Column({ type: 'int', default: 0 })
  retainedDay30: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}