import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';

@Entity('daily_streaks')
export class DailyStreak {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the streak record' })
  id: number;

  @Column({ name: 'user_id' })
  @ApiProperty({ description: 'User ID associated with this streak' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ type: () => User, description: 'User associated with this streak' })
  user: User;

  @Column({ name: 'last_active_date', type: 'date' })
  @ApiProperty({ description: 'Last date the user was active (solved a puzzle)' })
  lastActiveDate: Date;

  @Column({ name: 'streak_count', default: 0 })
  @ApiProperty({ description: 'Current consecutive days streak count' })
  streakCount: number;

  @Column({ name: 'longest_streak', default: 0 })
  @ApiProperty({ description: 'Longest streak achieved by the user' })
  longestStreak: number;

  @Column({ name: 'last_milestone_reached', type: 'int', nullable: true })
  @ApiProperty({ description: 'Last milestone streak count that was rewarded', required: false })
  lastMilestoneReached: number | null;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the streak record was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the streak record was last updated' })
  updatedAt: Date;
} 