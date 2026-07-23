/**
 * Typed fetch client for the backend /analytics/* endpoints.
 *
 * All functions read NEXT_PUBLIC_API_URL the same way the rest of the frontend
 * API layer does and surface errors in a consistent ApiError shape so
 * components do not need to handle raw exceptions.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * Date range passed to analytics queries.
 * Mirrors the backend's DateRangeDto — both `start` and `end` are optional so
 * the backend can fall back to its own defaults.
 */
export interface DateRange {
  /** ISO-8601 date-time string, e.g. "2026-01-01T00:00:00.000Z" */
  start?: string;
  /** ISO-8601 date-time string, e.g. "2026-06-30T23:59:59.000Z" */
  end?: string;
  /** Time granularity for grouping results. Defaults to "day" on the backend. */
  granularity?: 'day' | 'week' | 'month';
}

/** Consistent error shape returned by every function in this module. */
export interface AnalyticsApiError {
  message: string;
  /** HTTP status code, or 0 when the request never reached the server. */
  status: number;
}

// ---------------------------------------------------------------------------
// Response types — mirror the backend DTOs / interfaces exactly
// ---------------------------------------------------------------------------

// --- /analytics/ping -------------------------------------------------------

export interface PingResponse {
  status: string;
  module: string;
  timestamp: string;
}

// --- /analytics/track -------------------------------------------------------

export interface TrackEventPayload {
  /**
   * Event type following the noun_pastTenseVerb convention, e.g.
   * "puzzle_attempted", "user_registered".
   */
  eventType: string;
  /** Arbitrary payload for the event. */
  payload?: Record<string, unknown>;
  /** UUID of the authenticated user, when available. */
  userId?: string;
}

export interface TrackEventResponse {
  success: boolean;
}

// --- /analytics/funnel/onboarding -------------------------------------------

export interface FunnelStage {
  name: string;
  eventType: string;
  count: number;
}

export interface OnboardingFunnelResponse {
  startDate: string;
  endDate: string;
  totalUsers: number;
  stages: FunnelStage[];
}

// --- /analytics/users/retention ---------------------------------------------

export interface RetentionDataPoint {
  /** Cohort date in YYYY-MM-DD format. */
  cohortDate: string;
  /** Total users in this cohort. */
  cohortSize: number;
  day1RetentionPct: number | null;
  day7RetentionPct: number | null;
  day30RetentionPct: number | null;
}

export interface RetentionResponse {
  startDate: string;
  endDate: string;
  granularity: string;
  data: RetentionDataPoint[];
  total: number;
}

// --- /analytics/users/churn-risk --------------------------------------------

/** Risk band derived from riskScore. null when there is no usable baseline. */
export type ChurnRiskBand = 'none' | 'low' | 'medium' | 'high';

export interface ChurnRiskDataPoint {
  userId: string;
  /**
   * Churn risk 0-100. null when the user has too little history for a
   * baseline — deliberately not 0, which would read as "safe".
   */
  riskScore: number | null;
  riskBand: ChurnRiskBand | null;
  baselineMean: number;
  baselineStdDev: number;
  baselineBuckets: number;
  recentCount: number;
  consecutiveSilentBuckets: number;
  dropRatio: number | null;
  insufficientBaseline: boolean;
}

export interface ChurnRiskResponse {
  startDate: string;
  endDate: string;
  granularity: string;
  data: ChurnRiskDataPoint[];
  total: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Serialise a DateRange object into URLSearchParams-compatible key/value
 * pairs, omitting any undefined fields.
 */
function dateRangeToParams(range?: DateRange): Record<string, string> {
  if (!range) return {};
  const params: Record<string, string> = {};
  if (range.start !== undefined) params['start'] = range.start;
  if (range.end !== undefined) params['end'] = range.end;
  if (range.granularity !== undefined) params['granularity'] = range.granularity;
  return params;
}

/**
 * Append query parameters to a URL string.
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const base = `${getBaseUrl()}${path}`;
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
}

/**
 * Central fetch wrapper that handles response parsing and converts errors into
 * the consistent AnalyticsApiError shape.
 *
 * @throws {AnalyticsApiError} on any non-2xx response or network failure
 */
async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers ?? {}),
      },
      ...options,
    });
  } catch (networkError) {
    const err: AnalyticsApiError = {
      message:
        networkError instanceof Error
          ? networkError.message
          : 'Network request failed',
      status: 0,
    };
    throw err;
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = String(body.message);
    } catch {
      // ignore JSON parse errors — keep the default message
    }
    const err: AnalyticsApiError = { message, status: response.status };
    throw err;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API functions — one per backend endpoint
// ---------------------------------------------------------------------------

/**
 * GET /analytics/ping
 *
 * Health check for the analytics module.
 */
export async function pingAnalytics(): Promise<PingResponse> {
  return apiFetch<PingResponse>(buildUrl('/analytics/ping'));
}

/**
 * POST /analytics/track
 *
 * Fire-and-forget analytics event tracking.
 * Returns `{ success: true }` on success.
 */
export async function trackEvent(
  payload: TrackEventPayload,
): Promise<TrackEventResponse> {
  return apiFetch<TrackEventResponse>(buildUrl('/analytics/track'), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET /analytics/funnel/onboarding
 *
 * Returns onboarding funnel data broken down by stage.
 * `range` is optional — the backend defaults to the last 30 days when omitted.
 */
export async function getOnboardingFunnel(
  range?: DateRange,
): Promise<OnboardingFunnelResponse> {
  return apiFetch<OnboardingFunnelResponse>(
    buildUrl('/analytics/funnel/onboarding', dateRangeToParams(range)),
  );
}

/**
 * GET /analytics/users/retention  (admin only)
 *
 * Returns the user retention curve cohort data.
 * Requires an admin-level JWT to be present in localStorage under "jwt".
 */
export async function getUserRetention(
  range?: DateRange,
): Promise<RetentionResponse> {
  return apiFetch<RetentionResponse>(
    buildUrl('/analytics/users/retention', dateRangeToParams(range)),
  );
}

/**
 * GET /analytics/users/churn-risk  (admin only)
 *
 * Returns per-user churn risk scores and bands.
 * Requires an admin-level JWT to be present in localStorage under "jwt".
 */
export async function getUserChurnRisk(
  range?: DateRange,
): Promise<ChurnRiskResponse> {
  return apiFetch<ChurnRiskResponse>(
    buildUrl('/analytics/users/churn-risk', dateRangeToParams(range)),
  );
}
