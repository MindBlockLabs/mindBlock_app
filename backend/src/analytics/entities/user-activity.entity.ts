import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type EventType = 
  | 'authentication'
  | 'puzzle'
  | 'quest'
  | 'profile'
  | 'social'
  | 'achievement'
  | 'category'
  | 'other';

export type EventCategory = 
  // Authentication
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset_request'
  | 'password_reset_complete'
  // Puzzle
  | 'puzzle_started'
  | 'puzzle_submitted'
  | 'puzzle_completed'
  | 'puzzle_hint_viewed'
  | 'puzzle_skipped'
  // Quest
  | 'daily_quest_viewed'
  | 'daily_quest_progress_updated'
  | 'daily_quest_completed'
  | 'daily_quest_claimed'
  // Category
  | 'category_viewed'
  | 'category_filtered'
  | 'puzzle_list_viewed'
  // Profile
  | 'profile_updated'
  | 'profile_picture_uploaded'
  | 'preferences_updated'
  | 'privacy_settings_changed'
  // Social
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'challenge_sent'
  | 'challenge_accepted'
  | 'challenge_completed'
  // Achievement
  | 'achievement_unlocked'
  | 'points_earned'
  | 'points_redeemed'
  | 'streak_milestone_reached'
  // Other
  | 'page_view'
  | 'api_call'
  | 'error';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export type PlatformType = 'web' | 'mobile_web' | 'pwa' | 'api';
export type ConsentStatus = 'opted-in' | 'opted-out' | 'not-set';

@Entity('user_activities')
@Index(['sessionId'])
@Index(['userId'])
@Index(['eventType', 'eventCategory'])
@Index(['timestamp'])
@Index(['dataRetentionExpiry'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  userId?: string;

  @Column('uuid')
  sessionId: string;

  @Column({
    type: 'enum',
    enum: ['authentication', 'puzzle', 'quest', 'profile', 'social', 'achievement', 'category', 'other'],
  })
  eventType: EventType;

  @Column({
    type: 'enum',
    enum: [
      'login', 'logout', 'signup', 'password_reset_request', 'password_reset_complete',
      'puzzle_started', 'puzzle_submitted', 'puzzle_completed', 'puzzle_hint_viewed', 'puzzle_skipped',
      'daily_quest_viewed', 'daily_quest_progress_updated', 'daily_quest_completed', 'daily_quest_claimed',
      'category_viewed', 'category_filtered', 'puzzle_list_viewed',
      'profile_updated', 'profile_picture_uploaded', 'preferences_updated', 'privacy_settings_changed',
      'friend_request_sent', 'friend_request_accepted', 'challenge_sent', 'challenge_accepted', 'challenge_completed',
      'achievement_unlocked', 'points_earned', 'points_redeemed', 'streak_milestone_reached',
      'page_view', 'api_call', 'error',
    ],
  })
  eventCategory: EventCategory;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  @Index()
  timestamp: Date;

  @Column('bigint', { default: 0 })
  duration: number; // in milliseconds

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('varchar', { length: 100, nullable: true })
  browser?: string;

  @Column('varchar', { length: 100, nullable: true })
  os?: string;

  @Column({
    type: 'enum',
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  })
  deviceType: DeviceType;

  @Column({
    type: 'enum',
    enum: ['web', 'mobile_web', 'pwa', 'api'],
    default: 'web',
  })
  platform: PlatformType;

  @Column('varchar', { length: 2, nullable: true })
  country?: string;

  @Column('varchar', { length: 100, nullable: true })
  city?: string;

  @Column('varchar', { length: 45, nullable: true })
  anonymizedIp?: string;

  @Column('text', { nullable: true })
  userAgent?: string;

  @Column('text', { nullable: true })
  referrer?: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({
    type: 'enum',
    enum: ['opted-in', 'opted-out', 'not-set'],
    default: 'not-set',
  })
  consentStatus: ConsentStatus;

  @Column('timestamptz', { nullable: true })
  dataRetentionExpiry?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
