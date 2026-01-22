import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
@Index(['userId', 'questDate'], { unique: true }) // 1 quest/day/user
@Index(['userId'])
@Index(['questDate'])
export class DailyQuest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.dailyQuests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // store date-only string to avoid timezone bugs ("YYYY-MM-DD")
  @ApiProperty({ example: '2026-01-22' })
  @Column('date')
  questDate: string;

  @ApiProperty({ example: 10 })
  @Column('int', { default: 10 })
  totalQuestions: number;

  @ApiProperty({ example: 3 })
  @Column('int', { default: 0 })
  completedQuestions: number;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @ApiProperty({ example: 25 })
  @Column('int', { default: 0 })
  pointsEarned: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;
}
