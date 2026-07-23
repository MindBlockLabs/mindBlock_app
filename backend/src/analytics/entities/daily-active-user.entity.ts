import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * One row per user who was active on a given day.
 *
 * Populated by the nightly `DailyActiveUsersRollupJob` from raw
 * `AnalyticsEvent` rows, so `GetDauProvider` can compute DAU with a cheap
 * `COUNT` instead of a `SELECT DISTINCT` scan over raw events.
 */
@Entity('daily_active_users')
@Unique(['date', 'userId'])
export class DailyActiveUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
