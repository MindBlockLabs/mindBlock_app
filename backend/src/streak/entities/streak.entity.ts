import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ example: 5 })
  @Column('int', { default: 0 })
  currentStreak: number;

  @ApiProperty({ example: 20 })
  @Column('int', { default: 0 })
  longestStreak: number;

  // "YYYY-MM-DD" is often safer than full timestamps for streak logic
  @ApiProperty({ example: '2026-01-22' })
  @Column('date', { nullable: true })
  lastActivityDate?: string;

  // JSON array of date strings: ["2026-01-20", "2026-01-21", ...]
  @ApiProperty({ example: ['2026-01-20', '2026-01-21'] })
  @Column({ type: 'json', default: () => "'[]'" })
  streakDates: string[];

  @UpdateDateColumn()
  updatedAt: Date;
}
