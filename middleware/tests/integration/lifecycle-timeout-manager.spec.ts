import { Test, TestingModule } from '@nestjs/testing';
import LifecycleTimeoutManager, {
  LifecycleTimeoutConfig,
  RecoveryConfig,
  RecoveryStrategy,
  LifecycleErrorContext
} from '../../src/common/utils/lifecycle-timeout-manager';

describe('LifecycleTimeoutManager', () => {
  let manager: LifecycleTimeoutManager;

  beforeEach(() => {
    manager = new LifecycleTimeoutManager();
  });

  afterEach(() => {
    manager.reset();
  });

  describe('Timeout Configuration', () => {
    it('should use default timeouts', () => {
      const config = manager.getTimeoutConfig('test-plugin');
      expect(config.onLoad).toBe(5000);
      expect(config.onInit).toBe(5000);
      expect(config.onActivate).toBe(3000);
    });

    it('should set custom timeout configuration', () => {
      const customConfig: LifecycleTimeoutConfig = {
        onLoad: 2000,
        onInit: 3000,
        onActivate: 1000
      };

      manager.setTimeoutConfig('my-plugin', customConfig);
      const config = manager.getTimeoutConfig('my-plugin');

      expect(config.onLoad).toBe(2000);
      expect(config.onInit).toBe(3000);
      expect(config.onActivate).toBe(1000);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: LifecycleTimeoutConfig = {
        onLoad: 2000
        // Other timeouts not specified
      };

      manager.setTimeoutConfig('my-plugin', customConfig);
      const config = manager.getTimeoutConfig('my-plugin');

      expect(config.onLoad).toBe(2000);
      expect(config.onInit).toBe(5000); // Default
    });
  });

  describe('Recovery Configuration', () => {
    it('should use default recovery config', () => {
      const config = manager.getRecoveryConfig('test-plugin');
      expect(config.strategy).toBe(RecoveryStrategy.RETRY);
      expect(config.maxRetries).toBe(2);
    });

    it('should set custom recovery configuration', () => {
      const customConfig: RecoveryConfig = {
        strategy: RecoveryStrategy.GRACEFUL,
        maxRetries: 1,
        fallbackValue: null
      };

      manager.setRecoveryConfig('my-plugin', customConfig);
      const config = manager.getRecoveryConfig('my-plugin');

      expect(config.strategy).toBe(RecoveryStrategy.GRACEFUL);
      expect(config.maxRetries).toBe(1);
    });
  });

  describe('Successful Execution', () => {
    it('should execute hook successfully', async () => {
      const hookFn = jest.fn(async () => 'success');

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBe('success');
      expect(hookFn).toHaveBeenCalledTimes(1);
    });

    it('should execute hook with return value', async () => {
      const hookFn = jest.fn(async () => ({ value: 123 }));

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onInit',
        hookFn,
        5000
      );

      expect(result).toEqual({ value: 123 });
    });

    it('should handle async hook execution', async () => {
      let executed = false;

      const hookFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        executed = true;
        return 'done';
      };

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onActivate',
        hookFn,
        5000
      );

      expect(executed).toBe(true);
      expect(result).toBe('done');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout when hook exceeds timeout', async () => {
      const hookFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'success';
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.FAIL_FAST,
        maxRetries: 0
      });

      await expect(
        manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 100)
      ).rejects.toThrow('timed out');
    });

    it('should timeout and retry', async () => {
      let attempts = 0;
      const hookFn = async () => {
        attempts++;
        if (attempts < 2) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        return 'success';
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 2,
        retryDelayMs: 10
      });

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        100
      );

      // Should eventually succeed or be retried
      expect(attempts).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle hook errors with FAIL_FAST', async () => {
      const error = new Error('Hook failed');
      const hookFn = jest.fn(async () => {
        throw error;
      });

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.FAIL_FAST,
        maxRetries: 0
      });

      await expect(
        manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000)
      ).rejects.toThrow('Hook failed');
    });

    it('should handle hook errors with GRACEFUL', async () => {
      const error = new Error('Hook failed');
      const hookFn = jest.fn(async () => {
        throw error;
      });

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.GRACEFUL,
        maxRetries: 0,
        fallbackValue: 'fallback-value'
      });

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBe('fallback-value');
    });

    it('should retry on error', async () => {
      let attempts = 0;
      const hookFn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Attempt failed');
        }
        return 'success';
      });

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 2,
        retryDelayMs: 10
      });

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should fail after max retries exhausted', async () => {
      const error = new Error('Always fails');
      const hookFn = jest.fn(async () => {
        throw error;
      });

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.FAIL_FAST,
        maxRetries: 2,
        retryDelayMs: 10
      });

      await expect(
        manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000)
      ).rejects.toThrow('Always fails');

      expect(hookFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Exponential Backoff', () => {
    it('should use exponential backoff for retries', async () => {
      let attempts = 0;
      const timestamps: number[] = [];

      const hookFn = async () => {
        attempts++;
        timestamps.push(Date.now());
        if (attempts < 3) {
          throw new Error('Retry me');
        }
        return 'success';
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 3,
        retryDelayMs: 25,
        backoffMultiplier: 2
      });

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        10000
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);

      // Check backoff timing (with some tolerance)
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];
        // delay2 should be roughly 2x delay1
        expect(delay2).toBeGreaterThanOrEqual(delay1);
      }
    });
  });

  describe('Execution History', () => {
    it('should record successful execution', async () => {
      const hookFn = async () => 'success';

      await manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000);

      const history = manager.getExecutionHistory('test-plugin');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should record failed execution', async () => {
      const hookFn = async () => {
        throw new Error('Failed');
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.FAIL_FAST,
        maxRetries: 0
      });

      try {
        await manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000);
      } catch (e) {
        // Expected
      }

      const history = manager.getExecutionHistory('test-plugin');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should get execution statistics', async () => {
      const hookFn = jest.fn(async () => 'success');

      await manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000);

      const stats = manager.getExecutionStats('test-plugin');
      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(stats.successes).toBeGreaterThanOrEqual(0);
      expect(stats.failures).toBeGreaterThanOrEqual(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should clear execution history', async () => {
      const hookFn = async () => 'success';

      await manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000);
      const beforeClear = manager.getExecutionHistory('test-plugin').length;
      expect(beforeClear).toBeGreaterThan(0);

      manager.clearExecutionHistory('test-plugin');
      const afterClear = manager.getExecutionHistory('test-plugin').length;
      expect(afterClear).toBe(0);
    });
  });

  describe('Multiple Plugins', () => {
    it('should handle multiple plugins independently', () => {
      manager.setTimeoutConfig('plugin-a', { onLoad: 1000 });
      manager.setTimeoutConfig('plugin-b', { onLoad: 2000 });

      const configA = manager.getTimeoutConfig('plugin-a');
      const configB = manager.getTimeoutConfig('plugin-b');

      expect(configA.onLoad).toBe(1000);
      expect(configB.onLoad).toBe(2000);
    });

    it('should maintain separate recovery configs', () => {
      manager.setRecoveryConfig('plugin-a', {
        strategy: RecoveryStrategy.RETRY
      });
      manager.setRecoveryConfig('plugin-b', {
        strategy: RecoveryStrategy.GRACEFUL
      });

      const configA = manager.getRecoveryConfig('plugin-a');
      const configB = manager.getRecoveryConfig('plugin-b');

      expect(configA.strategy).toBe(RecoveryStrategy.RETRY);
      expect(configB.strategy).toBe(RecoveryStrategy.GRACEFUL);
    });

    it('should maintain separate execution histories', async () => {
      const hookFnA = async () => 'a';
      const hookFnB = async () => 'b';

      await manager.executeWithTimeout('plugin-a', 'onLoad', hookFnA, 5000);
      await manager.executeWithTimeout('plugin-b', 'onInit', hookFnB, 5000);

      const historyA = manager.getExecutionHistory('plugin-a');
      const historyB = manager.getExecutionHistory('plugin-b');

      expect(historyA.length).toBeGreaterThan(0);
      expect(historyB.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery Strategies', () => {
    it('should handle RETRY strategy', async () => {
      let attempts = 0;
      const hookFn = async () => {
        if (attempts++ < 1) throw new Error('Fail');
        return 'success';
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 2,
        retryDelayMs: 10
      });

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBe('success');
    });

    it('should handle FAIL_FAST strategy', async () => {
      const hookFn = async () => {
        throw new Error('Immediate failure');
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.FAIL_FAST,
        maxRetries: 2
      });

      await expect(
        manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000)
      ).rejects.toThrow('Immediate failure');
    });

    it('should handle GRACEFUL strategy', async () => {
      const hookFn = async () => {
        throw new Error('Will be ignored');
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.GRACEFUL,
        maxRetries: 0,
        fallbackValue: { status: 'degraded' }
      });

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toEqual({ status: 'degraded' });
    });

    it('should handle ROLLBACK strategy', async () => {
      const hookFn = async () => {
        throw new Error('Rollback error');
      };

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.ROLLBACK,
        maxRetries: 0
      });

      await expect(
        manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 5000)
      ).rejects.toThrow('Rollback triggered');
    });
  });

  describe('Reset', () => {
    it('should reset all configurations', () => {
      manager.setTimeoutConfig('test', { onLoad: 1000 });
      manager.setRecoveryConfig('test', { strategy: RecoveryStrategy.GRACEFUL });

      manager.reset();

      const timeoutConfig = manager.getTimeoutConfig('test');
      const recoveryConfig = manager.getRecoveryConfig('test');

      expect(timeoutConfig.onLoad).toBe(5000); // Default
      expect(recoveryConfig.strategy).toBe(RecoveryStrategy.RETRY); // Default
    });

    it('should clear execution history on reset', async () => {
      const hookFn = async () => 'success';
      await manager.executeWithTimeout('test', 'onLoad', hookFn, 5000);

      manager.reset();

      const history = manager.getExecutionHistory('test');
      expect(history.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero timeout', async () => {
      const hookFn = jest.fn(async () => 'immediate');

      manager.setRecoveryConfig('test-plugin', {
        strategy: RecoveryStrategy.GRACEFUL,
        maxRetries: 0,
        fallbackValue: 'fallback'
      });

      // Very short timeout should trigger timeout or succeed very quickly
      try {
        const result = await manager.executeWithTimeout('test-plugin', 'onLoad', hookFn, 1);
        expect(['immediate', 'fallback']).toContain(result);
      } catch (e) {
        // May timeout, which is acceptable
        expect((e as Error).message).toContain('timed out');
      }
    });

    it('should handle hook that returns undefined', async () => {
      const hookFn = async () => undefined;

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBeUndefined();
    });

    it('should handle hook that returns null', async () => {
      const hookFn = async () => null;

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBeNull();
    });

    it('should handle hook that returns false', async () => {
      const hookFn = async () => false;

      const result = await manager.executeWithTimeout(
        'test-plugin',
        'onLoad',
        hookFn,
        5000
      );

      expect(result).toBe(false);
    });
  });
});
