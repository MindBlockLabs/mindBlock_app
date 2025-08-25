import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { PuzzleType } from '../enums/puzzle-type.enum';

@Entity('puzzle_progress')
export class PuzzleProgress {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ name: 'user_id' })
  @ApiProperty()
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ type: () => User })
  user: User;

  @Column({ name: 'puzzle_type', type: 'enum', enum: PuzzleType })
  @ApiProperty({ enum: PuzzleType })
  puzzleType: PuzzleType;

  @Column({ name: 'completed_count', default: 0 })
  @ApiProperty({ description: 'Number of puzzles completed of this type' })
  completedCount: number;

  @Column({ default: 0 })
  @ApiProperty({ description: 'Total puzzles available of this type' })
  total: number;
}
