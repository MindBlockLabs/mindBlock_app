export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks?: Record<string, HealthCheck>;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthStatus {
  database: HealthCheck;
  redis: HealthCheck;
  memory: HealthCheck;
  filesystem: HealthCheck;
  externalApis?: Record<string, HealthCheck>;
}

export interface HealthCheckOptions {
  includeDetails?: boolean;
  timeout?: number;
  skipCache?: boolean;
}

export const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
export const HEALTH_CACHE_TTL = 30000; // 30 seconds
