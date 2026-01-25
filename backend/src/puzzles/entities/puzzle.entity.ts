import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';
import { UserProgress } from '../../progress/entities/progress.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('puzzles')
export class Puzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  question: string;

  @Column({ type: 'text', array: true, nullable: false })
  options: string[];

  @Column({ type: 'text', nullable: false })
  correctAnswer: string;

  @Column({
    type: 'enum',
    enum: PuzzleDifficulty,
    nullable: false,
  })
  @Index()
  difficulty: PuzzleDifficulty;
  
  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  categoryId: string;

  @Column({ type: 'integer', nullable: false })
  points: number;

  @Column({ name: 'time_limit', type: 'integer', nullable: false })
  timeLimit: number; // in seconds

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => UserProgress, (progress) => progress.puzzle)
  progressRecords: UserProgress[];
}
