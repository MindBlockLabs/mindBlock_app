import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { userRole } from './enums/userRole.enum';
import { LeaderboardEntry } from 'src/leaderboard/entities/leaderboard.entity';
import { PuzzleSubmission } from 'src/puzzle/entities/puzzle-submission.entity';
import { PuzzleProgress } from 'src/puzzle/entities/puzzle-progress.entity';

/** this is the structure of the users table */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 90, nullable: false })
  firstname: string;

  @Column('varchar', { length: 90, nullable: true })
  lastname: string;

  @Column('varchar', { length: 150, nullable: false, unique: true })
  email: string;

  @Column('varchar', { length: 225, nullable: true })
  password: string;

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
  @Column('varchar', { length: 150, nullable: true })
  starknetWallet?: string;

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

  /**
   * One-to-many relation with puzzle progress records.
   */
  @OneToMany(() => PuzzleProgress, (progress) => progress.user)
  puzzleProgress: PuzzleProgress[];

  /**
   * One-to-many relation with puzzle submissions.
   */
  @OneToMany(() => PuzzleSubmission, (submission) => submission.user)
  puzzleSubmissions: PuzzleSubmission[];
}
