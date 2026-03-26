import { ServiceUnavailableException } from '@nestjs/common';
import { TimeoutMiddleware } from '../../src/middleware/advanced/timeout.middleware';

describe('TimeoutMiddleware', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a 503 error when the timeout threshold is exceeded', () => {
    const middleware = new TimeoutMiddleware({
      timeoutMs: 100,
      message: 'Middleware execution timed out.',
    });
    const response = createResponse();
    const next = jest.fn();

    middleware.use({} as any, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(100);

    expect(next).toHaveBeenLastCalledWith(
      expect.any(ServiceUnavailableException),
    );
  });

  it('clears the timeout when the response completes in time', () => {
    const middleware = new TimeoutMiddleware({
      timeoutMs: 100,
    });
    const response = createResponse();
    const next = jest.fn();

    middleware.use({} as any, response, next);
    response.emit('finish');
    jest.advanceTimersByTime(100);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

function createResponse() {
  const listeners = new Map<string, Array<() => void>>();

  return {
    headersSent: false,
    once: jest.fn((event: string, handler: () => void) => {
      const current = listeners.get(event) ?? [];
      listeners.set(event, [...current, handler]);
    }),
    removeListener: jest.fn((event: string, handler: () => void) => {
      const current = listeners.get(event) ?? [];
      listeners.set(
        event,
        current.filter((candidate) => candidate !== handler),
      );
    }),
    emit: (event: string) => {
      for (const handler of listeners.get(event) ?? []) {
        handler();
      }
    },
  } as any;
}
