/**
 * Game Sessions API
 *
 * Thin client for the backend's `/game-sessions` REST endpoints:
 *   GET   /game-sessions/:id           - fetch a session (with computed
 *                                         completion summary once COMPLETED)
 *   PATCH /game-sessions/:id/status    - transition a session's status
 *
 * All completion statistics (score, xp, accuracy, category performance,
 * streak, reward eligibility) are calculated server-side. This client only
 * reads and displays them; it never computes them on the frontend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export type GameSessionStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'ABANDONED';

export interface CategoryPerformanceEntry {
  categoryId: string;
  categoryName: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface GameSessionSummary {
  id: string;
  userId: string | null;
  guestId: string | null;
  status: GameSessionStatus;
  difficulty: string | null;
  selectedCategories: string[] | null;
  challengeCount: number;
  currentChallenge: number;
  score: number;
  xpEarned: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  accuracy: number | null;
  timeSpentSeconds: number | null;
  categoryPerformance: CategoryPerformanceEntry[] | null;
  previousStreak: number | null;
  currentStreak: number | null;
  rewardEligible: boolean | null;
  rewardReason: string | null;
}

export class GameSessionsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'GameSessionsApiError';
  }
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new GameSessionsApiError(
      (errorData as { message?: string }).message ||
        `Request failed with status ${response.status}`,
      response.status,
      errorData,
    );
  }
  return (await response.json()) as T;
}

/**
 * Fetches a single game session, including its completion summary if the
 * session has reached COMPLETED. Safe to call repeatedly (e.g. on page
 * refresh) since results are persisted server-side.
 */
export async function getGameSession(
  id: string,
  guestId?: string | null,
): Promise<GameSessionSummary> {
  const query = guestId ? `?guestId=${encodeURIComponent(guestId)}` : '';
  try {
    const response = await fetch(`${API_BASE_URL}/game-sessions/${id}${query}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return await handleResponse<GameSessionSummary>(response);
  } catch (error) {
    if (error instanceof GameSessionsApiError) throw error;
    throw new GameSessionsApiError(
      'Unable to load session results. Please check your connection.',
    );
  }
}

/**
 * Marks a session as COMPLETED. The backend calculates all final
 * statistics server-side from persisted challenge attempts; the optional
 * score/xpEarned fields here are only used as a fallback when the session
 * has no tracked attempts.
 */
export async function completeGameSession(
  id: string,
  options?: { guestId?: string | null; userTimezone?: string },
): Promise<GameSessionSummary> {
  const guestId = options?.guestId;
  const query = guestId ? `?guestId=${encodeURIComponent(guestId)}` : '';
  try {
    const response = await fetch(
      `${API_BASE_URL}/game-sessions/${id}/status${query}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          status: 'COMPLETED',
          userTimezone: options?.userTimezone,
        }),
      },
    );
    return await handleResponse<GameSessionSummary>(response);
  } catch (error) {
    if (error instanceof GameSessionsApiError) throw error;
    throw new GameSessionsApiError(
      'Unable to complete the session. Please check your connection.',
    );
  }
}
