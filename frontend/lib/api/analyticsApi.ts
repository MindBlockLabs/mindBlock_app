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