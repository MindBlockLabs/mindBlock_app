import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import RequestLoggerPlugin from '../../src/plugins/request-logger.plugin';
import { PluginConfig } from '../../src/common/interfaces/plugin.interface';

describe('RequestLoggerPlugin', () => {
  let plugin: RequestLoggerPlugin;
  let app: INestApplication;

  beforeEach(() => {
    plugin = new RequestLoggerPlugin();
  });

  describe('Plugin Lifecycle', () => {
    it('should load plugin without errors', async () => {
      const context = { logger: console as any };
      await expect(plugin.onLoad(context as any)).resolves.not.toThrow();
    });

    it('should initialize with default configuration', async () => {
      const config: PluginConfig = {
        enabled: true,
        options: {}
      };
      const context = { logger: console as any };

      await expect(plugin.onInit(config, context as any)).resolves.not.toThrow();
    });

    it('should initialize with custom configuration', async () => {
      const config: PluginConfig = {
        enabled: true,
        options: {
          logLevel: 'debug',
          excludePaths: ['/health', '/metrics'],
          logHeaders: true,
          logBody: true,
          maxBodyLength: 1000,
          colorize: false,
          requestIdHeader: 'x-trace-id'
        }
      };
      const context = { logger: console as any };

      await expect(plugin.onInit(config, context as any)).resolves.not.toThrow();
    });

    it('should activate plugin', async () => {
      const context = { logger: console as any };
      await expect(plugin.onActivate(context as any)).resolves.not.toThrow();
    });

    it('should deactivate plugin', async () => {
      const context = { logger: console as any };
      await expect(plugin.onDeactivate(context as any)).resolves.not.toThrow();
    });

    it('should unload plugin', async () => {
      const context = { logger: console as any };
      await expect(plugin.onUnload(context as any)).resolves.not.toThrow();
    });
  });

  describe('Plugin Metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.metadata.id).toBe('@mindblock/plugin-request-logger');
      expect(plugin.metadata.name).toBe('Request Logger');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.priority).toBe(100);
      expect(plugin.metadata.autoLoad).toBe(false);
    });

    it('should have configSchema', () => {
      expect(plugin.metadata.configSchema).toBeDefined();
      expect(plugin.metadata.configSchema.properties.options.properties.logLevel).toBeDefined();
      expect(plugin.metadata.configSchema.properties.options.properties.excludePaths).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config: PluginConfig = {
        enabled: true,
        options: {
          logLevel: 'info',
          excludePaths: ['/health'],
          maxBodyLength: 500
        }
      };

      const result = plugin.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid logLevel', () => {
      const config: PluginConfig = {
        enabled: true,
        options: {
          logLevel: 'invalid' as any
        }
      };

      const result = plugin.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('logLevel must be one of: debug, info, warn, error');
    });

    it('should reject negative maxBodyLength', () => {
      const config: PluginConfig = {
        enabled: true,
        options: {
          maxBodyLength: -1
        }
      };

      const result = plugin.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxBodyLength must be >= 0');
    });

    it('should reject if excludePaths is not an array', () => {
      const config: PluginConfig = {
        enabled: true,
        options: {
          excludePaths: 'not-an-array' as any
        }
      };

      const result = plugin.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('excludePaths must be an array of strings');
    });

    it('should validate all valid log levels', () => {
      const levels = ['debug', 'info', 'warn', 'error'];

      for (const level of levels) {
        const config: PluginConfig = {
          enabled: true,
          options: { logLevel: level as any }
        };

        const result = plugin.validateConfig(config);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Dependencies', () => {
    it('should return empty dependencies array', () => {
      const deps = plugin.getDependencies();
      expect(Array.isArray(deps)).toBe(true);
      expect(deps).toHaveLength(0);
    });
  });

  describe('Middleware Export', () => {
    it('should throw if middleware requested before initialization', () => {
      expect(() => plugin.getMiddleware()).toThrow('Request Logger plugin not initialized');
    });

    it('should return middleware function after initialization', async () => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const middleware = plugin.getMiddleware();

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // (req, res, next)
    });

    it('should skip excluded paths', (done) => {
      const mockReq = {
        path: '/health',
        method: 'GET',
        headers: {},
        query: {}
      } as any;

      const mockRes = {
        on: () => {},
        statusCode: 200
      } as any;

      let nextCalled = false;
      const mockNext = () => {
        nextCalled = true;
      };

      plugin.onInit({ enabled: true }, { logger: console as any }).then(() => {
        const middleware = plugin.getMiddleware();
        middleware(mockReq, mockRes, mockNext);

        expect(nextCalled).toBe(true);
        done();
      });
    });
  });

  describe('Exports', () => {
    it('should export utility functions', async () => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      expect(exports.getRequestId).toBeDefined();
      expect(exports.setLogLevel).toBeDefined();
      expect(exports.getLogLevel).toBeDefined();
      expect(exports.addExcludePaths).toBeDefined();
      expect(exports.removeExcludePaths).toBeDefined();
      expect(exports.getExcludePaths).toBeDefined();
      expect(exports.clearExcludePaths).toBeDefined();
    });

    it('should set and get log level', async () => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      exports.setLogLevel('debug');
      expect(exports.getLogLevel()).toBe('debug');

      exports.setLogLevel('warn');
      expect(exports.getLogLevel()).toBe('warn');
    });

    it('should add and remove excluded paths', async () => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      exports.clearExcludePaths();
      expect(exports.getExcludePaths()).toHaveLength(0);

      exports.addExcludePaths('/api', '/admin');
      expect(exports.getExcludePaths()).toHaveLength(2);

      exports.removeExcludePaths('/api');
      expect(exports.getExcludePaths()).toHaveLength(1);
      expect(exports.getExcludePaths()).toContain('/admin');
    });

    it('should extract request ID from headers', async () => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      const mockReq = {
        headers: {
          'x-request-id': 'test-req-123'
        }
      } as any;

      const requestId = exports.getRequestId(mockReq);
      expect(requestId).toBe('test-req-123');
    });

    it('should generate request ID if not in headers', async () => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      const mockReq = {
        headers: {}
      } as any;

      const requestId = exports.getRequestId(mockReq);
      expect(requestId).toMatch(/^req-\d+-[\w]+$/);
    });
  });

  describe('Middleware Behavior', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [],
        providers: []
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should process requests normally', (done) => {
      const config: PluginConfig = { enabled: true };
      const context = { logger: console as any };

      plugin.onInit(config, context as any).then(() => {
        const middleware = plugin.getMiddleware();

        const mockReq = {
          path: '/api/test',
          method: 'GET',
          headers: {},
          query: {}
        } as any;

        const mockRes = {
          statusCode: 200,
          on: (event: string, callback: () => void) => {
            if (event === 'finish') {
              setTimeout(callback, 10);
            }
          },
          send: (data: any) => mockRes
        } as any;

        let nextCalled = false;
        const mockNext = () => {
          nextCalled = true;
        };

        middleware(mockReq, mockRes, mockNext);

        setTimeout(() => {
          expect(nextCalled).toBe(true);
          expect((mockReq as any).requestId).toBeDefined();
          done();
        }, 50);
      });
    });

    it('should attach request ID to request object', (done) => {
      const config: PluginConfig = {
        enabled: true,
        options: { requestIdHeader: 'x-trace-id' }
      };
      const context = { logger: console as any };

      plugin.onInit(config, context as any).then(() => {
        const middleware = plugin.getMiddleware();

        const mockReq = {
          path: '/api/test',
          method: 'GET',
          headers: { 'x-trace-id': 'trace-123' },
          query: {}
        } as any;

        const mockRes = {
          statusCode: 200,
          on: () => {},
          send: (data: any) => mockRes
        } as any;

        const mockNext = () => {
          expect((mockReq as any).requestId).toBe('trace-123');
          done();
        };

        middleware(mockReq, mockRes, mockNext);
      });
    });
  });

  describe('Configuration Application', () => {
    it('should apply custom log level', async () => {
      const config: PluginConfig = {
        enabled: true,
        options: { logLevel: 'debug' }
      };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      expect(exports.getLogLevel()).toBe('debug');
    });

    it('should apply custom exclude paths', async () => {
      const config: PluginConfig = {
        enabled: true,
        options: { excludePaths: ['/custom', '/private'] }
      };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      expect(exports.getExcludePaths()).toContain('/custom');
      expect(exports.getExcludePaths()).toContain('/private');
    });

    it('should apply custom request ID header', async () => {
      const config: PluginConfig = {
        enabled: true,
        options: { requestIdHeader: 'x-custom-id' }
      };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const exports = plugin.getExports();

      const mockReq = {
        headers: { 'x-custom-id': 'custom-123' }
      } as any;

      const requestId = exports.getRequestId(mockReq);
      expect(requestId).toBe('custom-123');
    });

    it('should disable colorization when configured', async () => {
      const config: PluginConfig = {
        enabled: true,
        options: { colorize: false }
      };
      const context = { logger: console as any };

      await plugin.onInit(config, context as any);
      const middleware = plugin.getMiddleware();

      expect(typeof middleware).toBe('function');
    });
  });
});
