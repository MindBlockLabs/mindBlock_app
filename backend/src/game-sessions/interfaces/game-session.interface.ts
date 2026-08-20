import { GameSessionStatus } from '../enums/game-session-status.enum';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';

/**
 * Describes the state machine transition graph.
 * Key = current status, Value = set of valid next statuses.
 */
export type SessionTransitionMap = Readonly<
  Record<GameSessionStatus, ReadonlyArray<GameSessionStatus>>
>;

/**
 * Payload used internally when requesting a status transition.
 */
export interface ISessionTransitionRequest {
  /** The desired next status. */
  targetStatus: GameSessionStatus;
  /** Final score – only relevant when moving to COMPLETED. */
  score?: number;
  /** XP earned – only relevant when moving to COMPLETED. */
  xpEarned?: number;
}

/**
 * The resolved owner for a session.
 * Exactly one of userId or guestId must be non-null.
 */
export interface ISessionOwner {
  userId: string | null;
  guestId: string | null;
}

/**
 * Lightweight session summary returned in list endpoints.
 */
export interface IGameSessionSummary {
  id: string;
  status: GameSessionStatus;
  difficulty: PuzzleDifficulty | null;
  score: number;
  challengeCount: number;
  currentChallenge: number;
  startedAt: Date | null;
  completedAt: Date | null;
}
