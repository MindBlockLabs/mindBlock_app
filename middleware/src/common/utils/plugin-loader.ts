import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as semver from 'semver';

import {
  PluginInterface,
  PluginMetadata,
  PluginConfig,
  PluginContext,
  LoadedPlugin,
  PluginPackageJson,
  PluginValidationResult,
  PluginSearchCriteria
} from '../interfaces/plugin.interface';
import {
  PluginLoadError,
  PluginNotFoundError,
  PluginAlreadyLoadedError,
  PluginConfigError,
  PluginDependencyError,
  PluginVersionError,
  PluginInitError,
  PluginResolutionError,
  InvalidPluginPackageError
} from '../interfaces/plugin.errors';

/**
 * Plugin Loader Configuration
 */
export interface PluginLoaderConfig {
  /** Directories to search for plugins (node_modules by default) */
  searchPaths?: string[];

  /** Plugin name prefix to identify plugins (e.g., "@mindblock/plugin-") */
  pluginNamePrefix?: string;

  /** Middleware package version for compatibility checks */
  middlewareVersion?: string;

  /** Whether to auto-load plugins marked with autoLoad: true */
  autoLoadEnabled?: boolean;

  /** Maximum number of plugins to load */
  maxPlugins?: number;

  /** Whether to validate plugins strictly */
  strictMode?: boolean;

  /** Custom logger instance */
  logger?: Logger;
}

/**
 * Plugin Loader Service
 *
 * Responsible for:
 * - Discovering npm packages that contain middleware plugins
 * - Loading and instantiating plugins
 * - Managing plugin lifecycle (load, init, activate, deactivate, unload)
 * - Validating plugin configuration and dependencies
 * - Providing plugin registry and search capabilities
 */
@Injectable()
export class PluginLoader {
  private readonly logger: Logger;
  private readonly searchPaths: string[];
  private readonly pluginNamePrefix: string;
  private readonly middlewareVersion: string;
  private readonly autoLoadEnabled: boolean;
  private readonly maxPlugins: number;
  private readonly strictMode: boolean;

  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private pluginContext: PluginContext;

  constructor(config: PluginLoaderConfig = {}) {
    this.logger = config.logger || new Logger('PluginLoader');
    this.searchPaths = config.searchPaths || this.getDefaultSearchPaths();
    this.pluginNamePrefix = config.pluginNamePrefix || '@mindblock/plugin-';
    this.middlewareVersion = config.middlewareVersion || '1.0.0';
    this.autoLoadEnabled = config.autoLoadEnabled !== false;
    this.maxPlugins = config.maxPlugins || 100;
    this.strictMode = config.strictMode !== false;

    this.pluginContext = {
      logger: this.logger,
      env: process.env,
      plugins: this.loadedPlugins,
      config: {}
    };
  }

  /**
   * Get default search paths for plugins
   */
  private getDefaultSearchPaths(): string[] {
    const nodeModulesPath = this.resolveNodeModulesPath();
    return [nodeModulesPath];
  }

  /**
   * Resolve the node_modules path
   */
  private resolveNodeModulesPath(): string {
    try {
      const nodeModulesPath = require.resolve('npm').split('node_modules')[0] + 'node_modules';
      if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
      }
    } catch (error) {
      // Fallback
    }

    // Fallback to relative path
    return path.resolve(process.cwd(), 'node_modules');
  }

  /**
   * Discover all available plugins in search paths
   */
  async discoverPlugins(): Promise<PluginPackageJson[]> {
    const discoveredPlugins: Map<string, PluginPackageJson> = new Map();

    for (const searchPath of this.searchPaths) {
      if (!fs.existsSync(searchPath)) {
        this.logger.warn(`Search path does not exist: ${searchPath}`);
        continue;
      }

      try {
        const entries = fs.readdirSync(searchPath);

        for (const entry of entries) {
          // Check for scoped packages (@organization/plugin-name)
          if (entry.startsWith('@')) {
            const scopedPath = path.join(searchPath, entry);
            if (!fs.statSync(scopedPath).isDirectory()) continue;

            const scopedEntries = fs.readdirSync(scopedPath);
            for (const scopedEntry of scopedEntries) {
              if (this.isPluginPackage(scopedEntry)) {
                const pluginPackageJson = this.loadPluginPackageJson(
                  path.join(scopedPath, scopedEntry)
                );
                if (pluginPackageJson) {
                  discoveredPlugins.set(pluginPackageJson.name, pluginPackageJson);
                }
              }
            }
          } else if (this.isPluginPackage(entry)) {
            const pluginPackageJson = this.loadPluginPackageJson(path.join(searchPath, entry));
            if (pluginPackageJson) {
              discoveredPlugins.set(pluginPackageJson.name, pluginPackageJson);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error discovering plugins in ${searchPath}:`, error.message);
      }
    }

    return Array.from(discoveredPlugins.values());
  }

  /**
   * Check if a package is a valid plugin package
   */
  private isPluginPackage(packageName: string): boolean {
    // Check if it starts with the plugin prefix
    if (!packageName.includes('plugin-') && !packageName.startsWith('@mindblock/')) {
      return false;
    }
    return packageName.includes('plugin-');
  }

  /**
   * Load plugin package.json
   */
  private loadPluginPackageJson(pluginPath: string): PluginPackageJson | null {
    try {
      const packageJsonPath = path.join(pluginPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return null;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Validate that it has plugin configuration
      if (!packageJson.mindblockPlugin && !packageJson.main) {
        return null;
      }

      return packageJson;
    } catch (error) {
      this.logger.debug(`Failed to load package.json from ${pluginPath}:`, error.message);
      return null;
    }
  }

  /**
   * Load a plugin from an npm package
   */
  async loadPlugin(pluginName: string, config?: PluginConfig): Promise<LoadedPlugin> {
    // Check if already loaded
    if (this.loadedPlugins.has(pluginName)) {
      throw new PluginAlreadyLoadedError(pluginName);
    }

    // Check plugin limit
    if (this.loadedPlugins.size >= this.maxPlugins) {
      throw new PluginLoadError(pluginName, `Maximum plugin limit (${this.maxPlugins}) reached`);
    }

    try {
      // Resolve plugin module
      const pluginModule = await this.resolvePluginModule(pluginName);
      if (!pluginModule) {
        throw new PluginResolutionError(pluginName, 'Module not found');
      }

      // Load plugin instance
      const pluginInstance = this.instantiatePlugin(pluginModule);

      // Validate plugin interface
      this.validatePluginInterface(pluginInstance);

      // Get metadata
      const metadata = pluginInstance.metadata;

      // Validate version compatibility
      if (metadata.requiredMiddlewareVersion) {
        this.validateVersionCompatibility(pluginName, metadata.requiredMiddlewareVersion);
      }

      // Check dependencies
      const dependencies = pluginInstance.getDependencies?.() || [];
      this.validateDependencies(pluginName, dependencies);

      // Validate configuration
      const pluginConfig = config || { enabled: true };
      if (pluginInstance.validateConfig) {
        const validationResult = pluginInstance.validateConfig(pluginConfig);
        if (!validationResult.valid) {
          throw new PluginConfigError(pluginName, validationResult.errors);
        }
      }

      // Call onLoad hook
      if (pluginInstance.onLoad) {
        await pluginInstance.onLoad(this.pluginContext);
      }

      // Create loaded plugin entry
      const loadedPlugin: LoadedPlugin = {
        id: metadata.id,
        metadata,
        instance: pluginInstance,
        config: pluginConfig,
        active: false,
        loadedAt: new Date(),
        dependencies
      };

      // Store loaded plugin
      this.loadedPlugins.set(metadata.id, loadedPlugin);

      this.logger.log(`✓ Plugin loaded: ${metadata.id} (v${metadata.version})`);

      return loadedPlugin;
    } catch (error) {
      if (error instanceof PluginLoadError || error instanceof PluginConfigError || 
          error instanceof PluginDependencyError || error instanceof PluginResolutionError) {
        throw error;
      }
      throw new PluginLoadError(pluginName, error.message, error);
    }
  }

  /**
   * Resolve plugin module from npm package
   */
  private async resolvePluginModule(pluginName: string): Promise<any> {
    try {
      // Try direct require
      return require(pluginName);
    } catch (error) {
      try {
        // Try from node_modules
        for (const searchPath of this.searchPaths) {
          const pluginPath = path.join(searchPath, pluginName);
          if (fs.existsSync(pluginPath)) {
            const packageJsonPath = path.join(pluginPath, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const main = packageJson.main || 'index.js';
            const mainPath = path.join(pluginPath, main);

            if (fs.existsSync(mainPath)) {
              return require(mainPath);
            }
          }
        }

        throw new Error(`Plugin module not found in any search path`);
      } catch (innerError) {
        throw new PluginResolutionError(pluginName, innerError.message);
      }
    }
  }

  /**
   * Instantiate plugin from module
   */
  private instantiatePlugin(pluginModule: any): PluginInterface {
    // Check if it's a class or instance
    if (pluginModule.default) {
      return new pluginModule.default();
    } else if (typeof pluginModule === 'function') {
      return new pluginModule();
    } else if (typeof pluginModule === 'object' && pluginModule.metadata) {
      return pluginModule;
    }

    throw new PluginLoadError('Unknown', 'Plugin module must export a class, function, or object with metadata');
  }

  /**
   * Validate plugin interface
   */
  private validatePluginInterface(plugin: any): void {
    const errors: string[] = [];

    // Check metadata
    if (!plugin.metadata) {
      errors.push('Missing required property: metadata');
    } else {
      const metadata = plugin.metadata;
      if (!metadata.id) errors.push('Missing required metadata.id');
      if (!metadata.name) errors.push('Missing required metadata.name');
      if (!metadata.version) errors.push('Missing required metadata.version');
      if (!metadata.description) errors.push('Missing required metadata.description');
    }

    if (errors.length > 0) {
      throw new InvalidPluginPackageError('', errors);
    }
  }

  /**
   * Validate version compatibility
   */
  private validateVersionCompatibility(pluginId: string, requiredVersion: string): void {
    if (!semver.satisfies(this.middlewareVersion, requiredVersion)) {
      throw new PluginVersionError(
        pluginId,
        requiredVersion,
        this.middlewareVersion
      );
    }
  }

  /**
   * Validate plugin dependencies
   */
  private validateDependencies(pluginId: string, dependencies: string[]): void {
    const missingDeps = dependencies.filter(dep => !this.loadedPlugins.has(dep));

    if (missingDeps.length > 0) {
      if (this.strictMode) {
        throw new PluginDependencyError(pluginId, missingDeps);
      } else {
        this.logger.warn(`Plugin ${pluginId} has unmet dependencies:`, missingDeps.join(', '));
      }
    }
  }

  /**
   * Initialize a loaded plugin
   */
  async initPlugin(pluginId: string, config?: PluginConfig): Promise<void> {
    const loadedPlugin = this.loadedPlugins.get(pluginId);
    if (!loadedPlugin) {
      throw new PluginNotFoundError(pluginId);
    }

    try {
      const mergedConfig = { ...loadedPlugin.config, ...config };

      // Call onInit hook
      if (loadedPlugin.instance.onInit) {
        await loadedPlugin.instance.onInit(mergedConfig, this.pluginContext);
      }

      loadedPlugin.config = mergedConfig;
      this.logger.log(`✓ Plugin initialized: ${pluginId}`);
    } catch (error) {
      throw new PluginInitError(pluginId, error.message, error);
    }
  }

  /**
   * Activate a loaded plugin
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const loadedPlugin = this.loadedPlugins.get(pluginId);
    if (!loadedPlugin) {
      throw new PluginNotFoundError(pluginId);
    }

    try {
      // Call onActivate hook
      if (loadedPlugin.instance.onActivate) {
        await loadedPlugin.instance.onActivate(this.pluginContext);
      }

      loadedPlugin.active = true;
      this.logger.log(`✓ Plugin activated: ${pluginId}`);
    } catch (error) {
      throw new PluginInitError(pluginId, `Activation failed: ${error.message}`, error);
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const loadedPlugin = this.loadedPlugins.get(pluginId);
    if (!loadedPlugin) {
      throw new PluginNotFoundError(pluginId);
    }

    try {
      // Call onDeactivate hook
      if (loadedPlugin.instance.onDeactivate) {
        await loadedPlugin.instance.onDeactivate(this.pluginContext);
      }

      loadedPlugin.active = false;
      this.logger.log(`✓ Plugin deactivated: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Error deactivating plugin ${pluginId}:`, error.message);
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const loadedPlugin = this.loadedPlugins.get(pluginId);
    if (!loadedPlugin) {
      throw new PluginNotFoundError(pluginId);
    }

    try {
      // Deactivate first if active
      if (loadedPlugin.active) {
        await this.deactivatePlugin(pluginId);
      }

      // Call onUnload hook
      if (loadedPlugin.instance.onUnload) {
        await loadedPlugin.instance.onUnload(this.pluginContext);
      }

      this.loadedPlugins.delete(pluginId);
      this.logger.log(`✓ Plugin unloaded: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Error unloading plugin ${pluginId}:`, error.message);
    }
  }

  /**
   * Reload a plugin (update config without full unload)
   */
  async reloadPlugin(pluginId: string, config?: PluginConfig): Promise<void> {
    const loadedPlugin = this.loadedPlugins.get(pluginId);
    if (!loadedPlugin) {
      throw new PluginNotFoundError(pluginId);
    }

    try {
      const mergedConfig = { ...loadedPlugin.config, ...config };

      // Call onReload hook
      if (loadedPlugin.instance.onReload) {
        await loadedPlugin.instance.onReload(mergedConfig, this.pluginContext);
      } else {
        // Fallback to deactivate + reactivate
        if (loadedPlugin.active) {
          await this.deactivatePlugin(pluginId);
        }
        loadedPlugin.config = mergedConfig;
        await this.activatePlugin(pluginId);
      }

      loadedPlugin.config = mergedConfig;
      this.logger.log(`✓ Plugin reloaded: ${pluginId}`);
    } catch (error) {
      throw new PluginInitError(pluginId, `Reload failed: ${error.message}`, error);
    }
  }

  /**
   * Get a loaded plugin by ID
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get active plugins only
   */
  getActivePlugins(): LoadedPlugin[] {
    return this.getAllPlugins().filter(p => p.active);
  }

  /**
   * Search plugins by criteria
   */
  searchPlugins(criteria: PluginSearchCriteria): LoadedPlugin[] {
    let results = this.getAllPlugins();

    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(
        p => p.metadata.id.toLowerCase().includes(query) ||
        p.metadata.name.toLowerCase().includes(query)
      );
    }

    if (criteria.keywords && criteria.keywords.length > 0) {
      results = results.filter(
        p => p.metadata.keywords && 
        criteria.keywords.some(kw => p.metadata.keywords.includes(kw))
      );
    }

    if (criteria.author) {
      results = results.filter(p => p.metadata.author?.toLowerCase() === criteria.author.toLowerCase());
    }

    if (criteria.enabled !== undefined) {
      results = results.filter(p => (p.config.enabled ?? true) === criteria.enabled);
    }

    if (criteria.active !== undefined) {
      results = results.filter(p => p.active === criteria.active);
    }

    if (criteria.priority) {
      results = results.filter(p => {
        const priority = p.metadata.priority ?? 0;
        if (criteria.priority.min !== undefined && priority < criteria.priority.min) return false;
        if (criteria.priority.max !== undefined && priority > criteria.priority.max) return false;
        return true;
      });
    }

    return results.sort((a, b) => (b.metadata.priority ?? 0) - (a.metadata.priority ?? 0));
  }

  /**
   * Validate plugin configuration
   */
  validatePluginConfig(pluginId: string, config: PluginConfig): PluginValidationResult {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return {
        valid: false,
        errors: [`Plugin not found: ${pluginId}`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate using plugin's validator if available
    if (plugin.instance.validateConfig) {
      const result = plugin.instance.validateConfig(config);
      errors.push(...result.errors);
    }

    // Check if disabled plugins should not be configured
    if (config.enabled === false && config.options) {
      warnings.push('Plugin is disabled but options are provided');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get plugin statistics
   */
  getStatistics(): {
    totalLoaded: number;
    totalActive: number;
    totalDisabled: number;
    plugins: Array<{ id: string; name: string; version: string; active: boolean; priority: number }>;
  } {
    const plugins = this.getAllPlugins().sort((a, b) => (b.metadata.priority ?? 0) - (a.metadata.priority ?? 0));

    return {
      totalLoaded: plugins.length,
      totalActive: plugins.filter(p => p.active).length,
      totalDisabled: plugins.filter(p => !p.config.enabled).length,
      plugins: plugins.map(p => ({
        id: p.metadata.id,
        name: p.metadata.name,
        version: p.metadata.version,
        active: p.active,
        priority: p.metadata.priority ?? 0
      }))
    };
  }
}
