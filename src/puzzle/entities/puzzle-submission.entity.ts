import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Puzzle } from 'src/puzzle/entities/puzzle.entity';

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
  selectedAnswer?: string;

  @Column({ default: false })
  skipped: boolean;

  @CreateDateColumn()
  createdAt: Date;
}