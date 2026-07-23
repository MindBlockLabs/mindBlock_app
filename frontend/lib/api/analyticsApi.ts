// frontend/lib/api/analyticsApi.ts
import api from './client';

export interface DauMauPoint {
  date: string; // YYYY-MM-DD
  dau: number;
  mau: number;
}

export interface DauMauResponse {
  series: DauMauPoint[];
  stickiness: number; // average DAU/MAU ratio for the period, 0-1
}

export interface DauMauParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export async function getDauMauMetrics(
  params: DauMauParams,
): Promise<DauMauResponse> {
  const response = await api.get<DauMauResponse>('/analytics/dau-mau', {
    params,
  });
  return response.data;
}

export interface RetentionDataPoint {
  cohortDate: string;
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

export interface RetentionParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export async function getRetentionMetrics(
  params: RetentionParams,
): Promise<RetentionResponse> {
  const response = await api.get<RetentionResponse>('/analytics/users/retention', {
    params,
  });
  return response.data;
}