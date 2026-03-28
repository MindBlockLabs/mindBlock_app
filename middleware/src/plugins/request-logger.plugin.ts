import { Injectable, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  PluginInterface,
  PluginMetadata,
  PluginConfig,
  PluginContext
} from '../common/interfaces/plugin.interface';

/**
 * Request Logger Plugin — First-Party Plugin
 *
 * Logs all HTTP requests with configurable detail levels and filtering.
 * Provides structured logging with request metadata and response information.
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Exclude paths from logging (health checks, metrics, etc.)
 * - Request/response timing information
 * - Response status code logging
 * - Custom header logging
 * - Request ID correlation
 */
@Injectable()
export class RequestLoggerPlugin implements PluginInterface {
  private readonly logger = new Logger('RequestLogger');
  private isInitialized = false;

  // Configuration properties
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
  private excludePaths: string[] = [];
  private logHeaders: boolean = false;
  private logBody: boolean = false;
  private maxBodyLength: number = 500;
  private colorize: boolean = true;
  private requestIdHeader: string = 'x-request-id';

  metadata: PluginMetadata = {
    id: '@mindblock/plugin-request-logger',
    name: 'Request Logger',
    description: 'HTTP request logging middleware with configurable verbosity and filtering',
    version: '1.0.0',
    author: 'MindBlock Team',
    homepage: 'https://github.com/MindBlockLabs/mindBlock_Backend/tree/main/middleware',
    license: 'ISC',
    keywords: ['logging', 'request', 'middleware', 'http', 'first-party'],
    priority: 100, // High priority to log early in the chain
    autoLoad: false,
    configSchema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          default: true,
          description: 'Enable or disable request logging'
        },
        options: {
          type: 'object',
          properties: {
            logLevel: {
              type: 'string',
              enum: ['debug', 'info', 'warn', 'error'],
              default: 'info',
              description: 'Logging verbosity level'
            },
            excludePaths: {
              type: 'array',
              items: { type: 'string' },
              default: ['/health', '/metrics', '/favicon.ico'],
              description: 'Paths to exclude from logging'
            },
            logHeaders: {
              type: 'boolean',
              default: false,
              description: 'Log request and response headers'
            },
            logBody: {
              type: 'boolean',
              default: false,
              description: 'Log request/response body (first N bytes)'
            },
            maxBodyLength: {
              type: 'number',
              default: 500,
              minimum: 0,
              description: 'Maximum body content to log in bytes'
            },
            colorize: {
              type: 'boolean',
              default: true,
              description: 'Add ANSI color codes to log output'
            },
            requestIdHeader: {
              type: 'string',
              default: 'x-request-id',
              description: 'Header name for request correlation ID'
            }
          }
        }
      }
    }
  };

  /**
   * Called when plugin is loaded
   */
  async onLoad(context: PluginContext): Promise<void> {
    this.logger.log('✓ Request Logger plugin loaded');
  }

  /**
   * Called during initialization with configuration
   */
  async onInit(config: PluginConfig, context: PluginContext): Promise<void> {
    if (config.options) {
      this.logLevel = config.options.logLevel ?? 'info';
      this.excludePaths = config.options.excludePaths ?? ['/health', '/metrics', '/favicon.ico'];
      this.logHeaders = config.options.logHeaders ?? false;
      this.logBody = config.options.logBody ?? false;
      this.maxBodyLength = config.options.maxBodyLength ?? 500;
      this.colorize = config.options.colorize ?? true;
      this.requestIdHeader = config.options.requestIdHeader ?? 'x-request-id';
    }

    this.isInitialized = true;
    context.logger?.log(
      `✓ Request Logger initialized with level=${this.logLevel}, excludePaths=${this.excludePaths.join(', ')}`
    );
  }

  /**
   * Called when plugin is activated
   */
  async onActivate(context: PluginContext): Promise<void> {
    this.logger.log('✓ Request Logger activated');
  }

  /**
   * Called when plugin is deactivated
   */
  async onDeactivate(context: PluginContext): Promise<void> {
    this.logger.log('✓ Request Logger deactivated');
  }

  /**
   * Called when plugin is unloaded
   */
  async onUnload(context: PluginContext): Promise<void> {
    this.logger.log('✓ Request Logger unloaded');
  }

  /**
   * Validate plugin configuration
   */
  validateConfig(config: PluginConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.options) {
      if (config.options.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.options.logLevel)) {
        errors.push('logLevel must be one of: debug, info, warn, error');
      }

      if (config.options.maxBodyLength !== undefined && config.options.maxBodyLength < 0) {
        errors.push('maxBodyLength must be >= 0');
      }

      if (config.options.excludePaths && !Array.isArray(config.options.excludePaths)) {
        errors.push('excludePaths must be an array of strings');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get plugin dependencies
   */
  getDependencies(): string[] {
    return []; // No dependencies
  }

  /**
   * Export the logging middleware
   */
  getMiddleware() {
    if (!this.isInitialized) {
      throw new Error('Request Logger plugin not initialized');
    }

    return (req: Request, res: Response, next: NextFunction) => {
      // Skip excluded paths
      if (this.shouldExcludePath(req.path)) {
        return next();
      }

      // Record request start time
      const startTime = Date.now();
      const requestId = this.extractRequestId(req);

      // Capture original send
      const originalSend = res.send;
      let responseBody = '';

      // Override send to capture response
      res.send = function (data: any) {
        if (this.logBody && data) {
          responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        }
        return originalSend.call(this, data);
      };

      // Log on response finish
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logRequest(req, res, duration, requestId, responseBody);
      });

      // Attach request ID to request object for downstream use
      (req as any).requestId = requestId;

      next();
    };
  }

  /**
   * Export utility functions
   */
  getExports() {
    return {
      /**
       * Extract request ID from a request object
       */
      getRequestId: (req: Request): string => {
        return (req as any).requestId || this.extractRequestId(req);
      },

      /**
       * Set current log level
       */
      setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => {
        this.logLevel = level;
      },

      /**
       * Get current log level
       */
      getLogLevel: (): string => this.logLevel,

      /**
       * Add paths to exclude from logging
       */
      addExcludePaths: (...paths: string[]) => {
        this.excludePaths.push(...paths);
      },

      /**
       * Remove paths from exclusion
       */
      removeExcludePaths: (...paths: string[]) => {
        this.excludePaths = this.excludePaths.filter(p => !paths.includes(p));
      },

      /**
       * Get current excluded paths
       */
      getExcludePaths: (): string[] => [...this.excludePaths],

      /**
       * Clear all excluded paths
       */
      clearExcludePaths: () => {
        this.excludePaths = [];
      }
    };
  }

  /**
   * Private helper: Check if path should be excluded
   */
  private shouldExcludePath(path: string): boolean {
    return this.excludePaths.some(excludePath => {
      if (excludePath.includes('*')) {
        const regex = this.globToRegex(excludePath);
        return regex.test(path);
      }
      return path === excludePath || path.startsWith(excludePath);
    });
  }

  /**
   * Private helper: Extract request ID from headers or generate one
   */
  private extractRequestId(req: Request): string {
    const headerValue = req.headers[this.requestIdHeader.toLowerCase()];
    if (typeof headerValue === 'string') {
      return headerValue;
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Private helper: Convert glob pattern to regex
   */
  private globToRegex(glob: string): RegExp {
    const reStr = glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${reStr}$`);
  }

  /**
   * Private helper: Log the request
   */
  private logRequest(req: Request, res: Response, duration: number, requestId: string, responseBody: string): void {
    const method = this.colorize ? this.colorizeMethod(req.method) : req.method;
    const status = this.colorize ? this.colorizeStatus(res.statusCode) : res.statusCode.toString();
    const timestamp = new Date().toISOString();

    let logMessage = `[${timestamp}] ${requestId} ${method} ${req.path} ${status} (${duration}ms)`;

    // Add query string if present
    if (req.query && Object.keys(req.query).length > 0) {
      logMessage += ` - Query: ${JSON.stringify(req.query)}`;
    }

    // Add headers if enabled
    if (this.logHeaders) {
      const relevantHeaders = this.filterHeaders(req.headers);
      if (Object.keys(relevantHeaders).length > 0) {
        logMessage += ` - Headers: ${JSON.stringify(relevantHeaders)}`;
      }
    }

    // Add body if enabled
    if (this.logBody && responseBody) {
      const body = responseBody.substring(0, this.maxBodyLength);
      logMessage += ` - Body: ${body}${responseBody.length > this.maxBodyLength ? '...' : ''}`;
    }

    // Log based on status code
    if (res.statusCode >= 500) {
      this.logger.error(logMessage);
    } else if (res.statusCode >= 400) {
      this.logByLevel('warn', logMessage);
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      this.logByLevel(this.logLevel, logMessage);
    } else {
      this.logByLevel('info', logMessage);
    }
  }

  /**
   * Private helper: Log by level
   */
  private logByLevel(level: string, message: string): void {
    switch (level) {
      case 'debug':
        this.logger.debug(message);
        break;
      case 'info':
        this.logger.log(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      case 'error':
        this.logger.error(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  /**
   * Private helper: Filter headers to exclude sensitive ones
   */
  private filterHeaders(headers: any): Record<string, any> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'password'];
    const filtered: Record<string, any> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Private helper: Colorize HTTP method
   */
  private colorizeMethod(method: string): string {
    const colors: Record<string, string> = {
      GET: '\x1b[36m', // Cyan
      POST: '\x1b[32m', // Green
      PUT: '\x1b[33m', // Yellow
      DELETE: '\x1b[31m', // Red
      PATCH: '\x1b[35m', // Magenta
      HEAD: '\x1b[36m', // Cyan
      OPTIONS: '\x1b[37m' // White
    };

    const color = colors[method] || '\x1b[37m';
    const reset = '\x1b[0m';
    return `${color}${method}${reset}`;
  }

  /**
   * Private helper: Colorize HTTP status code
   */
  private colorizeStatus(status: number): string {
    let color = '\x1b[37m'; // White (default)

    if (status >= 200 && status < 300) {
      color = '\x1b[32m'; // Green (2xx)
    } else if (status >= 300 && status < 400) {
      color = '\x1b[36m'; // Cyan (3xx)
    } else if (status >= 400 && status < 500) {
      color = '\x1b[33m'; // Yellow (4xx)
    } else if (status >= 500) {
      color = '\x1b[31m'; // Red (5xx)
    }

    const reset = '\x1b[0m';
    return `${color}${status}${reset}`;
  }
}

export default RequestLoggerPlugin;
