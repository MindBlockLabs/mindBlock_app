import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @ApiProperty({ example: 'B' })
  @Column('varchar', { length: 50, nullable: true })
  userAnswer?: string;

  @ApiProperty({ example: 10 })
  @Column('int', { default: 0 })
  pointsEarned: number;

  // seconds
  @ApiProperty({ example: 18 })
  @Column('int', { default: 0 })
  timeSpent: number;

  @ApiProperty({ example: '2026-01-22T10:20:30.000Z' })
  @Column({ type: 'timestamptz' })
  attemptedAt: Date;
}
