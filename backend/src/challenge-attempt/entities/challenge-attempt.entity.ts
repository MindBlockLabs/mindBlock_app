import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { AttemptStatus } from '../enums/attempt-status.enum';

/**
 * ChallengeAttempt tracks a player's interaction with a single challenge/puzzle.
 *
 * Each attempt belongs to:
 * - A specific user (userId)
 * - A specific challenge/puzzle (challengeId)
 * - Optionally a game session (sessionId) for multiplayer / quest grouping
 *
 * Lifecycle states: STARTED → SUBMITTED → CORRECT | INCORRECT | EXPIRED
 */
@Entity('challenge_attempts')
@Index(['userId', 'challengeId'])
@Index(['sessionId'])
@Index(['status'])
@Index(['userId', 'startedAt'])
export class ChallengeAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Optional session identifier for grouping attempts (e.g. a daily quest
   * run, a multiplayer lobby, or a timed training session).
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId?: string;

  /**
   * FK to the user who made this attempt.
   *
   * Not a `uuid` column: `User.id` is a plain auto-increment integer
   * (`@PrimaryGeneratedColumn()`, no `'uuid'` strategy) despite being
   * TS-typed as `string` on the `User` entity — this column matches that
   * real underlying type rather than the `User` entity's misleading TS
   * annotation.
   */
  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** FK to the puzzle / challenge that was attempted. */
  @Column({ type: 'uuid' })
  challengeId: string;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'challengeId' })
  challenge: Puzzle;

  /** The answer the player submitted (null until submitted). */
  @Column({ type: 'text', nullable: true })
  answer?: string;

  /** Current lifecycle state of the attempt. */
  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.STARTED,
  })
  status: AttemptStatus;

  /** Score awarded for this attempt (0 until graded). */
  @Column({ type: 'int', default: 0 })
  score: number;

  /**
   * Seconds elapsed from startedAt to submittedAt.
   * Updated automatically on submission.
   */
  @Column({ type: 'int', default: 0 })
  timeSpent: number;

  /** Number of hints the player has consumed for this attempt. */
  @Column({ type: 'int', default: 0 })
  hintsUsed: number;

  /** Whether the player chose to reveal the solution. */
  @Column({ type: 'boolean', default: false })
  solutionRevealed: boolean;

  /** When the attempt was created / player started the challenge. */
  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  /** When the player submitted their answer (null until submitted). */
  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  /**
   * The puzzle selected as "what's next" at submit time, persisted so a
   * duplicate/replayed submit returns the same next challenge instead of
   * re-randomizing it.
   */
  @Column({ type: 'uuid', nullable: true })
  nextChallengeId?: string;

  /** Whether this submission completed the session (target reached or challenge pool exhausted). */
  @Column({ type: 'boolean', default: false })
  sessionCompleted: boolean;

  /** XP actually granted for this attempt (0 if incorrect), cached for idempotent replay. */
  @Column({ type: 'int', nullable: true })
  xpAwarded?: number;
}
