import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Puzzle } from '../../puzzle/entities/puzzle.entity';

@Entity('puzzle_submissions')
@Unique(['user', 'puzzle'])
export class PuzzleSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Puzzle, { eager: true })
  puzzle: Puzzle;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ nullable: true })
  solution?: string;

  @Column({ default: false })
  skipped: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
