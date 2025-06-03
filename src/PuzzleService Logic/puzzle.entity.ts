import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

@Entity()
export class Puzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'jsonb' })
  solution: any;

  @Column({ type: 'enum', enum: PuzzleType })
  type: PuzzleType;

  @Column({ type: 'enum', enum: PuzzleDifficulty })
  difficulty: PuzzleDifficulty;
}