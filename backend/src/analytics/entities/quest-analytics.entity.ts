import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Aggregated daily quest analytics.
 * One row per day containing assignment and completion counts.
 * Materialized by QuestAnalyticsRollupJob to avoid joining raw quest tables.
 */
@Entity('quest_analytics')
@Index(['date'], { unique: true })
export class QuestAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('date')
  date: string;

  @Column('int', { default: 0 })
  assignedCount: number;

  @Column('int', { default: 0 })
  completedCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
