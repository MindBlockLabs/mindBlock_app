import { Injectable, Logger } from '@nestjs/common';
import { IPlugin, PluginPriority, PluginRegistration } from './plugin.interface';

/**
 * PluginManager handles the lifecycle of plugins ensuring correct initialization
 * and destruction order based on priority and dependencies.
 * 
 * Features:
 * - onInit() called in registration order (by priority)
 * - onDestroy() called in reverse registration order
 * - Dependency validation to prevent circular dependencies
 * - Error handling for plugin lifecycle methods
 */
@Injectable()
export class PluginManager {
  private readonly logger = new Logger(PluginManager.name);
  private readonly plugins: Map<string, PluginRegistration> = new Map();
  private initializationOrder: string[] = [];
  
  /**
   * Register a plugin with the manager
   * @param plugin - The plugin to register
   * @throws Error if plugin name already exists or circular dependency detected
   */
  async register(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    
    // Validate dependencies exist and no circular dependencies
    this.validateDependencies(plugin);
    
    const registration: PluginRegistration = {
      plugin,
      registeredAt: Date.now(),
      initialized: false,
      destroyed: false,
    };
    
    this.plugins.set(plugin.name, registration);
    this.logger.log(`Plugin "${plugin.name}" v${plugin.version} registered`);
    
    // Initialize immediately if manager is already initialized
    if (this.initializationOrder.length > 0) {
      await this.initializePlugin(registration);
    }
  }
  
  /**
   * Unregister a plugin, destroying it first if initialized
   * @param pluginName - Name of the plugin to unregister
   */
  async unregister(pluginName: string): Promise<void> {
    const registration = this.plugins.get(pluginName);
    if (!registration) {
      this.logger.warn(`Plugin "${pluginName}" not found, skipping unregister`);
      return;
    }
    
    try {
      // Destroy if initialized
      if (registration.initialized && !registration.destroyed) {
        await this.destroyPlugin(registration);
      }
      
      // Call onUnregister if defined
      if (registration.plugin.onUnregister) {
        await registration.plugin.onUnregister();
      }
      
      this.plugins.delete(pluginName);
      this.initializationOrder = this.initializationOrder.filter(name => name !== pluginName);
      this.logger.log(`Plugin "${pluginName}" unregistered`);
    } catch (error) {
      this.logger.error(
        `Error unregistering plugin "${pluginName}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * Initialize all registered plugins in the correct order
   * Order: by priority (CRITICAL → HIGH → NORMAL → LOW), then by registration time
   */
  async initializeAll(): Promise<void> {
    this.logger.log('Initializing all plugins...');
    
    // Sort plugins by priority and registration order
    const sortedPlugins = Array.from(this.plugins.values()).sort((a, b) => {
      const priorityA = a.plugin.priority ?? PluginPriority.NORMAL;
      const priorityB = b.plugin.priority ?? PluginPriority.NORMAL;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Same priority: use registration order
      return a.registeredAt - b.registeredAt;
    });
    
    // Initialize each plugin in order
    for (const registration of sortedPlugins) {
      if (!registration.initialized && !registration.destroyed) {
        await this.initializePlugin(registration);
      }
    }
    
    this.logger.log(`Successfully initialized ${this.initializationOrder.length} plugins`);
  }
  
  /**
   * Destroy all plugins in reverse order
   */
  async destroyAll(): Promise<void> {
    this.logger.log('Destroying all plugins in reverse order...');
    
    // Destroy in reverse initialization order
    for (let i = this.initializationOrder.length - 1; i >= 0; i--) {
      const pluginName = this.initializationOrder[i];
      const registration = this.plugins.get(pluginName);
      
      if (registration && registration.initialized && !registration.destroyed) {
        await this.destroyPlugin(registration);
      }
    }
    
    this.logger.log('All plugins destroyed');
  }
  
  /**
   * Get a plugin by name
   */
  getPlugin<T extends IPlugin>(name: string): T | undefined {
    const registration = this.plugins.get(name);
    return registration?.plugin as T;
  }
  
  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values()).map(reg => reg.plugin);
  }
  
  /**
   * Get initialization status
   */
  getInitializationStatus(): { initialized: string[]; pending: string[]; failed: string[] } {
    const initialized: string[] = [];
    const pending: string[] = [];
    const failed: string[] = [];
    
    for (const [name, registration] of this.plugins) {
      if (registration.error) {
        failed.push(name);
      } else if (registration.initialized) {
        initialized.push(name);
      } else {
        pending.push(name);
      }
    }
    
    return { initialized, pending, failed };
  }
  
  /**
   * Validate that dependencies don't create circular references
   */
  private validateDependencies(plugin: IPlugin): void {
    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return;
    }
    
    // Check if all dependencies are registered
    for (const depName of plugin.dependencies) {
      if (!this.plugins.has(depName)) {
        this.logger.warn(
          `Plugin "${plugin.name}" depends on "${depName}" which is not yet registered. ` +
          'Ensure it is registered before this plugin.'
        );
      }
    }
    
    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (currentName: string): boolean => {
      if (recursionStack.has(currentName)) {
        return true;
      }
      
      if (visited.has(currentName)) {
        return false;
      }
      
      visited.add(currentName);
      recursionStack.add(currentName);
      
      const currentReg = this.plugins.get(currentName);
      if (currentReg && currentReg.plugin.dependencies) {
        for (const dep of currentReg.plugin.dependencies) {
          if (hasCycle(dep)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(currentName);
      return false;
    };
    
    // Temporarily add current plugin to check for cycles
    this.plugins.set(plugin.name, {
      plugin,
      registeredAt: Date.now(),
      initialized: false,
      destroyed: false,
    });
    
    if (hasCycle(plugin.name)) {
      this.plugins.delete(plugin.name);
      throw new Error(
        `Circular dependency detected involving plugin "${plugin.name}". ` +
        `Dependencies: ${plugin.dependencies.join(', ')}`
      );
    }
    
    this.plugins.delete(plugin.name);
  }
  
  /**
   * Initialize a single plugin with error handling
   */
  private async initializePlugin(registration: PluginRegistration): Promise<void> {
    const { plugin } = registration;
    
    try {
      this.logger.log(`Initializing plugin "${plugin.name}"...`);
      
      // Initialize dependencies first
      if (plugin.dependencies) {
        for (const depName of plugin.dependencies) {
          const depReg = this.plugins.get(depName);
          if (depReg && !depReg.initialized && !depReg.destroyed) {
            this.logger.log(
              `Initializing dependency "${depName}" before "${plugin.name}"`
            );
            await this.initializePlugin(depReg);
          }
        }
      }
      
      // Call onInit if defined
      if (plugin.onInit) {
        await plugin.onInit();
      }
      
      registration.initialized = true;
      this.initializationOrder.push(plugin.name);
      this.logger.log(`Plugin "${plugin.name}" initialized successfully`);
    } catch (error) {
      registration.error = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to initialize plugin "${plugin.name}": ${registration.error.message}`
      );
      throw registration.error;
    }
  }
  
  /**
   * Destroy a single plugin with error handling
   */
  private async destroyPlugin(registration: PluginRegistration): Promise<void> {
    const { plugin } = registration;
    
    try {
      this.logger.log(`Destroying plugin "${plugin.name}"...`);
      
      if (plugin.onDestroy) {
        await plugin.onDestroy();
      }
      
      registration.destroyed = true;
      this.initializationOrder = this.initializationOrder.filter(
        name => name !== plugin.name
      );
      this.logger.log(`Plugin "${plugin.name}" destroyed successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to destroy plugin "${plugin.name}": ${error instanceof Error ? error.message : String(error)}`
      );
      // Don't throw on destroy errors - continue with other plugins
    }
  }
}
