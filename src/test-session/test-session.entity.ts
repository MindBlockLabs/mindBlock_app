import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class TestSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column('simple-array') 
  questionIds: number[];

  @CreateDateColumn()
  createdAt: Date;
}
