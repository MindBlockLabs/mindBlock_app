import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Badge } from '../../badge/entities/badge.entity';
import { User } from '../../users/user.entity';

@Entity('leaderboard_entries')
@Index(['tokens', 'createdAt'])
@Index(['score', 'createdAt'])
@Index(['puzzlesCompleted', 'createdAt'])
export class LeaderboardEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ default: 0 })
  puzzlesCompleted: number;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  tokens: number;

  @ManyToOne(() => Badge, { eager: true, nullable: true })
  badge: Badge;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
