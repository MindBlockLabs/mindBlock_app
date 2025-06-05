import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventType: string;

  @Column()
  userId: number;

  @Column('jsonb')
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}