import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class PuzzleSubmission {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @ManyToOne(() => Puzzle, { eager: true })
  @ApiProperty({ type: () => Puzzle })
  puzzle: Puzzle;

  @ManyToOne(() => User, (user) => user.puzzleSubmissions, { eager: true })
  @ApiProperty({ type: () => User })
  user: User;

  @Column({ type: 'jsonb' })
  @ApiProperty({ type: 'object', description: 'Submission data like code or answers' })
  attemptData: Record<string, any>;

  @Column()
  @ApiProperty({ description: 'Whether the submission passed or not' })
  result: boolean;

  @CreateDateColumn()
  @ApiProperty({ type: String, format: 'date-time' })
  submittedAt: Date;
}
 