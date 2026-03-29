import { Injectable } from '@nestjs/common';
import { PrometheusMetricsPlugin } from './prometheus.plugin';

/**
 * Express middleware that integrates Prometheus metrics collection
 * 
 * Usage:
 * ```ts
 * const metricsPlugin = new PrometheusMetricsPlugin();
 * await metricsPlugin.onInit();
 * 
 * // Use in Express app
 * app.use(metricsPlugin.createMiddleware());
 * 
 * // Or register /metrics endpoint
 * app.get('/metrics', metricsPlugin.createMetricsMiddleware());
 * ```
 */
@Injectable()
export class MetricsMiddleware {
  constructor(private readonly plugin: PrometheusMetricsPlugin) {}
  
  /**
   * Get the full metrics tracking middleware
   */
  use(routeOverride?: string) {
    return this.plugin.createMiddleware(routeOverride);
  }
  
  /**
   * Get just the timing middleware
   */
  timing(routeOverride?: string) {
    return this.plugin.createTimingMiddleware(routeOverride);
  }
  
  /**
   * Get just the request tracking middleware
   */
  tracking(routeOverride?: string) {
    return this.plugin.createRequestTrackingMiddleware(routeOverride);
  }
  
  /**
   * Get the /metrics endpoint handler
   */
  endpoint() {
    return this.plugin.createMetricsMiddleware();
  }
}
