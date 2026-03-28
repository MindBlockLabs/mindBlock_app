import { NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  PluginInterface,
  PluginMetadata,
  PluginConfig,
  PluginContext
} from '../common/interfaces/plugin.interface';

/**
 * Example Plugin Template
 *
 * This is a template for creating custom middleware plugins for the @mindblock/middleware package.
 *
 * Usage:
 * 1. Copy this file to your plugin project
 * 2. Implement the required methods (getMiddleware, etc.)
 * 3. Export an instance or class from your plugin's main entry point
 * 4. Add plugin configuration to your package.json
 */
export class ExamplePlugin implements PluginInterface {
  private readonly logger = new Logger('ExamplePlugin');
  private isInitialized = false;

  // Required: Plugin metadata
  metadata: PluginMetadata = {
    id: 'com.example.plugin.demo',
    name: 'Example Plugin',
    description: 'A template example plugin for middleware',
    version: '1.0.0',
    author: 'Your Name/Organization',
    homepage: 'https://github.com/your-org/plugin-example',
    license: 'MIT',
    keywords: ['example', 'template', 'middleware'],
    priority: 10,
    autoLoad: false
  };

  /**
   * Optional: Called when plugin is first loaded
   */
  async onLoad(context: PluginContext): Promise<void> {
    this.logger.log('Plugin loaded');
    // Perform initial setup: validate dependencies, check environment, etc.
  }

  /**
   * Optional: Called when plugin is initialized with configuration
   */
  async onInit(config: PluginConfig, context: PluginContext): Promise<void> {
    this.logger.log('Plugin initialized with config:', config);
    this.isInitialized = true;
    // Initialize based on provided configuration
  }

  /**
   * Optional: Called when plugin is activated
   */
  async onActivate(context: PluginContext): Promise<void> {
    this.logger.log('Plugin activated');
    // Perform activation tasks (start services, open connections, etc.)
  }

  /**
   * Optional: Called when plugin is deactivated
   */
  async onDeactivate(context: PluginContext): Promise<void> {
    this.logger.log('Plugin deactivated');
    // Perform cleanup (stop services, close connections, etc.)
  }

  /**
   * Optional: Called when plugin is unloaded
   */
  async onUnload(context: PluginContext): Promise<void> {
    this.logger.log('Plugin unloaded');
    // Final cleanup
  }

  /**
   * Optional: Called when plugin is reloaded
   */
  async onReload(config: PluginConfig, context: PluginContext): Promise<void> {
    this.logger.log('Plugin reloaded with new config:', config);
    await this.onDeactivate(context);
    await this.onInit(config, context);
    await this.onActivate(context);
  }

  /**
   * Optional: Validate provided configuration
   */
  validateConfig(config: PluginConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.options) {
      // Add your validation logic here
      if (config.options.someRequiredField === undefined) {
        errors.push('someRequiredField is required');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Optional: Get list of plugin dependencies
   */
  getDependencies(): string[] {
    return []; // Return IDs of plugins that must be loaded before this one
  }

  /**
   * Export the middleware (if this plugin provides a middleware)
   */
  getMiddleware(): NestMiddleware {
    return {
      use: (req: Request, res: Response, next: NextFunction) => {
        this.logger.log(`Example middleware - ${req.method} ${req.path}`);
        
        // Your middleware logic here
        // Example: add custom header
        res.setHeader('X-Example-Plugin', 'active');

        // Continue to next middleware
        next();
      }
    };
  }

  /**
   * Optional: Export additional utilities/helpers from the plugin
   */
  getExports(): Record<string, any> {
    return {
      exampleFunction: () => 'Hello from example plugin',
      exampleValue: 42
    };
  }

  /**
   * Custom method example
   */
  customMethod(data: string): string {
    if (!this.isInitialized) {
      throw new Error('Plugin not initialized');
    }
    return `Processed: ${data}`;
  }
}

// Export as default for easier importing
export default ExamplePlugin;

/**
 * Plugin package.json configuration example:
 *
 * {
 *   "name": "@yourorg/plugin-example",
 *   "version": "1.0.0",
 *   "description": "Example middleware plugin",
 *   "main": "dist/example.plugin.js",
 *   "types": "dist/example.plugin.d.ts",
 *   "license": "MIT",
 *   "keywords": ["mindblock", "plugin", "middleware"],
 *   "mindblockPlugin": {
 *     "version": "^1.0.0",
 *     "priority": 10,
 *     "autoLoad": false,
 *     "configSchema": {
 *       "type": "object",
 *       "properties": {
 *         "enabled": { "type": "boolean", "default": true },
 *         "options": {
 *           "type": "object",
 *           "properties": {
 *             "someRequiredField": { "type": "string" }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "dependencies": {
 *     "@nestjs/common": "^11.0.0",
 *     "@mindblock/middleware": "^1.0.0"
 *   },
 *   "devDependencies": {
 *     "@types/express": "^5.0.0",
 *     "@types/node": "^20.0.0",
 *     "typescript": "^5.0.0"
 *   }
 * }
 */
