export interface FunnelStage {
  name: string;
  eventType: string;
  count: number;
}

export interface FunnelResult {
  startDate: Date;
  endDate: Date;
  totalUsers: number;
  stages: FunnelStage[];
}
