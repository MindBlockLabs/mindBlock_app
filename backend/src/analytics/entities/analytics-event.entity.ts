import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Raw analytics event row.
 *
 * Indexes exist to serve two distinct access patterns:
 *  - `['timestamp', 'userId']` — range scan over a reporting window, grouped by
 *    user (churn risk, and any future per-user rollup job).
 *  - `['userId', 'timestamp']` — a single user's history, ordered in time.
 */
@Entity('analytics_events')
@Index(['timestamp', 'userId'])
@Index(['userId', 'timestamp'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  entityId: string;

  @Column({ type: 'json', nullable: true })
  payload?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
