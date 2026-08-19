import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameSessionStatus } from '../enums/game-session-status.enum';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';
import { User } from '../../users/user.entity';

/**
 * GameSession represents a complete gameplay session for a user.
 *
 * A session groups a set of challenges together under a single context
 * (e.g. a training session, a timed run, or a themed quiz).
 *
 * Lifecycle:
 *   CREATED → ACTIVE → PAUSED → ACTIVE → COMPLETED
 *                              → EXPIRED
 *                              → ABANDONED
 */
@Entity('game_sessions')
@Index(['userId', 'status'])
@Index(['userId', 'startedAt'])
@Index(['status'])
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The authenticated user who owns this session.
   * Null for guest sessions (guestId is set instead).
   */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false, nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /**
   * Optional guest identifier for unauthenticated sessions.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  guestId: string | null;

  /** Current lifecycle state of the session. */
  @Column({
    type: 'enum',
    enum: GameSessionStatus,
    default: GameSessionStatus.CREATED,
  })
  status: GameSessionStatus;

  /** Difficulty level chosen for this session. */
  @Column({
    type: 'enum',
    enum: PuzzleDifficulty,
    nullable: true,
  })
  difficulty: PuzzleDifficulty | null;

  /**
   * Category slugs / IDs the user selected for this session.
   * Stored as a simple comma-separated list for portability.
   */
  @Column({ type: 'simple-array', nullable: true })
  selectedCategories: string[] | null;

  /** Total number of challenges in this session. */
  @Column({ type: 'int', default: 0 })
  challengeCount: number;

  /** Zero-based index of the challenge currently being presented. */
  @Column({ type: 'int', default: 0 })
  currentChallenge: number;

  /** Accumulated score across all challenges in this session. */
  @Column({ type: 'int', default: 0 })
  score: number;

  /** XP earned by the user for completing this session. */
  @Column({ type: 'int', default: 0 })
  xpEarned: number;

  /** Timestamp when the session transitioned from CREATED to ACTIVE. */
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  /** Timestamp when the session reached a terminal state (COMPLETED / EXPIRED / ABANDONED). */
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
