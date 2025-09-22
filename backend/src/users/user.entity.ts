import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { userRole } from './enums/userRole.enum';
import { ChallengeLevel } from './enums/challengeLevel.enum';
import { ChallengeType } from './enums/challengeType.enum';
import { LeaderboardEntry } from '../leaderboard/entities/leaderboard.entity';
import { Badge } from '../badge/entities/badge.entity';
import { Achievement } from '../achievement/entities/achievement.entity';
import { Exclude } from 'class-transformer';

/** this is the structure of the users table */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('varchar', { length: 150, nullable: true })
  username?: string;

  @Column('varchar', { length: 150 })
  fullname?: string;

  @Column('varchar', { length: 150, nullable: true, unique: true })
  email?: string;

  @Exclude()
  @Column('varchar', { length: 225, nullable: true })
  password?: string;

  /**
   * Role of the user.
   */
  @ApiProperty({
    enum: userRole,
    example: userRole.USER,
    description: 'Role of the user',
  })
  @Column({ type: 'enum', enum: userRole, default: userRole.USER })
  userRole?: userRole;

  /**
   * Google ID (if signed up with Google).
   */
  @ApiProperty({
    example: 'google-unique-id',
    description: 'Google ID of the user',
    required: false,
  })
  @Column('varchar', { length: 225, nullable: true })
  googleId?: string;

  @OneToMany(() => LeaderboardEntry, (entry) => entry.user)
  leaderboardEntries: LeaderboardEntry[];

  /**
   * Starknet Wallet (optional).
   */
  @ApiProperty({ example: '0xabc...', required: false })
  @Column('varchar', { length: 150, nullable: true, unique: true })
  stellarWallet?: string;

  @ManyToOne(() => Badge, (badge) => badge.user, {
    nullable: true,
    cascade: ['insert', 'update'],
  })
  badge: Badge;

  /**
   * User XP points for puzzle solving.
   */
  @ApiProperty({ example: 120 })
  @Column('int', { default: 0 })
  xp: number;

  /**
   * User level based on XP.
   */
  @ApiProperty({ example: 3 })
  @Column('int', { default: 1 })
  level: number;

  @ApiProperty({ example: 10 })
  @Column({ default: 0 })
  puzzlesCompleted: number;

  @ApiProperty({ example: 100 })
  @Column({ type: 'int', default: 0 })
  tokens: number;

  @ManyToMany(() => Achievement, (achievement) => achievement.user, {
    cascade: true,
  })
  @JoinTable()
  achievements: Achievement[];


  @Column({
    type: 'enum', enum: ChallengeLevel, nullable: true, default: ChallengeLevel.BEGINNER
  })
  challengeLevel?: ChallengeLevel;

  @Column('simple-array', { nullable: true, default: ChallengeType.CODING })
  challengeTypes?: string[];

  @Column('varchar', { length: 100, nullable: true })
  referralSource?: string;

  @Column('varchar', { length: 50, nullable: true })
  ageGroup?: string;

  /**
   * One-to-many relation with puzzle progress records.
   */
  // @OneToMany(() => PuzzleProgress, (progress) => progress.user)
  // puzzleProgress: PuzzleProgress[];

  /**
   * One-to-many relation with puzzle submissions.
   */
  // @OneToMany(() => PuzzleSubmission, (submission) => submission.user)
  // puzzleSubmissions: PuzzleSubmission[];
}
