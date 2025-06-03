import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  experiencePoints: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  totalTokensEarned: number;

  @Column({ nullable: true })
  lastPuzzleSolvedAt: Date;
}