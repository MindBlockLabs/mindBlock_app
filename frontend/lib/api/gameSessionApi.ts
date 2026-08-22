/**
 * Game Session API
 *
 * Wraps POST /challenge-attempts to create a new game session entry.
 * A game session groups challenge attempts under a shared sessionId (UUID).
 *
 * The backend requires a valid challengeId (UUID of an existing puzzle) and
 * the generated sessionId. `userId` is intentionally NOT sent — the backend
 * derives the authenticated user from the JWT (see
 * `ChallengeAttemptController`/`CreateChallengeAttemptDto`), and the
 * ValidationPipe rejects unknown body fields
 * (`forbidNonWhitelisted: true`), so sending a client-supplied userId would
 * now 400.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface CreateGameSessionDto {
  /** UUID of the first challenge to attempt (required by the backend) */
  challengeId: string;
  /** Client-generated UUID that groups all attempts in this session */
  sessionId: string;
}

export interface GameSessionResponse {
  id: string;
  userId: string;
  challengeId: string;
  sessionId: string;
  status: string;
  score: number;
  startedAt: string;
}

export class GameSessionApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'GameSessionApiError';
  }
}

/**
 * Creates a new game session attempt on the backend.
 *
 * Posts to POST /challenge-attempts with the userId, challengeId, and a
 * client-generated sessionId. The returned attempt record confirms the
 * session has been registered server-side.
 */
export async function createGameSession(
  dto: CreateGameSessionDto,
): Promise<GameSessionResponse> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/challenge-attempts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new GameSessionApiError(
          'Unauthorized. Please log in again.',
          401,
          errorData,
        );
      }

      if (response.status === 404) {
        throw new GameSessionApiError(
          'Challenge not found. Cannot create game session.',
          404,
          errorData,
        );
      }

      if (response.status === 400) {
        throw new GameSessionApiError(
          (errorData as { message?: string }).message ||
            'Invalid session data provided.',
          400,
          errorData,
        );
      }

      throw new GameSessionApiError(
        (errorData as { message?: string }).message ||
          'Failed to create game session.',
        response.status,
        errorData,
      );
    }

    return (await response.json()) as GameSessionResponse;
  } catch (error) {
    if (error instanceof GameSessionApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GameSessionApiError(
        'Unable to connect. Please check your internet connection.',
      );
    }

    throw new GameSessionApiError(
      'An unexpected error occurred while creating the game session.',
    );
  }
}
