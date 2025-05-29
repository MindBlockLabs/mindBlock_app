import { LeaderboardEntry } from 'src/leaderboard/entities/leaderboard.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum BadgeType {
  PUZZLE_MASTER = 'puzzle_master',
  SPEED_SOLVER = 'speed_solver',
  DAILY_PLAYER = 'daily_player',
  STREAK_KEEPER = 'streak_keeper',
  TOKEN_COLLECTOR = 'token_collector',
  ROOKIE = 'rookie',
  VETERAN = 'veteran',
  CHAMPION = 'champion',
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: BadgeType,
  })
  type: BadgeType;

  @Column({
    type: 'enum',
    enum: BadgeRarity,
    default: BadgeRarity.COMMON,
  })
  rarity: BadgeRarity;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  color?: string;

  // Requirements to earn this badge
  @Column({ default: 0 })
  requiredPuzzles: number;

  @Column({ default: 0 })
  requiredScore: number;

  @Column({ default: 0 })
  requiredTokens: number;

  @Column({ default: 0 })
  requiredStreak: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => LeaderboardEntry, (entry) => entry.badge)
  leaderboardEntries: LeaderboardEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
