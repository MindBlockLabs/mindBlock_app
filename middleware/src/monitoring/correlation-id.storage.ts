import { AsyncLocalStorage } from 'node:async_hooks';

export interface CorrelationContext {
  correlationId: string;
}

export class CorrelationIdStorage {
  private static readonly storage = new AsyncLocalStorage<CorrelationContext>();

  static run<R>(correlationId: string, fn: () => R): R {
    return this.storage.run({ correlationId }, fn);
  }

  static getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }
}
