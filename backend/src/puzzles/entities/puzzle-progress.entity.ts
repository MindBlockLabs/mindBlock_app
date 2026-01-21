import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PuzzleType } from './puzzle.entity';
import { User } from '../../users/user.entity';

@Entity('puzzle_progress')
export class PuzzleProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: PuzzleType })
  @Column({ type: 'enum', enum: PuzzleType })
  puzzleType: PuzzleType;

  @ApiProperty({ example: 5 })
  @Column('int', { default: 0 })
  completedCount: number;

  @ApiProperty({ example: 20 })
  @Column('int', { default: 0 })
  total: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('int', { nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
