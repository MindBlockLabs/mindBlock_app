import { AsyncLocalStorage } from 'node:async_hooks';

export interface CorrelationContext {
  correlationId: string;
  userId?: string;
}

export class CorrelationIdStorage {
  private static readonly storage = new AsyncLocalStorage<CorrelationContext>();

  static run<R>(correlationId: string, userId: string | undefined, fn: () => R): R {
    return this.storage.run({ correlationId, userId }, fn);
  }

  static getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
