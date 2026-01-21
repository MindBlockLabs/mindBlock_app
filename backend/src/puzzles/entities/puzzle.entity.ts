import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PuzzleSubmission } from './puzzle-submission.entity';

export enum PuzzleType {
  LOGIC = 'logic',
  CODING = 'coding',
  BLOCKCHAIN = 'blockchain',
}

export enum PuzzleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('puzzle')
export class Puzzle {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Binary Tree Traversal' })
  @Column('varchar')
  title: string;

  @ApiProperty({ example: 'Find the maximum depth of a binary tree' })
  @Column('varchar')
  description: string;

  @ApiProperty({ enum: PuzzleType })
  @Column({ type: 'enum', enum: PuzzleType })
  type: PuzzleType;

  @ApiProperty({ enum: PuzzleDifficulty })
  @Column({ type: 'enum', enum: PuzzleDifficulty })
  difficulty: PuzzleDifficulty;

  @Column('varchar')
  solution: string;

  @ApiProperty({ example: true })
  @Column('boolean', { default: false })
  isPublished: boolean;

  @ApiProperty({ example: 50 })
  @Column('int', { default: 50 })
  points: number;

  @OneToMany(
    () => PuzzleSubmission,
    (submission) => submission.puzzle,
    { cascade: true },
  )
  submissions: PuzzleSubmission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
