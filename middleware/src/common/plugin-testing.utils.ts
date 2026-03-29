import { IPlugin } from '../../src/common/plugin.interface';

/**
 * Mock plugin context for unit testing plugins without NestJS
 */
export interface MockPluginContext {
  /** Plugin configuration */
  config: Record<string, any>;
  
  /** Logger mock */
  logger: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  };
  
  /** Metrics registry mock (if plugin uses metrics) */
  metrics?: {
    incrementHttpRequest?: jest.Mock;
    recordHttpDuration?: jest.Mock;
    incrementHttpError?: jest.Mock;
  };
}

/**
 * Create a mock plugin context for unit testing
 * 
 * @example
 * ```typescript
 * const ctx = createPluginTestContext({
 *   config: { apiKey: 'test-key' },
 * });
 * 
 * const plugin = new MyPlugin(ctx.config);
 * await plugin.onInit?.();
 * 
 * expect(ctx.logger.log).toHaveBeenCalledWith('Plugin initialized');
 * ```
 */
export function createPluginTestContext(
  overrides?: Partial<MockPluginContext>
): MockPluginContext {
  return {
    config: {},
    logger: {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    metrics: {
      incrementHttpRequest: jest.fn(),
      recordHttpDuration: jest.fn(),
      incrementHttpError: jest.fn(),
    },
    ...overrides,
  };
}

/**
 * Helper to test plugin lifecycle
 */
export interface PluginLifecycleTestResult {
  initCalled: boolean;
  destroyCalled: boolean;
  unRegisterCalled: boolean;
  initError?: Error;
  destroyError?: Error;
  unRegisterError?: Error;
  executionOrder: string[];
}

/**
 * Test a plugin's complete lifecycle
 * 
 * @param plugin - The plugin instance to test
 * @returns Test result with lifecycle information
 * 
 * @example
 * ```typescript
 * const plugin = new MyPlugin();
 * const result = await testPluginLifecycle(plugin);
 * 
 * expect(result.initCalled).toBe(true);
 * expect(result.destroyCalled).toBe(true);
 * expect(result.executionOrder).toEqual(['onInit', 'onDestroy']);
 * ```
 */
export async function testPluginLifecycle(
  plugin: IPlugin
): Promise<PluginLifecycleTestResult> {
  const result: PluginLifecycleTestResult = {
    initCalled: false,
    destroyCalled: false,
    unRegisterCalled: false,
    executionOrder: [],
  };

  // Test onInit
  try {
    if (plugin.onInit) {
      await plugin.onInit();
      result.initCalled = true;
      result.executionOrder.push('onInit');
    }
  } catch (error) {
    result.initError = error instanceof Error ? error : new Error(String(error));
  }

  // Test onDestroy
  try {
    if (plugin.onDestroy) {
      await plugin.onDestroy();
      result.destroyCalled = true;
      result.executionOrder.push('onDestroy');
    }
  } catch (error) {
    result.destroyError = error instanceof Error ? error : new Error(String(error));
  }

  // Test onUnregister
  try {
    if (plugin.onUnregister) {
      await plugin.onUnregister();
      result.unRegisterCalled = true;
      result.executionOrder.push('onUnregister');
    }
  } catch (error) {
    result.unRegisterError = error instanceof Error ? error : new Error(String(error));
  }

  return result;
}

/**
 * Create a mock plugin for testing plugin manager
 */
export interface MockPluginOptions {
  name?: string;
  version?: string;
  onInit?: jest.Mock;
  onDestroy?: jest.Mock;
  onUnregister?: jest.Mock;
  dependencies?: string[];
  priority?: number;
}

/**
 * Create a mock plugin instance for testing
 */
export function createMockPlugin(options: MockPluginOptions = {}): IPlugin {
  const mockPlugin: IPlugin = {
    name: options.name || 'MockPlugin',
    version: options.version || '1.0.0',
    dependencies: options.dependencies,
    priority: options.priority as any,
  };

  if (options.onInit) {
    mockPlugin.onInit = options.onInit;
  }

  if (options.onDestroy) {
    mockPlugin.onDestroy = options.onDestroy;
  }

  if (options.onUnregister) {
    mockPlugin.onUnregister = options.onUnregister;
  }

  return mockPlugin;
}
