import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserActivity } from './user-activity.entity';

@Entity('analytics_sessions')
@Index(['userId'])
@Index(['sessionId'])
@Index(['lastActivityAt'])
export class AnalyticsSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  userId?: string;

  @Column('uuid', { unique: true })
  sessionId: string;

  @Column('varchar', { length: 45, nullable: true })
  anonymizedIp?: string;

  @Column('text', { nullable: true })
  userAgent?: string;

  @Column('varchar', { length: 100, nullable: true })
  browser?: string;

  @Column('varchar', { length: 100, nullable: true })
  os?: string;

  @Column({
    type: 'enum',
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  })
  deviceType: string;

  @Column({
    type: 'enum',
    enum: ['web', 'mobile_web', 'pwa', 'api'],
    default: 'web',
  })
  platform: string;

  @Column('varchar', { length: 2, nullable: true })
  country?: string;

  @Column('varchar', { length: 100, nullable: true })
  city?: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column('timestamptz', { nullable: true })
  @Index()
  lastActivityAt?: Date;

  @Column('bigint', { default: 0 })
  totalDuration: number; // in milliseconds

  @Column('integer', { default: 0 })
  activityCount: number;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({
    type: 'enum',
    enum: ['opted-in', 'opted-out', 'not-set'],
    default: 'not-set',
  })
  consentStatus: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relationships
  @OneToMany(() => UserActivity, (activity) => activity.sessionId)
  activities: UserActivity[];
}
