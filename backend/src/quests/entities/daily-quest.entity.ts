import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { DailyQuestPuzzle } from './daily-quest-puzzle.entity';
import { UserProgress } from '../../progress/entities/progress.entity';

@Entity()
@Index(['userId', 'questDate'], { unique: true }) // 1 quest/day/user
@Index(['userId'])
@Index(['questDate'])
export class DailyQuest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.dailyQuests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // store date-only string to avoid timezone bugs ("YYYY-MM-DD")
  @Column('date')
  questDate: string;

  @Column('int', { default: 10 })
  totalQuestions: number;

  @Column('int', { default: 0 })
  completedQuestions: number;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column('int', { default: 0 })
  pointsEarned: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @OneToMany(() => DailyQuestPuzzle, (questPuzzle) => questPuzzle.dailyQuest)
  questPuzzles: DailyQuestPuzzle[];

  @OneToMany(() => UserProgress, (progress) => progress.dailyQuest)
  progressRecords: UserProgress[];
}
