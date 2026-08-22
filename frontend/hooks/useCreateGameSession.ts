import { useState, useCallback } from 'react';
import {
  createGameSession,
  GameSessionApiError,
  GameSessionResponse,
} from '@/lib/api/gameSessionApi';
import { getPuzzles } from '@/lib/api/puzzleApi';
import { useAuth } from './useAuth';

/**
 * Configuration derived from completed onboarding preferences.
 */
export interface GameSessionConfig {
  /** Mapped challenge level, e.g. 'beginner' | 'intermediate' | 'advanced' | 'expert' */
  challengeLevel: string;
  /** Array of selected challenge type IDs, e.g. ['CODING', 'LOGIC'] */
  challengeTypes: string[];
}

export interface UseCreateGameSessionResult {
  createSession: (config: GameSessionConfig) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() when available (modern browsers + Node 15+),
 * falling back to a polyfill.
 */
function generateUUID(): string {
  if (
    typeof window !== 'undefined' &&
    typeof window.crypto?.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  // Polyfill for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Maps frontend challenge level ID to the puzzle difficulty query param.
 *
 * The puzzle API expects difficulty in UPPERCASE; we pass through what the
 * backend accepts. ADAPTIVE falls back to BEGINNER difficulty so the player
 * starts from an appropriate baseline.
 */
function toPuzzleDifficulty(challengeLevel: string): string {
  const mapping: Record<string, string> = {
    beginner: 'BEGINNER',
    intermediate: 'INTERMEDIATE',
    advanced: 'ADVANCED',
    expert: 'EXPERT',
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    EXPERT: 'EXPERT',
    ADAPTIVE: 'BEGINNER',
  };
  return mapping[challengeLevel] ?? 'BEGINNER';
}

/**
 * Hook for creating a game session after onboarding completes.
 *
 * Flow:
 *  1. Generate a client-side UUID as the sessionId.
 *  2. Fetch the first matching puzzle using the player's difficulty preference.
 *  3. POST /challenge-attempts with { userId, challengeId, sessionId }.
 *  4. Return the sessionId so it can be forwarded to the gameplay page.
 *
 * The sessionId is also persisted to localStorage so gameplay pages can
 * retrieve it without URL coupling.
 */
export function useCreateGameSession(): UseCreateGameSessionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createSession = useCallback(
    async (config: GameSessionConfig): Promise<string | null> => {
      if (!user?.id) {
        setError('User not authenticated. Cannot create game session.');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const sessionId = generateUUID();
        const difficulty = toPuzzleDifficulty(config.challengeLevel);

        // Fetch the first puzzle matching the player's difficulty so we have
        // a real challengeId for the backend.
        const puzzles = await getPuzzles({ difficulty, limit: 1 });

        if (!puzzles || puzzles.length === 0) {
          // Fallback: try without difficulty filter
          const fallbackPuzzles = await getPuzzles({ limit: 1 });
          if (!fallbackPuzzles || fallbackPuzzles.length === 0) {
            setError('No challenges available to start a session.');
            return null;
          }

          const result = await createGameSession({
            challengeId: fallbackPuzzles[0].id,
            sessionId,
          });

          persistSession(sessionId, result, config);
          return sessionId;
        }

        const result = await createGameSession({
          challengeId: puzzles[0].id,
          sessionId,
        });

        persistSession(sessionId, result, config);
        return sessionId;
      } catch (err) {
        if (err instanceof GameSessionApiError) {
          setError(err.message);
        } else {
          setError('Failed to create game session. Please try again.');
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { createSession, isLoading, error, clearError };
}

/**
 * Persists the active game session to localStorage so the gameplay page can
 * pick it up even after a redirect.
 */
function persistSession(
  sessionId: string,
  result: GameSessionResponse,
  config: GameSessionConfig,
): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionData = {
      sessionId,
      attemptId: result.id,
      challengeId: result.challengeId,
      challengeLevel: config.challengeLevel,
      challengeTypes: config.challengeTypes,
      startedAt: result.startedAt,
    };
    localStorage.setItem('activeGameSession', JSON.stringify(sessionData));
  } catch {
    // localStorage may be unavailable in certain environments; ignore silently.
  }
}
