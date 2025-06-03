import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { PuzzleType } from './puzzle.entity';

@Entity()
export class PuzzleProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: PuzzleType })
  puzzleType: PuzzleType;

  @Column({ default: 0 })
  completedCount: number;
}