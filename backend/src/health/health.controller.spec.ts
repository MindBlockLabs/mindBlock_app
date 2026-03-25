import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthCheckResult } from './health.interfaces';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    getBasicHealth: jest.fn(),
    getLivenessHealth: jest.fn(),
    getReadinessHealth: jest.fn(),
    getDetailedHealth: jest.fn(),
    isAppShuttingDown: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return basic health check', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      mockHealthService.isAppShuttingDown.mockReturnValue(false);
      mockHealthService.getBasicHealth.mockResolvedValue(expectedResult);

      const result = await controller.getBasicHealth();

      expect(result).toEqual(expectedResult);
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getBasicHealth).toHaveBeenCalled();
    });

    it('should return 403 when app is shutting down', async () => {
      mockHealthService.isAppShuttingDown.mockReturnValue(true);

      await expect(controller.getBasicHealth()).rejects.toThrow('Application is shutting down');
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getBasicHealth).not.toHaveBeenCalled();
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness health check', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      mockHealthService.isAppShuttingDown.mockReturnValue(false);
      mockHealthService.getLivenessHealth.mockResolvedValue(expectedResult);

      const result = await controller.getLivenessHealth();

      expect(result).toEqual(expectedResult);
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getLivenessHealth).toHaveBeenCalled();
    });

    it('should return 403 when app is shutting down', async () => {
      mockHealthService.isAppShuttingDown.mockReturnValue(true);

      await expect(controller.getLivenessHealth()).rejects.toThrow('Application is shutting down');
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getLivenessHealth).not.toHaveBeenCalled();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness health check when healthy', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2023-01-01T00:00:00.000Z',
        checks: {
          database: { status: 'healthy', responseTime: 5 },
          redis: { status: 'healthy', responseTime: 2 },
          memory: { status: 'healthy', responseTime: 1 },
          filesystem: { status: 'healthy', responseTime: 1 },
        },
      };

      mockHealthService.isAppShuttingDown.mockReturnValue(false);
      mockHealthService.getReadinessHealth.mockResolvedValue(expectedResult);

      const result = await controller.getReadinessHealth();

      expect(result).toEqual(expectedResult);
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getReadinessHealth).toHaveBeenCalled();
    });

    it('should return 403 when app is shutting down', async () => {
      mockHealthService.isAppShuttingDown.mockReturnValue(true);

      await expect(controller.getReadinessHealth()).rejects.toThrow('Application is shutting down');
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getReadinessHealth).not.toHaveBeenCalled();
    });

    it('should return 403 when service is not ready', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'unhealthy',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2023-01-01T00:00:00.000Z',
        checks: {
          database: { status: 'unhealthy', error: 'Connection failed' },
          redis: { status: 'healthy', responseTime: 2 },
          memory: { status: 'healthy', responseTime: 1 },
          filesystem: { status: 'healthy', responseTime: 1 },
        },
      };

      mockHealthService.isAppShuttingDown.mockReturnValue(false);
      mockHealthService.getReadinessHealth.mockResolvedValue(expectedResult);

      await expect(controller.getReadinessHealth()).rejects.toThrow('Service not ready');
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getReadinessHealth).toHaveBeenCalled();
    });
  });

  describe('GET /health/detailed', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, ADMIN_HEALTH_KEY: 'test-admin-key' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return detailed health check with valid admin key', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2023-01-01T00:00:00.000Z',
        checks: {
          database: { status: 'healthy', responseTime: 5, details: { connected: true } },
          redis: { status: 'healthy', responseTime: 2, details: { connected: true } },
          memory: { status: 'healthy', responseTime: 1, details: { usagePercent: '45%' } },
          filesystem: { status: 'healthy', responseTime: 1, details: { writable: true } },
        },
      };

      mockHealthService.isAppShuttingDown.mockReturnValue(false);
      mockHealthService.getDetailedHealth.mockResolvedValue(expectedResult);

      const result = await controller.getDetailedHealth('test-admin-key');

      expect(result).toEqual(expectedResult);
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getDetailedHealth).toHaveBeenCalled();
    });

    it('should return 403 with invalid admin key', async () => {
      await expect(controller.getDetailedHealth('invalid-key')).rejects.toThrow('Admin access required');
      expect(healthService.isAppShuttingDown).not.toHaveBeenCalled();
      expect(healthService.getDetailedHealth).not.toHaveBeenCalled();
    });

    it('should return 403 when app is shutting down', async () => {
      mockHealthService.isAppShuttingDown.mockReturnValue(true);

      await expect(controller.getDetailedHealth('test-admin-key')).rejects.toThrow('Application is shutting down');
      expect(healthService.isAppShuttingDown).toHaveBeenCalled();
      expect(healthService.getDetailedHealth).not.toHaveBeenCalled();
    });
  });
});
