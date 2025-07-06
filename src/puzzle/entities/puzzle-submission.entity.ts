import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';

@Entity('puzzle_submission')
export class PuzzleSubmission {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ name: 'puzzle_id' })
  @ApiProperty()
  puzzleId: number;

  @ManyToOne(() => Puzzle, { eager: true })
  @JoinColumn({ name: 'puzzle_id' })
  @ApiProperty({ type: () => Puzzle })
  puzzle: Puzzle;

  @Column({ name: 'user_id' })
  @ApiProperty()
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ type: () => User })
  user: User;

  @Column({ type: 'jsonb' })
  @ApiProperty({
    type: 'object',
    description: 'Submission data like code or answers',
    additionalProperties: true
  })
  attemptData: Record<string, any>;

  @Column()
  @ApiProperty({ description: 'Whether the submission passed or not' })
  result: boolean;

  @CreateDateColumn({ name: 'submitted_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  submittedAt: Date;
}
 