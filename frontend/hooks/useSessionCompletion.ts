import { useCallback, useEffect, useState } from 'react';
import {
  completeGameSession,
  getGameSession,
  GameSessionsApiError,
  GameSessionSummary,
} from '@/lib/api/gameSessionsApi';

interface UseSessionCompletionResult {
  session: GameSessionSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Loads a session's completion summary by ID.
 *
 * If the session isn't COMPLETED yet (e.g. the player just finished their
 * last challenge and was routed here), it first requests completion so the
 * backend can calculate and persist the final statistics. From then on it
 * simply fetches by ID, so refreshing the page always shows the same
 * persisted results instead of recomputing anything client-side.
 */
export function useSessionCompletion(
  sessionId: string | undefined,
  guestId?: string | null,
): UseSessionCompletionResult {
  const [session, setSession] = useState<GameSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      setError('No session ID was provided.');
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        let current = await getGameSession(sessionId as string, guestId);

        if (current.status !== 'COMPLETED') {
          const timezone =
            typeof Intl !== 'undefined'
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : undefined;
          current = await completeGameSession(sessionId as string, {
            guestId,
            userTimezone: timezone,
          });
        }

        if (!cancelled) setSession(current);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof GameSessionsApiError
            ? err.message
            : 'Something went wrong loading your results.';
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, guestId, reloadToken]);

  return { session, isLoading, error, refetch };
}
