import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import {
  HealthCheckResult,
  HealthCheck,
  HealthStatus,
  HealthCheckOptions,
  HEALTH_CHECK_TIMEOUT,
  HEALTH_CACHE_TTL,
} from './health.interfaces';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();
  private readonly version = process.env.npm_package_version || '1.0.0';
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor(
    private readonly connection: Connection,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getBasicHealth(): Promise<HealthCheckResult> {
    return {
      status: 'healthy',
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async getLivenessHealth(): Promise<HealthCheckResult> {
    // Basic liveness check - just verify the process is running
    return {
      status: 'healthy',
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadinessHealth(): Promise<HealthCheckResult> {
    const options: HealthCheckOptions = { timeout: HEALTH_CHECK_TIMEOUT };
    const status = await this.performHealthChecks(options);

    const isHealthy = Object.values(status).every(
      (check: HealthCheck) => check.status === 'healthy' || check.status === 'degraded'
    );

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: status as unknown as Record<string, HealthCheck>,
    };
  }

  async getDetailedHealth(): Promise<HealthCheckResult> {
    const options: HealthCheckOptions = { 
      includeDetails: true, 
      timeout: HEALTH_CHECK_TIMEOUT,
      skipCache: false 
    };
    
    const status = await this.performHealthChecks(options);
    
    // Determine overall status
    const statuses = Object.values(status).map((check: HealthCheck) => check.status);
    const hasUnhealthy = statuses.includes('unhealthy');
    const hasDegraded = statuses.includes('degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: status as unknown as Record<string, HealthCheck>,
    };
  }

  async getDetailedHealthSkipCache(): Promise<HealthCheckResult> {
    const options: HealthCheckOptions = { 
      includeDetails: true, 
      timeout: HEALTH_CHECK_TIMEOUT,
      skipCache: true 
    };
    
    const status = await this.performHealthChecks(options);
    
    // Determine overall status
    const statuses = Object.values(status).map((check: HealthCheck) => check.status);
    const hasUnhealthy = statuses.includes('unhealthy');
    const hasDegraded = statuses.includes('degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: status as unknown as Record<string, HealthCheck>,
    };
  }

  private async performHealthChecks(options: HealthCheckOptions): Promise<HealthStatus> {
    const cacheKey = `health-checks-${JSON.stringify(options)}`;
    
    // Check cache first
    if (!options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < HEALTH_CACHE_TTL) {
        return cached.data;
      }
    }

    const status: HealthStatus = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: await this.checkMemory(),
      filesystem: await this.checkFilesystem(),
    };

    // Add external API checks if configured
    const externalApiUrls = this.configService.get<string[]>('EXTERNAL_API_HEALTH_CHECKS', []);
    if (externalApiUrls.length > 0) {
      status.externalApis = {};
      for (const url of externalApiUrls) {
        status.externalApis[url] = await this.checkExternalApi(url);
      }
    }

    // Cache the results
    this.cache.set(cacheKey, {
      data: status,
      timestamp: Date.now(),
    });

    return status;
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.connection.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          connected: true,
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
        details: {
          connected: false,
          responseTime: `${responseTime}ms`,
        },
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          connected: true,
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
        details: {
          connected: false,
          responseTime: `${responseTime}ms`,
        },
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      const responseTime = Date.now() - startTime;
      
      // Consider memory usage > 80% as degraded, > 90% as unhealthy
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }
      
      return {
        status,
        responseTime,
        details: {
          heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          usagePercent: `${Math.round(memoryUsagePercent)}%`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown memory error',
      };
    }
  }

  private async checkFilesystem(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const fs = require('fs').promises;
      // Use a cross-platform temp directory check
      const tempDir = process.env.TEMP || process.env.TMP || '.';
      await fs.access(tempDir, fs.constants.W_OK);
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          writable: true,
          path: tempDir,
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown filesystem error',
        details: {
          writable: false,
          responseTime: `${responseTime}ms`,
        },
      };
    }
  }

  private async checkExternalApi(url: string): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
          details: {
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
          },
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`,
          details: {
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
          },
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown API error',
        details: {
          responseTime: `${responseTime}ms`,
        },
      };
    }
  }

  // Graceful shutdown support
  private isShuttingDown = false;

  setIsShuttingDown(): void {
    this.isShuttingDown = true;
  }

  isAppShuttingDown(): boolean {
    return this.isShuttingDown;
  }
}
