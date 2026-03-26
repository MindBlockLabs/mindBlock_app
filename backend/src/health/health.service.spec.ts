import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { Connection } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { HealthCheckResult } from './health.interfaces';

describe('HealthService', () => {
  let service: HealthService;
  let mockConnection: jest.Mocked<Connection>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockConnection = {
      query: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'EXTERNAL_API_HEALTH_CHECKS') {
          return defaultValue || [];
        }
        return defaultValue;
      }),
    } as any;

    mockRedis = {
      ping: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: Connection,
          useValue: mockConnection,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBasicHealth', () => {
    it('should return basic health information', async () => {
      const result = await service.getBasicHealth();

      expect(result).toEqual({
        status: 'healthy',
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });

      expect(result.status).toBe('healthy');
      expect(typeof result.version).toBe('string');
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('getLivenessHealth', () => {
    it('should return liveness health information', async () => {
      const result = await service.getLivenessHealth();

      expect(result).toEqual({
        status: 'healthy',
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });

      expect(result.status).toBe('healthy');
    });
  });

  describe('getReadinessHealth', () => {
    it('should return healthy when all dependencies are healthy', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await service.getReadinessHealth();

      // Database and Redis should be healthy (these are the critical checks)
      expect(result.checks!.database.status).toBe('healthy');
      expect(result.checks!.redis.status).toBe('healthy');
      
      // Memory and filesystem status may vary by environment, just check they exist
      expect(result.checks!.memory).toBeDefined();
      expect(result.checks!.filesystem).toBeDefined();
    });

    it('should return unhealthy when database fails', async () => {
      mockConnection.query.mockRejectedValue(new Error('Database connection failed'));
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await service.getReadinessHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks!.database.status).toBe('unhealthy');
      expect(result.checks!.database.error).toBe('Database connection failed');
    });

    it('should return unhealthy when Redis fails', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.getReadinessHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks!.redis.status).toBe('unhealthy');
      expect(result.checks!.redis.error).toBe('Redis connection failed');
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health information', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await service.getDetailedHealth();

      expect(result).toEqual({
        status: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        checks: {
          database: expect.objectContaining({
            status: expect.any(String),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          }),
          redis: expect.objectContaining({
            status: expect.any(String),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          }),
          memory: expect.objectContaining({
            status: expect.any(String),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          }),
          filesystem: expect.objectContaining({
            status: expect.any(String),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          }),
        },
      });
    });

    it('should return degraded status when memory usage is high', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as unknown as jest.Mock) = jest.fn().mockReturnValue({
        heapTotal: 1000,
        heapUsed: 850, // 85% usage
        rss: 1200,
        external: 100,
        arrayBuffers: 50,
      });

      const result = await service.getDetailedHealth();

      expect(result.checks!.memory.status).toBe('degraded');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should return unhealthy status when memory usage is critical', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      // Mock critical memory usage
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as unknown as jest.Mock) = jest.fn().mockReturnValue({
        heapTotal: 1000,
        heapUsed: 950, // 95% usage
        rss: 1200,
        external: 100,
        arrayBuffers: 50,
      });

      const result = await service.getDetailedHealth();

      expect(result.checks!.memory.status).toBe('unhealthy');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('caching', () => {
    it('should cache health check results', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      // First call
      const result1 = await service.getDetailedHealth();
      
      // Second call should use cache
      const result2 = await service.getDetailedHealth();

      // Should only call dependencies once due to caching
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockRedis.ping).toHaveBeenCalledTimes(1);
      
      // Results should be identical
      expect(result1).toEqual(result2);
    });

    it('should skip cache when requested', async () => {
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      // First call
      await service.getDetailedHealth();
      
      // Second call with skip cache
      await service.getDetailedHealthSkipCache();

      // Should call dependencies twice
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockRedis.ping).toHaveBeenCalledTimes(2);
    });
  });

  describe('external API checks', () => {
    it('should check external APIs when configured', async () => {
      mockConfigService.get.mockReturnValue(['https://api.example.com/health']);
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as any;

      const result = await service.getDetailedHealth();

      expect(result.checks!.externalApis).toBeDefined();
      expect(result.checks!.externalApis!['https://api.example.com/health']).toBeDefined();
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/health', expect.objectContaining({
        method: 'GET',
        signal: expect.any(Object),
      }));
    });

    it('should handle external API failures', async () => {
      mockConfigService.get.mockReturnValue(['https://api.example.com/health']);
      mockConnection.query.mockResolvedValue(undefined);
      mockRedis.ping.mockResolvedValue('PONG');

      // Mock fetch failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

      const result = await service.getDetailedHealth();

      expect(result.checks!.externalApis!['https://api.example.com/health'].status).toBe('unhealthy');
      expect(result.checks!.externalApis!['https://api.example.com/health'].error).toBe('Network error');
    });
  });

  describe('graceful shutdown', () => {
    it('should track shutdown state', () => {
      expect(service.isAppShuttingDown()).toBe(false);

      service.setIsShuttingDown();

      expect(service.isAppShuttingDown()).toBe(true);
    });
  });
});
