import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

/**
 * Streak entity for tracking daily activity. Uses snake_case column names to
 * align with the existing migration that creates the `daily_streaks` table.
 */
@Entity({ name: 'daily_streaks' })
@Index(['userId'], { unique: true })
export class Streak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @OneToOne(() => User, (user) => user.streak, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('int', { name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column('int', { name: 'longest_streak', default: 0 })
  longestStreak: number;

  // "YYYY-MM-DD" is used for safer cross-timezone streak calculations
  @Column('date', { name: 'last_activity_date', nullable: true })
  lastActivityDate?: string | null;

  // JSON array of date strings: ["2026-01-20", "2026-01-21", ...]
  @Column({ type: 'jsonb', name: 'streak_dates', default: () => "'[]'" })
  streakDates: string[];

  @Column('int', {
    name: 'last_milestone_reached',
    nullable: true,
  })
  lastMilestoneReached?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
