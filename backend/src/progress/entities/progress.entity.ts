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

@Entity()
@Index(['userId', 'attemptedAt'])
@Index(['userId', 'puzzleId'])
@Index(['categoryId'])
export class UserProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.progressRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  puzzleId: number;

  @ManyToOne(() => Puzzle, (puzzle) => puzzle.progressRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column('varchar', { length: 50, nullable: true })
  userAnswer?: string;

  @Column('int', { default: 0 })
  pointsEarned: number;

  // seconds
  @Column('int', { default: 0 })
  timeSpent: number;

  @Column({ type: 'datetime' })
  attemptedAt: Date;
}
