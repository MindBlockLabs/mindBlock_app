import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionText: string;

  @Column('simple-array') 
  options: string[];

  @Column()
  correctAnswerIndex: number;

  @Column()
  difficultyLevel: string;

  @Column({ nullable: true })
  category?: string;
}
