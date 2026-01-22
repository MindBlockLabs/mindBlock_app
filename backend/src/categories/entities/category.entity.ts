import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Entity()
@Index(['name'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Algorithms' })
  @Column('varchar', { length: 120 })
  name: string;

  @ApiProperty({ example: 'Sharpen your algo instincts' })
  @Column('varchar', { length: 500, nullable: true })
  description?: string;

  @ApiProperty({ example: 'mdi:brain' })
  @Column('varchar', { length: 120, nullable: true })
  icon?: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @OneToMany(() => Puzzle, (puzzle) => puzzle.categoryId)
  puzzles: Puzzle[];
}
