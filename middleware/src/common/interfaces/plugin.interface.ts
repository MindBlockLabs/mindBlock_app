import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Semantic version constraint for plugin compatibility.
 * Supports semver ranges like "^1.0.0", "~1.2.0", "1.x", etc.
 */
export type VersionConstraint = string;

/**
 * Metadata about the plugin.
 */
export interface PluginMetadata {
  /** Unique identifier for the plugin (e.g., @mindblock/plugin-rate-limit) */
  id: string;

  /** Display name of the plugin */
  name: string;

  /** Short description of what the plugin does */
  description: string;

  /** Current version of the plugin (must follow semver) */
  version: string;

  /** Plugin author or organization */
  author?: string;

  /** URL for the plugin's GitHub repository, documentation, or home page */
  homepage?: string;

  /** License identifier (e.g., MIT, Apache-2.0) */
  license?: string;

  /** List of keywords for discoverability */
  keywords?: string[];

  /** Required middleware package version (e.g., "^1.0.0") */
  requiredMiddlewareVersion?: VersionConstraint;

  /** Execution priority: lower runs first, higher runs last (default: 0) */
  priority?: number;

  /** Whether this plugin should be loaded automatically */
  autoLoad?: boolean;

  /** Configuration schema for the plugin (JSON Schema format) */
  configSchema?: Record<string, any>;

  /** Custom metadata */
  [key: string]: any;
}

/**
 * Plugin context provided during initialization.
 * Gives plugin access to shared services and utilities.
 */
export interface PluginContext {
  /** Logger instance for the plugin */
  logger?: any;

  /** Environment variables */
  env?: NodeJS.ProcessEnv;

  /** Application configuration */
  config?: Record<string, any>;

  /** Access to other loaded plugins */
  plugins?: Map<string, PluginInterface>;

  /** Custom context data */
  [key: string]: any;
}

/**
 * Plugin configuration passed at runtime.
 */
export interface PluginConfig {
  /** Whether the plugin is enabled */
  enabled?: boolean;

  /** Plugin-specific options */
  options?: Record<string, any>;

  /** Custom metadata */
  [key: string]: any;
}

/**
 * Plugin lifecycle hooks.
 */
export interface PluginHooks {
  /**
   * Called when the plugin is being loaded.
   * Useful for validation, setup, or dependency checks.
   */
  onLoad?: (context: PluginContext) => Promise<void> | void;

  /**
   * Called when the plugin is being initialized with configuration.
   */
  onInit?: (config: PluginConfig, context: PluginContext) => Promise<void> | void;

  /**
   * Called when the plugin is being activated for use.
   */
  onActivate?: (context: PluginContext) => Promise<void> | void;

  /**
   * Called when the plugin is being deactivated.
   */
  onDeactivate?: (context: PluginContext) => Promise<void> | void;

  /**
   * Called when the plugin is being unloaded or destroyed.
   */
  onUnload?: (context: PluginContext) => Promise<void> | void;

  /**
   * Called to reload the plugin (without fully unloading it).
   */
  onReload?: (config: PluginConfig, context: PluginContext) => Promise<void> | void;
}

/**
 * Core Plugin Interface.
 * All plugins must implement this interface to be loadable by the plugin loader.
 */
export interface PluginInterface extends PluginHooks {
  /** Plugin metadata */
  metadata: PluginMetadata;

  /** Get the exported middleware (if this plugin exports middleware) */
  getMiddleware?(): NestMiddleware | ((req: Request, res: Response, next: NextFunction) => void | Promise<void>);

  /** Get additional exports from the plugin */
  getExports?(): Record<string, any>;

  /** Validate plugin configuration */
  validateConfig?(config: PluginConfig): { valid: boolean; errors: string[] };

  /** Get plugin dependencies (list of required plugins) */
  getDependencies?(): string[];

  /** Custom method for plugin-specific operations */
  [key: string]: any;
}

/**
 * Plugin Package definition (from package.json).
 */
export interface PluginPackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string | { name?: string; email?: string; url?: string };
  homepage?: string;
  repository?:
    | string
    | {
        type?: string;
        url?: string;
        directory?: string;
      };
  license?: string;
  keywords?: string[];
  main?: string;
  types?: string;
  // Plugin-specific fields
  mindblockPlugin?: {
    version?: VersionConstraint;
    priority?: number;
    autoLoad?: boolean;
    configSchema?: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Represents a loaded plugin instance.
 */
export interface LoadedPlugin {
  /** Plugin ID */
  id: string;

  /** Plugin metadata */
  metadata: PluginMetadata;

  /** Actual plugin instance */
  instance: PluginInterface;

  /** Plugin configuration */
  config: PluginConfig;

  /** Whether the plugin is currently active */
  active: boolean;

  /** Timestamp when plugin was loaded */
  loadedAt: Date;

  /** Plugin dependencies metadata */
  dependencies: string[];
}

/**
 * Plugin search/filter criteria.
 */
export interface PluginSearchCriteria {
  /** Search by plugin ID or name */
  query?: string;

  /** Filter by plugin keywords */
  keywords?: string[];

  /** Filter by author */
  author?: string;

  /** Filter by enabled status */
  enabled?: boolean;

  /** Filter by active status */
  active?: boolean;

  /** Filter by priority range */
  priority?: { min?: number; max?: number };
}

/**
 * Plugin validation result.
 */
export interface PluginValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Error messages if validation failed */
  errors: string[];

  /** Warning messages */
  warnings: string[];

  /** Additional metadata about validation */
  metadata?: Record<string, any>;
}
