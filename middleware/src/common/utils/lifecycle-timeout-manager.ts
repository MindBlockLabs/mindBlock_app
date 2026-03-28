import { Logger } from '@nestjs/common';

/**
 * Lifecycle Timeout Configuration
 */
export interface LifecycleTimeoutConfig {
  onLoad?: number;          // ms
  onInit?: number;          // ms
  onActivate?: number;      // ms
  onDeactivate?: number;    // ms
  onUnload?: number;        // ms
  onReload?: number;        // ms
}

/**
 * Lifecycle Error Context
 * Information about an error that occurred during lifecycle operations
 */
export interface LifecycleErrorContext {
  pluginId: string;
  hook: string;                    // 'onLoad', 'onInit', etc.
  error: Error | null;
  timedOut: boolean;
  startTime: number;
  duration: number;                // Actual execution time in ms
  configuredTimeout?: number;      // Configured timeout in ms
  retryCount: number;
  maxRetries: number;
}

/**
 * Lifecycle Error Recovery Strategy
 */
export enum RecoveryStrategy {
  RETRY = 'retry',           // Automatically retry the operation
  FAIL_FAST = 'fail-fast',   // Immediately abort
  GRACEFUL = 'graceful',     // Log and continue with degraded state
  ROLLBACK = 'rollback'      // Revert to previous state
}

/**
 * Lifecycle Error Recovery Configuration
 */
export interface RecoveryConfig {
  strategy: RecoveryStrategy;
  maxRetries?: number;
  retryDelayMs?: number;
  backoffMultiplier?: number;  // exponential backoff
  fallbackValue?: any;         // For recovery
}

/**
 * Lifecycle Timeout Manager
 *
 * Handles timeouts, retries, and error recovery for plugin lifecycle operations.
 * Provides:
 * - Configurable timeouts per lifecycle hook
 * - Automatic retry with exponential backoff
 * - Error context and diagnostics
 * - Recovery strategies
 * - Hook execution logging
 */
export class LifecycleTimeoutManager {
  private readonly logger = new Logger('LifecycleTimeoutManager');
  private timeoutConfigs = new Map<string, LifecycleTimeoutConfig>();
  private recoveryConfigs = new Map<string, RecoveryConfig>();
  private executionHistory = new Map<string, LifecycleErrorContext[]>();

  // Default timeouts (ms)
  private readonly DEFAULT_TIMEOUTS: LifecycleTimeoutConfig = {
    onLoad: 5000,
    onInit: 5000,
    onActivate: 3000,
    onDeactivate: 3000,
    onUnload: 5000,
    onReload: 5000
  };

  // Default recovery config
  private readonly DEFAULT_RECOVERY: RecoveryConfig = {
    strategy: RecoveryStrategy.RETRY,
    maxRetries: 2,
    retryDelayMs: 100,
    backoffMultiplier: 2
  };

  /**
   * Set timeout configuration for a plugin
   */
  setTimeoutConfig(pluginId: string, config: LifecycleTimeoutConfig): void {
    this.timeoutConfigs.set(pluginId, { ...this.DEFAULT_TIMEOUTS, ...config });
    this.logger.debug(`Set timeout config for plugin: ${pluginId}`);
  }

  /**
   * Get timeout configuration for a plugin
   */
  getTimeoutConfig(pluginId: string): LifecycleTimeoutConfig {
    return this.timeoutConfigs.get(pluginId) || this.DEFAULT_TIMEOUTS;
  }

  /**
   * Set recovery configuration for a plugin
   */
  setRecoveryConfig(pluginId: string, config: RecoveryConfig): void {
    this.recoveryConfigs.set(pluginId, { ...this.DEFAULT_RECOVERY, ...config });
    this.logger.debug(`Set recovery config for plugin: ${pluginId}`);
  }

  /**
   * Get recovery configuration for a plugin
   */
  getRecoveryConfig(pluginId: string): RecoveryConfig {
    return this.recoveryConfigs.get(pluginId) || this.DEFAULT_RECOVERY;
  }

  /**
   * Execute a lifecycle hook with timeout and error handling
   */
  async executeWithTimeout<T>(
    pluginId: string,
    hookName: string,
    hookFn: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.getTimeoutConfig(pluginId)[hookName as keyof LifecycleTimeoutConfig];
    const recovery = this.getRecoveryConfig(pluginId);

    let lastError: Error | null = null;
    let retryCount = 0;
    const maxRetries = recovery.maxRetries || 0;

    while (retryCount <= maxRetries) {
      try {
        const startTime = Date.now();
        const result = await this.executeWithTimeoutInternal(
          pluginId,
          hookName,
          hookFn,
          timeout || 30000
        );

        // Success - log if retried
        if (retryCount > 0) {
          this.logger.log(
            `✓ Plugin ${pluginId} hook ${hookName} succeeded after ${retryCount} retries`
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        if (retryCount < maxRetries) {
          const delayMs = this.calculateRetryDelay(
            retryCount,
            recovery.retryDelayMs || 100,
            recovery.backoffMultiplier || 2
          );

          this.logger.warn(
            `Plugin ${pluginId} hook ${hookName} failed (attempt ${retryCount + 1}/${maxRetries + 1}), ` +
            `retrying in ${delayMs}ms: ${(error as Error).message}`
          );

          await this.sleep(delayMs);
          retryCount++;
        } else {
          break;
        }
      }
    }

    // All retries exhausted - handle based on recovery strategy
    const context = this.createErrorContext(
      pluginId,
      hookName,
      lastError,
      false,
      retryCount,
      maxRetries
    );

    return this.handleRecovery(pluginId, hookName, context, recovery);
  }

  /**
   * Execute hook with timeout (internal)
   */
  private executeWithTimeoutInternal<T>(
    pluginId: string,
    hookName: string,
    hookFn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      hookFn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Lifecycle hook ${hookName} timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, baseDelayMs: number, backoffMultiplier: number): number {
    return baseDelayMs * Math.pow(backoffMultiplier, attempt);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create error context
   */
  private createErrorContext(
    pluginId: string,
    hook: string,
    error: Error | null,
    timedOut: boolean,
    retryCount: number,
    maxRetries: number
  ): LifecycleErrorContext {
    return {
      pluginId,
      hook,
      error,
      timedOut,
      startTime: Date.now(),
      duration: 0,
      retryCount,
      maxRetries
    };
  }

  /**
   * Handle error recovery based on strategy
   */
  private async handleRecovery<T>(
    pluginId: string,
    hookName: string,
    context: LifecycleErrorContext,
    recovery: RecoveryConfig
  ): Promise<T> {
    const strategy = recovery.strategy;

    // Record execution history
    if (!this.executionHistory.has(pluginId)) {
      this.executionHistory.set(pluginId, []);
    }
    this.executionHistory.get(pluginId)!.push(context);

    switch (strategy) {
      case RecoveryStrategy.FAIL_FAST:
        this.logger.error(
          `Plugin ${pluginId} hook ${hookName} failed fatally: ${context.error?.message}`
        );
        throw context.error || new Error(`Hook ${hookName} failed`);

      case RecoveryStrategy.GRACEFUL:
        this.logger.warn(
          `Plugin ${pluginId} hook ${hookName} failed gracefully: ${context.error?.message}`
        );
        return recovery.fallbackValue as T;

      case RecoveryStrategy.ROLLBACK:
        this.logger.error(
          `Plugin ${pluginId} hook ${hookName} failed, rolling back: ${context.error?.message}`
        );
        throw new Error(
          `Rollback triggered for ${hookName}: ${context.error?.message}`
        );

      case RecoveryStrategy.RETRY:
      default:
        this.logger.error(
          `Plugin ${pluginId} hook ${hookName} failed after all retries: ${context.error?.message}`
        );
        throw context.error || new Error(`Hook ${hookName} failed after retries`);
    }
  }

  /**
   * Get execution history for a plugin
   */
  getExecutionHistory(pluginId: string): LifecycleErrorContext[] {
    return this.executionHistory.get(pluginId) || [];
  }

  /**
   * Clear execution history for a plugin
   */
  clearExecutionHistory(pluginId: string): void {
    this.executionHistory.delete(pluginId);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(pluginId: string): {
    totalAttempts: number;
    failures: number;
    successes: number;
    timeouts: number;
    averageDuration: number;
  } {
    const history = this.getExecutionHistory(pluginId);

    if (history.length === 0) {
      return {
        totalAttempts: 0,
        failures: 0,
        successes: 0,
        timeouts: 0,
        averageDuration: 0
      };
    }

    const failures = history.filter(h => h.error !== null).length;
    const timeouts = history.filter(h => h.timedOut).length;
    const averageDuration = history.reduce((sum, h) => sum + h.duration, 0) / history.length;

    return {
      totalAttempts: history.length,
      failures,
      successes: history.length - failures,
      timeouts,
      averageDuration
    };
  }

  /**
   * Reset all configurations and history
   */
  reset(): void {
    this.timeoutConfigs.clear();
    this.recoveryConfigs.clear();
    this.executionHistory.clear();
    this.logger.debug('Lifecycle timeout manager reset');
  }
}

export default LifecycleTimeoutManager;
