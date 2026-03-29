import { PluginManager } from '../../src/common/plugin-manager';

describe('PluginManager', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('calls onInit in registration order and onDestroy in reverse', async () => {
    const sequence: string[] = [];
    const manager = new PluginManager();

    manager.register({
      name: 'plugin-a',
      onInit: () => {
        sequence.push('plugin-a.init');
      },
      onDestroy: () => {
        sequence.push('plugin-a.destroy');
      },
    });

    manager.register({
      name: 'plugin-b',
      onInit: () => {
        sequence.push('plugin-b.init');
      },
      onDestroy: () => {
        sequence.push('plugin-b.destroy');
      },
    });

    await manager.initAll();
    await manager.destroyAll();

    expect(sequence).toEqual([
      'plugin-a.init',
      'plugin-b.init',
      'plugin-b.destroy',
      'plugin-a.destroy',
    ]);
  });

  it('aborts bootstrap on onInit throw and includes plugin name', async () => {
    const destroyed: string[] = [];
    const onError = jest.fn();
    const manager = new PluginManager();

    manager.register({
      name: 'plugin-a',
      onInit: () => {
        destroyed.push('plugin-a.init');
      },
      onDestroy: () => {
        destroyed.push('plugin-a.destroy');
      },
    });

    manager.register({
      name: 'plugin-b',
      onInit: () => {
        throw new Error('fail B');
      },
      onDestroy: () => {
        destroyed.push('plugin-b.destroy');
      },
      onError,
    });

    await expect(manager.initAll()).rejects.toThrow(/plugin-b/);

    // plugin-a was initialized then cleaned up, plugin-b never completed
    expect(destroyed).toEqual(['plugin-a.init', 'plugin-a.destroy']);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'fail B' }));
  });

  it('aborts bootstrap on onInit timeout (default 10s)', async () => {
    const onError = jest.fn();
    const manager = new PluginManager();

    manager.register({
      name: 'plugin-slow',
      onInit: () => new Promise<void>(() => {}),
      onError,
    });

    await expect(manager.initAll({ timeoutMs: 10 })).rejects.toThrow(/onInit timeout/);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('onInit timeout') }));
  });

  it('rejects if dependency registration order is invalid', async () => {
    const manager = new PluginManager();

    manager.register({
      name: 'plugin-b',
      dependsOn: ['plugin-a'],
      onInit: jest.fn(),
    });

    manager.register({
      name: 'plugin-a',
      onInit: jest.fn(),
    });

    await expect(manager.initAll()).rejects.toThrow(/depends on plugin-a but plugin-a was registered later/);
  });

  it('detects circular dependencies', async () => {
    const manager = new PluginManager();

    manager.register({
      name: 'plugin-a',
      dependsOn: ['plugin-b'],
      onInit: jest.fn(),
    });

    manager.register({
      name: 'plugin-b',
      dependsOn: ['plugin-a'],
      onInit: jest.fn(),
    });

    await expect(manager.initAll()).rejects.toThrow(/Circular dependency detected/);
  });
});
