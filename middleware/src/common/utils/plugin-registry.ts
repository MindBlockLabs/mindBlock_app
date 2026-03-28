import { Injectable, Logger } from '@nestjs/common';
import { PluginLoader, PluginLoaderConfig } from './plugin-loader';
import {
  PluginInterface,
  PluginConfig,
  LoadedPlugin,
  PluginSearchCriteria,
  PluginValidationResult
} from '../interfaces/plugin.interface';
import { PluginNotFoundError, PluginLoadError } from '../interfaces/plugin.errors';

/**
 * Plugin Registry Configuration
 */
export interface PluginRegistryConfig extends PluginLoaderConfig {
  /** Automatically discover and load plugins on initialization */
  autoDiscoverOnInit?: boolean;

  /** Plugins to load automatically */
  autoLoadPlugins?: string[];

  /** Default configuration for all plugins */
  defaultConfig?: PluginConfig;
}

/**
 * Plugin Registry
 *
 * High-level service for managing plugins. Provides:
 * - Plugin discovery and loading
 * - Lifecycle management
 * - Plugin registry operations
 * - Middleware integration
 */
@Injectable()
export class PluginRegistry {
  private readonly logger: Logger;
  private readonly loader: PluginLoader;
  private readonly autoDiscoverOnInit: boolean;
  private readonly autoLoadPlugins: string[];
  private readonly defaultConfig: PluginConfig;
  private initialized: boolean = false;

  constructor(config: PluginRegistryConfig = {}) {
    this.logger = config.logger || new Logger('PluginRegistry');
    this.loader = new PluginLoader(config);
    this.autoDiscoverOnInit = config.autoDiscoverOnInit !== false;
    this.autoLoadPlugins = config.autoLoadPlugins || [];
    this.defaultConfig = config.defaultConfig || { enabled: true };
  }

  /**
   * Initialize the plugin registry
   * - Discover available plugins
   * - Load auto-load plugins
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Plugin registry already initialized');
      return;
    }

    try {
      this.logger.log('🔌 Initializing Plugin Registry...');

      // Discover available plugins
      if (this.autoDiscoverOnInit) {
        this.logger.log('📦 Discovering available plugins...');
        const discovered = await this.loader.discoverPlugins();
        this.logger.log(`✓ Found ${discovered.length} available plugins`);
      }

      // Auto-load configured plugins
      if (this.autoLoadPlugins.length > 0) {
        this.logger.log(`📥 Auto-loading ${this.autoLoadPlugins.length} plugins...`);
        for (const pluginName of this.autoLoadPlugins) {
          try {
            await this.load(pluginName);
          } catch (error) {
            this.logger.warn(`Failed to auto-load plugin ${pluginName}: ${error.message}`);
          }
        }
      }

      this.initialized = true;
      const stats = this.getStatistics();
      this.logger.log(`✓ Plugin Registry initialized - ${stats.totalLoaded} plugins loaded, ${stats.totalActive} active`);
    } catch (error) {
      this.logger.error('Failed to initialize Plugin Registry:', error.message);
      throw error;
    }
  }

  /**
   * Load a plugin
   */
  async load(pluginName: string, config?: PluginConfig): Promise<LoadedPlugin> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    return this.loader.loadPlugin(pluginName, mergedConfig);
  }

  /**
   * Initialize a plugin (setup with configuration)
   */
  async initialize(pluginId: string, config?: PluginConfig): Promise<void> {
    return this.loader.initPlugin(pluginId, config);
  }

  /**
   * Activate a plugin
   */
  async activate(pluginId: string): Promise<void> {
    return this.loader.activatePlugin(pluginId);
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId: string): Promise<void> {
    return this.loader.deactivatePlugin(pluginId);
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    return this.loader.unloadPlugin(pluginId);
  }

  /**
   * Reload a plugin with new configuration
   */
  async reload(pluginId: string, config?: PluginConfig): Promise<void> {
    return this.loader.reloadPlugin(pluginId, config);
  }

  /**
   * Load and activate a plugin in one step
   */
  async loadAndActivate(pluginName: string, config?: PluginConfig): Promise<LoadedPlugin> {
    const loaded = await this.load(pluginName, config);
    await this.initialize(loaded.metadata.id, config);
    await this.activate(loaded.metadata.id);
    return loaded;
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loader.getPlugin(pluginId);
  }

  /**
   * Get plugin by ID or throw error
   */
  getPluginOrThrow(pluginId: string): LoadedPlugin {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new PluginNotFoundError(pluginId);
    }
    return plugin;
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): LoadedPlugin[] {
    return this.loader.getAllPlugins();
  }

  /**
   * Get active plugins only
   */
  getActivePlugins(): LoadedPlugin[] {
    return this.loader.getActivePlugins();
  }

  /**
   * Search plugins
   */
  searchPlugins(criteria: PluginSearchCriteria): LoadedPlugin[] {
    return this.loader.searchPlugins(criteria);
  }

  /**
   * Validate plugin configuration
   */
  validateConfig(pluginId: string, config: PluginConfig): PluginValidationResult {
    return this.loader.validatePluginConfig(pluginId, config);
  }

  /**
   * Get plugin middleware
   */
  getMiddleware(pluginId: string) {
    const plugin = this.getPluginOrThrow(pluginId);

    if (!plugin.instance.getMiddleware) {
      throw new PluginLoadError(
        pluginId,
        'Plugin does not export middleware'
      );
    }

    return plugin.instance.getMiddleware();
  }

  /**
   * Get all plugin middlewares
   */
  getAllMiddleware() {
    const middlewares: Record<string, any> = {};

    for (const plugin of this.getActivePlugins()) {
      if (plugin.instance.getMiddleware && plugin.config.enabled !== false) {
        middlewares[plugin.metadata.id] = plugin.instance.getMiddleware();
      }
    }

    return middlewares;
  }

  /**
   * Get plugin exports
   */
  getExports(pluginId: string): Record<string, any> | undefined {
    const plugin = this.getPluginOrThrow(pluginId);
    return plugin.instance.getExports?.();
  }

  /**
   * Get all plugin exports
   */
  getAllExports(): Record<string, any> {
    const allExports: Record<string, any> = {};

    for (const plugin of this.getAllPlugins()) {
      if (plugin.instance.getExports) {
        const exports = plugin.instance.getExports();
        if (exports) {
          allExports[plugin.metadata.id] = exports;
        }
      }
    }

    return allExports;
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loader.getPlugin(pluginId) !== undefined;
  }

  /**
   * Check if plugin is active
   */
  isActive(pluginId: string): boolean {
    const plugin = this.loader.getPlugin(pluginId);
    return plugin?.active ?? false;
  }

  /**
   * Count plugins
   */
  count(): number {
    return this.getAllPlugins().length;
  }

  /**
   * Count active plugins
   */
  countActive(): number {
    return this.getActivePlugins().length;
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    return this.loader.getStatistics();
  }

  /**
   * Unload all plugins
   */
  async unloadAll(): Promise<void> {
    const plugins = [...this.getAllPlugins()];

    for (const plugin of plugins) {
      try {
        await this.unload(plugin.metadata.id);
      } catch (error) {
        this.logger.error(`Error unloading plugin ${plugin.metadata.id}:`, error.message);
      }
    }

    this.logger.log('✓ All plugins unloaded');
  }

  /**
   * Activate all enabled plugins
   */
  async activateAll(): Promise<void> {
    for (const plugin of this.getAllPlugins()) {
      if (plugin.config.enabled !== false && !plugin.active) {
        try {
          await this.activate(plugin.metadata.id);
        } catch (error) {
          this.logger.error(`Error activating plugin ${plugin.metadata.id}:`, error.message);
        }
      }
    }
  }

  /**
   * Deactivate all plugins
   */
  async deactivateAll(): Promise<void> {
    for (const plugin of this.getActivePlugins()) {
      try {
        await this.deactivate(plugin.metadata.id);
      } catch (error) {
        this.logger.error(`Error deactivating plugin ${plugin.metadata.id}:`, error.message);
      }
    }
  }

  /**
   * Export registry state (for debugging/monitoring)
   */
  exportState(): {
    initialized: boolean;
    totalPlugins: number;
    activePlugins: number;
    plugins: Array<{
      id: string;
      name: string;
      version: string;
      active: boolean;
      enabled: boolean;
      priority: number;
      dependencies: string[];
    }>;
  } {
    return {
      initialized: this.initialized,
      totalPlugins: this.count(),
      activePlugins: this.countActive(),
      plugins: this.getAllPlugins().map(p => ({
        id: p.metadata.id,
        name: p.metadata.name,
        version: p.metadata.version,
        active: p.active,
        enabled: p.config.enabled !== false,
        priority: p.metadata.priority ?? 0,
        dependencies: p.dependencies
      }))
    };
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
