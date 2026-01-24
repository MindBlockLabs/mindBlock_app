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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 120 })
  name: string;

  @Column('varchar', { length: 500, nullable: true })
  description?: string;

  @Column('varchar', { length: 120, nullable: true })
  icon?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @OneToMany(() => Puzzle, (puzzle) => puzzle.categoryId)
  puzzles: Puzzle[];
}
