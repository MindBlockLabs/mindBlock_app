import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PuzzleSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  puzzleId: string;

  @Column({ type: 'jsonb' })
  attemptData: any;

  @Column()
  result: boolean;

  @Column()
  submittedAt: Date;
}