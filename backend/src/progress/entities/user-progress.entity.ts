import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: false })
  puzzleId: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  categoryId: string;

  @Column({ type: 'boolean', nullable: false })
  isCorrect: boolean;

  @Column({ type: 'text', nullable: false })
  userAnswer: string;

  @Column({ type: 'integer', nullable: false })
  pointsEarned: number;

  @Column({ name: 'time_spent', type: 'integer', nullable: false })
  timeSpent: number; // seconds

  @CreateDateColumn({ name: 'attempted_at' })
  @Index()
  attemptedAt: Date;
}
