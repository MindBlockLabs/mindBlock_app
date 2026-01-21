import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';
import { User } from '../../users/user.entity';

@Entity('puzzle_submission')
export class PuzzleSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: { answer: 'class Solution: def maxDepth(root):' } })
  @Column('jsonb')
  attemptData: Record<string, any>;

  @ApiProperty({ example: true })
  @Column('boolean')
  result: boolean;

  @ApiProperty({ example: 50 })
  @Column('int', { default: 0 })
  pointsEarned: number;

  @CreateDateColumn()
  submittedAt: Date;

  @ManyToOne(() => Puzzle, (puzzle) => puzzle.submissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;

  @Column('int', { nullable: true })
  puzzleId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('int', { nullable: true })
  userId: string;
}
