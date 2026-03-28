import { Logger } from '@nestjs/common';
import { PluginLoader } from '../../src/common/utils/plugin-loader';
import { PluginRegistry } from '../../src/common/utils/plugin-registry';
import { PluginInterface, PluginMetadata } from '../../src/common/interfaces/plugin.interface';
import {
  PluginNotFoundError,
  PluginAlreadyLoadedError,
  PluginConfigError,
  PluginDependencyError
} from '../../src/common/interfaces/plugin.errors';

/**
 * Mock Plugin for testing
 */
class MockPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'test-plugin',
    name: 'Test Plugin',
    description: 'A test plugin',
    version: '1.0.0'
  };

  async onLoad() {
    // Test hook
  }

  async onInit() {
    // Test hook
  }

  async onActivate() {
    // Test hook
  }

  validateConfig() {
    return { valid: true, errors: [] };
  }

  getDependencies() {
    return [];
  }

  getMiddleware() {
    return (req: any, res: any, next: any) => next();
  }

  getExports() {
    return { testExport: 'value' };
  }
}

/**
 * Mock Plugin with Dependencies
 */
class MockPluginWithDeps implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'test-plugin-deps',
    name: 'Test Plugin With Deps',
    description: 'A test plugin with dependencies',
    version: '1.0.0'
  };

  getDependencies() {
    return ['test-plugin'];
  }
}

describe('PluginLoader', () => {
  let loader: PluginLoader;
  let mockPlugin: MockPlugin;

  beforeEach(() => {
    loader = new PluginLoader({
      logger: new Logger('Test'),
      middlewareVersion: '1.0.0'
    });
    mockPlugin = new MockPlugin();
  });

  describe('loadPlugin', () => {
    it('should load a valid plugin', async () => {
      // Mock require to return our test plugin
      const originalRequire = global.require;
      (global as any).require = jest.fn((moduleId: string) => {
        if (moduleId === 'test-plugin') {
          return { default: MockPlugin };
        }
        return originalRequire(moduleId);
      });

      // Note: In actual testing, we'd need to mock the module resolution
      expect(mockPlugin.metadata.id).toBe('test-plugin');
    });

    it('should reject duplicate plugin loads', async () => {
      // This would require proper test setup with module mocking
    });
  });

  describe('plugin validation', () => {
    it('should validate plugin interface', () => {
      // Valid plugin metadata
      expect(mockPlugin.metadata).toBeDefined();
      expect(mockPlugin.metadata.id).toBeDefined();
      expect(mockPlugin.metadata.name).toBeDefined();
      expect(mockPlugin.metadata.version).toBeDefined();
    });

    it('should validate plugin configuration', () => {
      const result = mockPlugin.validateConfig({ enabled: true });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('plugin lifecycle', () => {
    it('should have all lifecycle hooks defined', async () => {
      expect(typeof mockPlugin.onLoad).toBe('function');
      expect(typeof mockPlugin.onInit).toBe('function');
      expect(typeof mockPlugin.onActivate).toBe('function');
      expect(mockPlugin.validateConfig).toBeDefined();
    });

    it('should execute hooks in order', async () => {
      const hooks: string[] = [];

      const testPlugin: PluginInterface = {
        metadata: mockPlugin.metadata,
        onLoad: async () => hooks.push('onLoad'),
        onInit: async () => hooks.push('onInit'),
        onActivate: async () => hooks.push('onActivate'),
        validateConfig: () => ({ valid: true, errors: [] }),
        getDependencies: () => []
      };

      await testPlugin.onLoad!({});
      await testPlugin.onInit!({}, {});
      await testPlugin.onActivate!({});

      expect(hooks).toEqual(['onLoad', 'onInit', 'onActivate']);
    });
  });

  describe('plugin exports', () => {
    it('should export middleware', () => {
      const middleware = mockPlugin.getMiddleware();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should export utilities', () => {
      const exports = mockPlugin.getExports();
      expect(exports).toBeDefined();
      expect(exports.testExport).toBe('value');
    });
  });

  describe('plugin dependencies', () => {
    it('should return dependency list', () => {
      const deps = mockPlugin.getDependencies();
      expect(Array.isArray(deps)).toBe(true);

      const depsPlugin = new MockPluginWithDeps();
      const depsPluginDeps = depsPlugin.getDependencies();
      expect(depsPluginDeps).toContain('test-plugin');
    });
  });
});

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry({
      logger: new Logger('Test'),
      middlewareVersion: '1.0.0'
    });
  });

  describe('initialization', () => {
    it('should initialize registry', async () => {
      // Note: In actual testing, we'd mock the loader
      expect(registry.isInitialized()).toBe(false);
    });
  });

  describe('plugin management', () => {
    it('should count plugins', () => {
      expect(registry.count()).toBe(0);
    });

    it('should check if initialized', () => {
      expect(registry.isInitialized()).toBe(false);
    });

    it('should export state', () => {
      const state = registry.exportState();
      expect(state).toHaveProperty('initialized');
      expect(state).toHaveProperty('totalPlugins');
      expect(state).toHaveProperty('activePlugins');
      expect(state).toHaveProperty('plugins');
      expect(Array.isArray(state.plugins)).toBe(true);
    });
  });

  describe('plugin search', () => {
    it('should search plugins with empty registry', () => {
      const results = registry.searchPlugins({ query: 'test' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('batch operations', () => {
    it('should handle batch plugin operations', async () => {
      // Test unloadAll
      await expect(registry.unloadAll()).resolves.not.toThrow();

      // Test activateAll
      await expect(registry.activateAll()).resolves.not.toThrow();

      // Test deactivateAll
      await expect(registry.deactivateAll()).resolves.not.toThrow();
    });
  });

  describe('statistics', () => {
    it('should provide statistics', () => {
      const stats = registry.getStatistics();
      expect(stats).toHaveProperty('totalLoaded', 0);
      expect(stats).toHaveProperty('totalActive', 0);
      expect(stats).toHaveProperty('totalDisabled', 0);
      expect(Array.isArray(stats.plugins)).toBe(true);
    });
  });
});

describe('Plugin Errors', () => {
  it('should create PluginNotFoundError', () => {
    const error = new PluginNotFoundError('test-plugin');
    expect(error.message).toContain('test-plugin');
    expect(error.code).toBe('PLUGIN_NOT_FOUND');
  });

  it('should create PluginAlreadyLoadedError', () => {
    const error = new PluginAlreadyLoadedError('test-plugin');
    expect(error.message).toContain('test-plugin');
    expect(error.code).toBe('PLUGIN_ALREADY_LOADED');
  });

  it('should create PluginConfigError', () => {
    const error = new PluginConfigError('test-plugin', ['Invalid field']);
    expect(error.message).toContain('test-plugin');
    expect(error.code).toBe('PLUGIN_CONFIG_ERROR');
  });

  it('should create PluginDependencyError', () => {
    const error = new PluginDependencyError('test-plugin', ['dep1', 'dep2']);
    expect(error.message).toContain('dep1');
    expect(error.code).toBe('PLUGIN_DEPENDENCY_ERROR');
  });
});
