/**
 * My Starter Plugin
 * 
 * This is a starter template for creating MindBlock middleware plugins.
 * Replace this with your plugin's actual implementation.
 */

import { IPlugin, PluginPriority } from '@mindblock/middleware/common';

export interface MyStarterPluginConfig {
  /** Optional API key */
  apiKey?: string;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Enable/disable plugin */
  enabled?: boolean;
}

export class MyStarterPlugin implements IPlugin {
  readonly name = 'my-starter-plugin';
  readonly version = '1.0.0';
  readonly priority = PluginPriority.NORMAL;
  
  private config: MyStarterPluginConfig;
  
  constructor(config: MyStarterPluginConfig = {}) {
    this.config = {
      timeout: 5000,
      enabled: true,
      ...config,
    };
  }
  
  async onInit(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    
    // TODO: Add your initialization logic here
    // Examples:
    // - Set up database connections
    // - Load configuration
    // - Register event handlers
    // - Initialize external services
    
    if (this.config.enabled) {
      console.log(`[${this.name}] Plugin enabled with timeout: ${this.config.timeout}ms`);
    }
    
    console.log(`[${this.name}] Initialized successfully`);
  }
  
  async onDestroy(): Promise<void> {
    console.log(`[${this.name}] Cleaning up...`);
    
    // TODO: Add your cleanup logic here
    // Examples:
    // - Close database connections
    // - Clear timers/intervals
    // - Release resources
    // - Flush buffers
    
    console.log(`[${this.name}] Cleanup complete`);
  }
  
  /**
   * Example method - replace with your plugin's functionality
   */
  async doSomething(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Plugin is disabled');
    }
    
    // TODO: Implement your plugin logic here
    console.log(`[${this.name}] Doing something...`);
  }
}
