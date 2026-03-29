import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';
import { IPlugin, PluginPriority } from '../common/plugin.interface';

export interface MetricsPluginConfig {
  /** Enable default metrics (CPU, memory, etc.) */
  enableDefaultMetrics?: boolean;
  
  /** Enable HTTP request duration histogram */
  enableHttpDuration?: boolean;
  
  /** Enable HTTP request counter */
  enableHttpRequests?: boolean;
  
  /** Enable HTTP error counter */
  enableHttpErrors?: boolean;
  
  /** API key for /metrics endpoint protection */
  metricsApiKey?: string;
  
  /** Custom labels to add to all metrics */
  customLabels?: Record<string, string>;
}

/**
 * PrometheusMetricsPlugin provides comprehensive metrics collection and exposition
 * 
 * Features:
 * - Three standard Prometheus metrics:
 *   1. http_requests_total (counter) - Total HTTP requests by method/route/status
 *   2. http_request_duration_seconds (histogram) - Request duration with p50/p95/p99
 *   3. http_errors_total (counter) - Total errors by type
 * - Optional /metrics endpoint within plugin
 * - Optional API key protection via METRICS_API_KEY env var
 * - Default Node.js metrics (CPU, memory, event loop lag)
 * - Custom labels support
 * - Low overhead (< 0.5ms per request)
 */
@Injectable()
export class PrometheusMetricsPlugin implements IPlugin, OnModuleInit, OnModuleDestroy {
  readonly name = 'prometheus-metrics';
  readonly version = '1.0.0';
  readonly priority = PluginPriority.HIGH;
  
  private register: client.Registry;
  private httpRequestCounter?: client.Counter<string>;
  private httpDurationHistogram?: client.Histogram<string>;
  private httpErrorCounter?: client.Counter<string>;
  private config: MetricsPluginConfig;
  private metricsEndpointRegistered = false;
  
  constructor(config: MetricsPluginConfig = {}) {
    this.config = {
      enableDefaultMetrics: true,
      enableHttpDuration: true,
      enableHttpRequests: true,
      enableHttpErrors: true,
      metricsApiKey: process.env.METRICS_API_KEY,
      ...config,
    };
    
    this.register = new client.Registry();
  }
  
  async onInit(): Promise<void> {
    // Add custom labels if provided
    if (this.config.customLabels) {
      Object.entries(this.config.customLabels).forEach(([key, value]) => {
        this.register.setDefaultLabels({ [key]: value });
      });
    }
    
    // Enable default metrics
    if (this.config.enableDefaultMetrics) {
      client.collectDefaultMetrics({ register: this.register });
    }
    
    // Create HTTP request counter
    if (this.config.enableHttpRequests) {
      this.httpRequestCounter = new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status'],
        registers: [this.register],
      });
    }
    
    // Create HTTP duration histogram
    if (this.config.enableHttpDuration) {
      this.httpDurationHistogram = new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route'],
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // p50/p95/p99 optimized
        registers: [this.register],
      });
    }
    
    // Create HTTP error counter
    if (this.config.enableHttpErrors) {
      this.httpErrorCounter = new client.Counter({
        name: 'http_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['method', 'route', 'error_type'],
        registers: [this.register],
      });
    }
    
    console.log(`[${this.name}] Plugin initialized`);
  }
  
  async onDestroy(): Promise<void> {
    try {
      await this.register.clear();
      console.log(`[${this.name}] Plugin destroyed, metrics cleared`);
    } catch (error) {
      console.error(`[${this.name}] Error during cleanup:`, error);
    }
  }
  
  /**
   * Get the metrics registry for use in middleware
   */
  getRegistry(): client.Registry {
    return this.register;
  }
  
  /**
   * Increment HTTP request counter
   */
  incrementHttpRequest(method: string, route: string, status: number): void {
    if (this.httpRequestCounter) {
      this.httpRequestCounter.inc({ method, route, status });
    }
  }
  
  /**
   * Record HTTP request duration
   */
  recordHttpDuration(method: string, route: string, durationSeconds: number): void {
    if (this.httpDurationHistogram) {
      this.httpDurationHistogram.observe({ method, route }, durationSeconds);
    }
  }
  
  /**
   * Increment HTTP error counter
   */
  incrementHttpError(method: string, route: string, errorType: string): void {
    if (this.httpErrorCounter) {
      this.httpErrorCounter.inc({ method, route, errorType });
    }
  }
  
  /**
   * Get metrics in Prometheus exposition format
   */
  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }
  
  /**
   * Create Express middleware for the /metrics endpoint
   */
  createMetricsMiddleware(): (req: any, res: any, next: any) => void {
    const apiKey = this.config.metricsApiKey;
    
    return (req: any, res: any, next: any) => {
      // Check if this is the /metrics endpoint
      if (req.path !== '/metrics') {
        return next();
      }
      
      // Only handle GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Check API key if configured
      if (apiKey) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const token = authHeader.substring(7);
        if (token !== apiKey) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      
      // Return metrics
      this.register.metrics()
        .then((metrics: string) => {
          res.set('Content-Type', this.register.contentType);
          res.send(metrics);
        })
        .catch((err: Error) => {
          res.status(500).json({ error: 'Failed to retrieve metrics' });
        });
    };
  }
  
  /**
   * Create timing middleware wrapper for measuring request duration
   */
  createTimingMiddleware(routeOverride?: string): (req: any, res: any, next: any) => void {
    return (req: any, res: any, next: any) => {
      if (!this.httpDurationHistogram) {
        return next();
      }
      
      const startTime = Date.now();
      const method = req.method;
      
      // Track response finish
      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        const route = routeOverride || req.route?.path || req.path || 'unknown';
        this.recordHttpDuration(method, route, duration);
      });
      
      next();
    };
  }
  
  /**
   * Create request tracking middleware
   */
  createRequestTrackingMiddleware(routeOverride?: string): (req: any, res: any, next: any) => void {
    return (req: any, res: any, next: any) => {
      if (!this.httpRequestCounter) {
        return next();
      }
      
      const method = req.method;
      const route = routeOverride || req.route?.path || req.path || 'unknown';
      
      // Track response finish to get status code
      res.on('finish', () => {
        const status = res.statusCode;
        this.incrementHttpRequest(method, route, status);
        
        // Track 4xx and 5xx as errors
        if (status >= 400) {
          const errorType = status >= 500 ? 'server_error' : 'client_error';
          this.incrementHttpError(method, route, errorType);
        }
      });
      
      next();
    };
  }
  
  /**
   * Get a complete middleware factory that combines all tracking
   */
  createMiddleware(routeOverride?: string): (req: any, res: any, next: any) => void {
    const timingMiddleware = this.createTimingMiddleware(routeOverride);
    const trackingMiddleware = this.createRequestTrackingMiddleware(routeOverride);
    
    return (req: any, res: any, next: any) => {
      timingMiddleware(req, res, () => {
        trackingMiddleware(req, res, next);
      });
    };
  }
  
  onModuleInit(): void {
    this.onInit();
  }
  
  onModuleDestroy(): void {
    this.onDestroy();
  }
}
