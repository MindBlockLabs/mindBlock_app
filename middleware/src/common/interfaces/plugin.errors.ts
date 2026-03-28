/**
 * Base error class for plugin-related errors.
 */
export class PluginError extends Error {
  constructor(message: string, public readonly code: string = 'PLUGIN_ERROR', public readonly details?: any) {
    super(message);
    this.name = 'PluginError';
    Object.setPrototypeOf(this, PluginError.prototype);
  }
}

/**
 * Error thrown when a plugin is not found.
 */
export class PluginNotFoundError extends PluginError {
  constructor(pluginId: string, details?: any) {
    super(`Plugin not found: ${pluginId}`, 'PLUGIN_NOT_FOUND', details);
    this.name = 'PluginNotFoundError';
    Object.setPrototypeOf(this, PluginNotFoundError.prototype);
  }
}

/**
 * Error thrown when a plugin fails to load due to missing module or import error.
 */
export class PluginLoadError extends PluginError {
  constructor(pluginId: string, reason?: string, details?: any) {
    super(
      `Failed to load plugin: ${pluginId}${reason ? ` - ${reason}` : ''}`,
      'PLUGIN_LOAD_ERROR',
      details
    );
    this.name = 'PluginLoadError';
    Object.setPrototypeOf(this, PluginLoadError.prototype);
  }
}

/**
 * Error thrown when a plugin is already loaded.
 */
export class PluginAlreadyLoadedError extends PluginError {
  constructor(pluginId: string, details?: any) {
    super(`Plugin already loaded: ${pluginId}`, 'PLUGIN_ALREADY_LOADED', details);
    this.name = 'PluginAlreadyLoadedError';
    Object.setPrototypeOf(this, PluginAlreadyLoadedError.prototype);
  }
}

/**
 * Error thrown when plugin configuration is invalid.
 */
export class PluginConfigError extends PluginError {
  constructor(pluginId: string, errors: string[], details?: any) {
    super(
      `Invalid configuration for plugin: ${pluginId}\n${errors.join('\n')}`,
      'PLUGIN_CONFIG_ERROR',
      details
    );
    this.name = 'PluginConfigError';
    Object.setPrototypeOf(this, PluginConfigError.prototype);
  }
}

/**
 * Error thrown when plugin dependencies are not met.
 */
export class PluginDependencyError extends PluginError {
  constructor(pluginId: string, missingDependencies: string[], details?: any) {
    super(
      `Plugin dependencies not met for: ${pluginId} - Missing: ${missingDependencies.join(', ')}`,
      'PLUGIN_DEPENDENCY_ERROR',
      details
    );
    this.name = 'PluginDependencyError';
    Object.setPrototypeOf(this, PluginDependencyError.prototype);
  }
}

/**
 * Error thrown when plugin version is incompatible.
 */
export class PluginVersionError extends PluginError {
  constructor(
    pluginId: string,
    required: string,
    actual: string,
    details?: any
  ) {
    super(
      `Plugin version mismatch: ${pluginId} requires ${required} but got ${actual}`,
      'PLUGIN_VERSION_ERROR',
      details
    );
    this.name = 'PluginVersionError';
    Object.setPrototypeOf(this, PluginVersionError.prototype);
  }
}

/**
 * Error thrown when plugin initialization fails.
 */
export class PluginInitError extends PluginError {
  constructor(pluginId: string, reason?: string, details?: any) {
    super(
      `Failed to initialize plugin: ${pluginId}${reason ? ` - ${reason}` : ''}`,
      'PLUGIN_INIT_ERROR',
      details
    );
    this.name = 'PluginInitError';
    Object.setPrototypeOf(this, PluginInitError.prototype);
  }
}

/**
 * Error thrown when trying to operate on an inactive plugin.
 */
export class PluginInactiveError extends PluginError {
  constructor(pluginId: string, details?: any) {
    super(`Plugin is not active: ${pluginId}`, 'PLUGIN_INACTIVE', details);
    this.name = 'PluginInactiveError';
    Object.setPrototypeOf(this, PluginInactiveError.prototype);
  }
}

/**
 * Error thrown when plugin package.json is invalid.
 */
export class InvalidPluginPackageError extends PluginError {
  constructor(packagePath: string, errors: string[], details?: any) {
    super(
      `Invalid plugin package.json at ${packagePath}:\n${errors.join('\n')}`,
      'INVALID_PLUGIN_PACKAGE',
      details
    );
    this.name = 'InvalidPluginPackageError';
    Object.setPrototypeOf(this, InvalidPluginPackageError.prototype);
  }
}

/**
 * Error thrown when npm package resolution fails.
 */
export class PluginResolutionError extends PluginError {
  constructor(pluginName: string, reason?: string, details?: any) {
    super(
      `Failed to resolve plugin package: ${pluginName}${reason ? ` - ${reason}` : ''}`,
      'PLUGIN_RESOLUTION_ERROR',
      details
    );
    this.name = 'PluginResolutionError';
    Object.setPrototypeOf(this, PluginResolutionError.prototype);
  }
}
