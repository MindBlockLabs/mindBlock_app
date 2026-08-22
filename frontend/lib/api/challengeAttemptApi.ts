/**
 * Challenge Attempt API
 *
 * Talks to POST /challenge-attempts, POST /challenge-attempts/submit, and
 * GET /challenge-attempts/:id. Uses the same raw-`fetch` +
 * `localStorage['accessToken']` auth pattern as `gameSessionApi.ts`
 * (verified to be the pattern that actually works — every login path in
 * this app writes the token to `accessToken`; the shared axios `api` client
 * in `lib/api/client.ts` reads a `'jwt'` key that nothing ever sets).
 */
import {
  ChallengeAttempt,
  SubmitAttemptResult,
} from '../types/challengeAttempt';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ChallengeAttemptApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ChallengeAttemptApiError';
  }
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ChallengeAttemptApiError(
      (errorData as { message?: string }).message ??
        `Request failed with status ${response.status}`,
      response.status,
      errorData,
    );
  }
  return (await response.json()) as T;
}

export async function createAttempt(
  challengeId: string,
  sessionId?: string,
): Promise<ChallengeAttempt> {
  const response = await fetch(`${API_BASE_URL}/challenge-attempts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ challengeId, sessionId }),
  });
  return handleResponse<ChallengeAttempt>(response);
}

export async function submitAttempt(
  attemptId: string,
  answer: string,
  timeSpent: number,
): Promise<SubmitAttemptResult> {
  const response = await fetch(`${API_BASE_URL}/challenge-attempts/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ attemptId, answer, timeSpent }),
  });
  return handleResponse<SubmitAttemptResult>(response);
}

export async function getAttempt(attemptId: string): Promise<ChallengeAttempt> {
  const response = await fetch(`${API_BASE_URL}/challenge-attempts/${attemptId}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse<ChallengeAttempt>(response);
}
