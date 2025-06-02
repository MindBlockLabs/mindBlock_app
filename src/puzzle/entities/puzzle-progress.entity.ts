import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { PuzzleType } from '../enums/puzzle-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';

@Entity()
export class PuzzleProgress {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @ManyToOne(() => User, (user) => user.puzzleProgress)
  @ApiProperty({ type: () => User })
  user: User;

  @Column({
    type: 'enum',
    enum: PuzzleType,
  })
  @ApiProperty({ enum: PuzzleType })
  puzzleType: PuzzleType;

  @Column('int', { default: 0 })
  @ApiProperty()
  completedCount: number;

  @Column('int', { default: 0 })
  @ApiProperty()
  total: number;
}
