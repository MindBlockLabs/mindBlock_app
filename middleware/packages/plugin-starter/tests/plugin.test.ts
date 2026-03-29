import { MyStarterPlugin } from '../src';
import { 
  createPluginTestContext, 
  testPluginLifecycle,
  createMockPlugin 
} from '@mindblock/middleware/common';

describe('MyStarterPlugin', () => {
  let plugin: MyStarterPlugin;

  beforeEach(() => {
    plugin = new MyStarterPlugin();
  });

  describe('constructor', () => {
    it('should create plugin with default config', () => {
      expect(plugin.name).toBe('my-starter-plugin');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should accept custom config', () => {
      const customPlugin = new MyStarterPlugin({
        apiKey: 'test-key',
        timeout: 10000,
        enabled: false,
      });

      expect(customPlugin).toBeDefined();
    });
  });

  describe('onInit', () => {
    it('should initialize successfully', async () => {
      await expect(plugin.onInit()).resolves.not.toThrow();
    });

    it('should work with test context', async () => {
      const ctx = createPluginTestContext({
        config: { apiKey: 'test-key' },
      });

      const testPlugin = new MyStarterPlugin(ctx.config);
      await testPlugin.onInit();

      // Plugin should initialize without errors
      expect(ctx.logger.log).toBeDefined();
    });
  });

  describe('onDestroy', () => {
    it('should destroy after init', async () => {
      await plugin.onInit();
      await expect(plugin.onDestroy()).resolves.not.toThrow();
    });

    it('should cleanup resources', async () => {
      await plugin.onInit();
      await plugin.onDestroy();
      
      // Add assertions for cleanup if needed
    });
  });

  describe('lifecycle', () => {
    it('should follow correct lifecycle order', async () => {
      const result = await testPluginLifecycle(plugin);

      expect(result.initCalled).toBe(true);
      expect(result.destroyCalled).toBe(true);
      expect(result.executionOrder).toEqual(['onInit', 'onDestroy']);
    });

    it('should handle lifecycle errors gracefully', async () => {
      const result = await testPluginLifecycle(plugin);
      
      expect(result.initError).toBeUndefined();
      expect(result.destroyError).toBeUndefined();
    });
  });

  describe('doSomething', () => {
    beforeEach(async () => {
      await plugin.onInit();
    });

    it('should execute when enabled', async () => {
      await expect(plugin.doSomething()).resolves.not.toThrow();
    });

    it('should throw when disabled', async () => {
      const disabledPlugin = new MyStarterPlugin({ enabled: false });
      await disabledPlugin.onInit();

      await expect(disabledPlugin.doSomething()).rejects.toThrow('Plugin is disabled');
    });
  });

  describe('mock plugin creation', () => {
    it('should create mock plugin for testing', () => {
      const mockPlugin = createMockPlugin({
        name: 'TestPlugin',
        version: '2.0.0',
        onInit: jest.fn().mockResolvedValue(undefined),
        onDestroy: jest.fn().mockResolvedValue(undefined),
      });

      expect(mockPlugin.name).toBe('TestPlugin');
      expect(mockPlugin.version).toBe('2.0.0');
    });
  });
});
