import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('daily_streaks')
export class DailyStreak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ name: 'last_active_date', type: 'date' })
  lastActiveDate: Date;

  @Column({ name: 'streak_count', default: 0 })
  streakCount: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}