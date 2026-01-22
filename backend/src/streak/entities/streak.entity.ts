import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
@Index(['userId'], { unique: true }) // one streak row per user
export class Streak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @OneToOne(() => User, (user) => user.streak, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('int', { default: 0 })
  currentStreak: number;

  @Column('int', { default: 0 })
  longestStreak: number;

  // "YYYY-MM-DD" is often safer than full timestamps for streak logic
  @Column('date', { nullable: true })
  lastActivityDate?: string;

  // JSON array of date strings: ["2026-01-20", "2026-01-21", ...]
  @Column({ type: 'json', default: () => "'[]'" })
  streakDates: string[];

  @UpdateDateColumn()
  updatedAt: Date;
}
