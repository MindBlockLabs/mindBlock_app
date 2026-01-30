import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { Category } from '../../categories/entities/category.entity';
import { DailyQuest } from '../../quests/entities/daily-quest.entity';

@Entity()
@Index(['userId', 'attemptedAt'])
@Index(['userId', 'puzzleId'])
@Index(['categoryId'])
@Index(['dailyQuestId'])
export class UserProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.progressRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  puzzleId: string;

  @ManyToOne(() => Puzzle, (puzzle) => puzzle.progressRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  dailyQuestId?: number;

  @ManyToOne(() => DailyQuest, (quest) => quest.progressRecords, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'dailyQuestId' })
  dailyQuest?: DailyQuest;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column('varchar', { length: 50, nullable: true })
  userAnswer?: string;

  @Column('int', { default: 0 })
  pointsEarned: number;

  // seconds
  @Column('int', { default: 0 })
  timeSpent: number;

  @Column({ type: 'timestamptz' })
  attemptedAt: Date;
}
