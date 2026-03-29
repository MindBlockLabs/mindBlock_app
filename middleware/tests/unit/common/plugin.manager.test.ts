import { PluginManager } from '../../../src/common/plugin.manager';
import { IPlugin, PluginPriority } from '../../../src/common/plugin.interface';

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  afterEach(async () => {
    await manager.destroyAll();
  });

  describe('registration', () => {
    it('should register a plugin successfully', async () => {
      const plugin: IPlugin = {
        name: 'TestPlugin',
        version: '1.0.0',
      };

      await expect(manager.register(plugin)).resolves.not.toThrow();
      expect(manager.hasPlugin('TestPlugin')).toBe(true);
    });

    it('should reject duplicate plugin registration', async () => {
      const plugin: IPlugin = {
        name: 'DuplicatePlugin',
        version: '1.0.0',
      };

      await manager.register(plugin);
      await expect(manager.register(plugin)).rejects.toThrow(
        'Plugin "DuplicatePlugin" is already registered'
      );
    });

    it('should handle plugins with priority', async () => {
      const criticalPlugin: IPlugin = {
        name: 'CriticalPlugin',
        version: '1.0.0',
        priority: PluginPriority.CRITICAL,
      };

      const lowPlugin: IPlugin = {
        name: 'LowPlugin',
        version: '1.0.0',
        priority: PluginPriority.LOW,
      };

      await manager.register(lowPlugin);
      await manager.register(criticalPlugin);

      expect(manager.hasPlugin('CriticalPlugin')).toBe(true);
      expect(manager.hasPlugin('LowPlugin')).toBe(true);
    });
  });

  describe('initialization order', () => {
    it('should initialize plugins in registration order', async () => {
      const initOrder: string[] = [];

      const plugin1: IPlugin = {
        name: 'FirstPlugin',
        version: '1.0.0',
        onInit: async () => {
          initOrder.push('FirstPlugin');
        },
      };

      const plugin2: IPlugin = {
        name: 'SecondPlugin',
        version: '1.0.0',
        onInit: async () => {
          initOrder.push('SecondPlugin');
        },
      };

      await manager.register(plugin1);
      await manager.register(plugin2);
      await manager.initializeAll();

      expect(initOrder).toEqual(['FirstPlugin', 'SecondPlugin']);
    });

    it('should initialize plugins by priority (CRITICAL first)', async () => {
      const initOrder: string[] = [];

      const normalPlugin: IPlugin = {
        name: 'NormalPlugin',
        version: '1.0.0',
        priority: PluginPriority.NORMAL,
        onInit: async () => {
          initOrder.push('NormalPlugin');
        },
      };

      const criticalPlugin: IPlugin = {
        name: 'CriticalPlugin',
        version: '1.0.0',
        priority: PluginPriority.CRITICAL,
        onInit: async () => {
          initOrder.push('CriticalPlugin');
        },
      };

      const highPlugin: IPlugin = {
        name: 'HighPlugin',
        version: '1.0.0',
        priority: PluginPriority.HIGH,
        onInit: async () => {
          initOrder.push('HighPlugin');
        },
      };

      await manager.register(normalPlugin);
      await manager.register(criticalPlugin);
      await manager.register(highPlugin);
      await manager.initializeAll();

      expect(initOrder).toEqual(['CriticalPlugin', 'HighPlugin', 'NormalPlugin']);
    });

    it('should call onDestroy in reverse registration order', async () => {
      const destroyOrder: string[] = [];

      const plugin1: IPlugin = {
        name: 'FirstPlugin',
        version: '1.0.0',
        onDestroy: async () => {
          destroyOrder.push('FirstPlugin');
        },
      };

      const plugin2: IPlugin = {
        name: 'SecondPlugin',
        version: '1.0.0',
        onDestroy: async () => {
          destroyOrder.push('SecondPlugin');
        },
      };

      await manager.register(plugin1);
      await manager.register(plugin2);
      await manager.initializeAll();
      await manager.destroyAll();

      expect(destroyOrder).toEqual(['SecondPlugin', 'FirstPlugin']);
    });
  });

  describe('dependencies', () => {
    it('should warn about missing dependencies but still register', async () => {
      const plugin: IPlugin = {
        name: 'DependentPlugin',
        version: '1.0.0',
        dependencies: ['MissingDependency'],
      };

      await expect(manager.register(plugin)).resolves.not.toThrow();
      expect(manager.hasPlugin('DependentPlugin')).toBe(true);
    });

    it('should detect circular dependencies', async () => {
      const pluginA: IPlugin = {
        name: 'PluginA',
        version: '1.0.0',
        dependencies: ['PluginB'],
      };

      const pluginB: IPlugin = {
        name: 'PluginB',
        version: '1.0.0',
        dependencies: ['PluginA'],
      };

      await manager.register(pluginA);
      await expect(manager.register(pluginB)).rejects.toThrow(
        'Circular dependency detected'
      );
    });

    it('should initialize dependencies before dependent plugin', async () => {
      const initOrder: string[] = [];

      const dependency: IPlugin = {
        name: 'Dependency',
        version: '1.0.0',
        onInit: async () => {
          initOrder.push('Dependency');
        },
      };

      const dependent: IPlugin = {
        name: 'Dependent',
        version: '1.0.0',
        dependencies: ['Dependency'],
        onInit: async () => {
          initOrder.push('Dependent');
        },
      };

      await manager.register(dependency);
      await manager.register(dependent);
      await manager.initializeAll();

      expect(initOrder).toEqual(['Dependency', 'Dependent']);
    });
  });

  describe('lifecycle management', () => {
    it('should handle initialization errors gracefully', async () => {
      const failingPlugin: IPlugin = {
        name: 'FailingPlugin',
        version: '1.0.0',
        onInit: async () => {
          throw new Error('Initialization failed');
        },
      };

      await expect(manager.register(failingPlugin)).resolves.not.toThrow();
      await expect(manager.initializeAll()).rejects.toThrow('Initialization failed');

      const status = manager.getInitializationStatus();
      expect(status.failed).toContain('FailingPlugin');
    });

    it('should continue destroying other plugins if one fails', async () => {
      const destroyOrder: string[] = [];

      const failingPlugin: IPlugin = {
        name: 'FailingPlugin',
        version: '1.0.0',
        onDestroy: async () => {
          throw new Error('Destroy failed');
        },
      };

      const successPlugin: IPlugin = {
        name: 'SuccessPlugin',
        version: '1.0.0',
        onDestroy: async () => {
          destroyOrder.push('SuccessPlugin');
        },
      };

      await manager.register(failingPlugin);
      await manager.register(successPlugin);
      await manager.initializeAll();

      await expect(manager.destroyAll()).resolves.not.toThrow();
      expect(destroyOrder).toContain('SuccessPlugin');
    });

    it('should unregister a plugin and destroy it if initialized', async () => {
      let destroyed = false;

      const plugin: IPlugin = {
        name: 'TemporaryPlugin',
        version: '1.0.0',
        onDestroy: async () => {
          destroyed = true;
        },
      };

      await manager.register(plugin);
      await manager.initializeAll();
      await manager.unregister('TemporaryPlugin');

      expect(destroyed).toBe(true);
      expect(manager.hasPlugin('TemporaryPlugin')).toBe(false);
    });

    it('should call onUnregister when unregistering', async () => {
      let unregistered = false;

      const plugin: IPlugin = {
        name: 'CleanupPlugin',
        version: '1.0.0',
        onUnregister: async () => {
          unregistered = true;
        },
      };

      await manager.register(plugin);
      await manager.unregister('CleanupPlugin');

      expect(unregistered).toBe(true);
    });
  });

  describe('status and retrieval', () => {
    it('should return correct initialization status', async () => {
      const plugin1: IPlugin = {
        name: 'Plugin1',
        version: '1.0.0',
      };

      const plugin2: IPlugin = {
        name: 'Plugin2',
        version: '1.0.0',
        onInit: async () => {
          throw new Error('Failed');
        },
      };

      await manager.register(plugin1);
      await manager.register(plugin2);
      await manager.initializeAll().catch(() => {});

      const status = manager.getInitializationStatus();
      expect(status.initialized).toContain('Plugin1');
      expect(status.failed).toContain('Plugin2');
    });

    it('should retrieve plugin by name', async () => {
      const plugin: IPlugin = {
        name: 'RetrievablePlugin',
        version: '2.0.0',
      };

      await manager.register(plugin);
      const retrieved = manager.getPlugin<IPlugin>('RetrievablePlugin');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('RetrievablePlugin');
      expect(retrieved?.version).toBe('2.0.0');
    });

    it('should return all registered plugins', async () => {
      const plugins: IPlugin[] = [
        { name: 'Plugin1', version: '1.0.0' },
        { name: 'Plugin2', version: '1.0.0' },
        { name: 'Plugin3', version: '1.0.0' },
      ];

      for (const plugin of plugins) {
        await manager.register(plugin);
      }

      const allPlugins = manager.getAllPlugins();
      expect(allPlugins).toHaveLength(3);
      expect(allPlugins.map(p => p.name)).toEqual(
        expect.arrayContaining(['Plugin1', 'Plugin2', 'Plugin3'])
      );
    });
  });
});
