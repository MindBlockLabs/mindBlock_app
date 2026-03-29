import { Logger } from '@nestjs/common';

export interface PluginLifecycle {
  name: string;
  onInit?: () => Promise<void> | void;
  onDestroy?: () => Promise<void> | void;
  onError?: (error: Error) => void;
  dependsOn?: string[];
}

export interface PluginManagerOptions {
  initTimeoutMs?: number;
}

export interface PluginInitOptions {
  timeoutMs?: number;
}

export class PluginManager {
  private readonly logger = new Logger(PluginManager.name);
  private readonly registry: PluginLifecycle[] = [];
  private readonly initializedOrder: string[] = [];

  constructor(private readonly options: PluginManagerOptions = {}) {}

  register(plugin: PluginLifecycle): void {
    if (!plugin || !plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must provide a non-empty name');
    }

    if (this.registry.some((entry) => entry.name === plugin.name)) {
      throw new Error(`Plugin already registered: ${plugin.name}`);
    }

    this.registry.push({ ...plugin });
  }

  async initAll(opts: PluginInitOptions = {}): Promise<void> {
    const timeoutMs = opts.timeoutMs ?? this.options.initTimeoutMs ?? 10_000;
    const ordered = this.validatePluginOrder();
    const initialized: PluginLifecycle[] = [];

    try {
      for (const plugin of ordered) {
        if (!plugin.onInit) {
          this.initializedOrder.push(plugin.name);
          initialized.push(plugin);
          continue;
        }

        await this.executeInit(plugin, timeoutMs);
        this.initializedOrder.push(plugin.name);
        initialized.push(plugin);
      }
    } catch (error) {
      // Clean up already initialized plugins in reverse registration order
      for (const plugin of initialized.slice().reverse()) {
        try {
          await this.executeDestroy(plugin);
        } catch (destroyError) {
          this.logger.error(
            `Plugin ${plugin.name} onDestroy failed after init failure`,
            (destroyError as Error)?.stack,
          );
        }
      }
      throw error;
    }
  }

  async destroyAll(): Promise<void> {
    const reverseOrder = [...this.registry].reverse();
    const errors: Error[] = [];

    for (const plugin of reverseOrder) {
      if (!this.initializedOrder.includes(plugin.name)) {
        continue;
      }

      try {
        await this.executeDestroy(plugin);
      } catch (err) {
        errors.push(err as Error);
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Plugin onDestroy failed for ${errors.length} plugin(s); first: ${errors[0].message}`,
      );
    }

    this.initializedOrder.length = 0;
  }

  getRegisteredPluginNames(): string[] {
    return this.registry.map((p) => p.name);
  }

  private validatePluginOrder(): PluginLifecycle[] {
    const nameIndex = new Map<string, number>();
    this.registry.forEach((plugin, idx) => nameIndex.set(plugin.name, idx));

    for (const plugin of this.registry) {
      if (!plugin.dependsOn || plugin.dependsOn.length === 0) {
        continue;
      }

      for (const dep of plugin.dependsOn) {
        if (!nameIndex.has(dep)) {
          throw new Error(
            `Plugin ${plugin.name} depends on unknown plugin ${dep}`,
          );
        }

        if ((nameIndex.get(dep) ?? -1) > (nameIndex.get(plugin.name) ?? -1)) {
          throw new Error(
            `Plugin dependency order invalid: ${plugin.name} depends on ${dep} but ${dep} was registered later`,
          );
        }
      }
    }

    // detect circular dependency graph if any direct cycles happen
    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (plugin: PluginLifecycle) => {
      if (stack.has(plugin.name)) {
        throw new Error(`Circular dependency detected with plugin ${plugin.name}`);
      }

      if (visited.has(plugin.name)) {
        return;
      }

      stack.add(plugin.name);
      visited.add(plugin.name);

      for (const depName of plugin.dependsOn ?? []) {
        const dep = this.registry.find((entry) => entry.name === depName);
        if (dep) {
          visit(dep);
        }
      }

      stack.delete(plugin.name);
    };

    this.registry.forEach(visit);

    return [...this.registry];
  }

  private async executeInit(plugin: PluginLifecycle, timeoutMs: number) {
    const onInit = plugin.onInit;
    if (!onInit) {
      return;
    }

    let timeoutHandle: NodeJS.Timeout | undefined;

    const initPromise = Promise.resolve().then(async () => {
      return onInit();
    });

    const timerPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`onInit timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      await Promise.race([initPromise, timerPromise]);
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(String(error ?? 'Unknown error'));
      const message = `Plugin ${plugin.name} onInit failed: ${err.message}`;

      this.logger.error(message, err.stack);

      if (plugin.onError) {
        try {
          plugin.onError(err);
        } catch (subError) {
          this.logger.error(
            `Plugin ${plugin.name} onError threw an error`,
            (subError as Error)?.stack,
          );
        }
      }

      throw new Error(message);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async executeDestroy(plugin: PluginLifecycle) {
    const onDestroy = plugin.onDestroy;
    if (!onDestroy) {
      return;
    }

    try {
      await Promise.resolve(onDestroy());
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(String(error ?? 'Unknown error'));
      const message = `Plugin ${plugin.name} onDestroy failed: ${err.message}`;
      this.logger.error(message, err.stack);

      if (plugin.onError) {
        try {
          plugin.onError(err);
        } catch (subError) {
          this.logger.error(
            `Plugin ${plugin.name} onError threw an error during destroy`,
            (subError as Error)?.stack,
          );
        }
      }

      throw new Error(message);
    }
  }
}
