import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PuzzleType } from '../enums/puzzle-type.enum';
import { PuzzleDifficulty } from '../enums/puzzle-difficulty.enum';


@Entity()
export class Puzzle {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the puzzle' })
  id: number;

  @Column()
  @ApiProperty({ description: 'Title of the puzzle' })
  title: string;

  @Column()
  @ApiProperty({ description: 'Description or content of the puzzle' })
  description: string;

  @Column({ type: 'enum', enum: PuzzleType })
  @ApiProperty({ enum: PuzzleType, description: 'Type of puzzle' })
  type: PuzzleType;

  @Column({ type: 'enum', enum: PuzzleDifficulty })
  @ApiProperty({ enum: PuzzleDifficulty, description: 'Difficulty level of the puzzle' })
  difficulty: PuzzleDifficulty;

  @Column()
  @ApiProperty({ description: 'Expected solution to the puzzle' })
  solution: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Publication status of the puzzle', default: false })
  isPublished: boolean;
}
