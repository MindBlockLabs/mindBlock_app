/**
 * Plugin lifecycle interface for defining initialization and destruction order
 */
export enum PluginPriority {
  CRITICAL = 0,    // Core plugins that must initialize first
  HIGH = 1,        // Important plugins
  NORMAL = 2,      // Standard plugins
  LOW = 3,         // Optional plugins that can wait
}

export interface IPlugin {
  /** Unique identifier for the plugin */
  readonly name: string;
  
  /** Version of the plugin */
  readonly version: string;
  
  /** Priority level determining initialization order */
  readonly priority?: PluginPriority;
  
  /** Dependencies that must be initialized before this plugin */
  readonly dependencies?: string[];
  
  /** Initialize the plugin - called in registration order */
  onInit?(): Promise<void>;
  
  /** Destroy the plugin - called in reverse registration order */
  onDestroy?(): Promise<void>;
  
  /** Called when plugin is about to be unregistered */
  onUnregister?(): Promise<void>;
}

export interface PluginRegistration {
  plugin: IPlugin;
  registeredAt: number;
  initialized: boolean;
  destroyed: boolean;
  error?: Error;
}
