import { CircuitBreaker, CircuitState } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 3, timeout: 1000, halfOpenRetryInterval: 200 });
  });

  // ── CLOSED state ──────────────────────────────────────────────────────────

  it('starts in CLOSED state', () => {
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('allows requests in CLOSED state', () => {
    expect(cb.allowRequest()).toBe(true);
  });

  it('stays CLOSED below failure threshold', () => {
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  // ── CLOSED → OPEN transition ──────────────────────────────────────────────

  it('opens after reaching failure threshold', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  it('blocks requests in OPEN state', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.allowRequest()).toBe(false);
  });

  // ── OPEN → HALF_OPEN transition ───────────────────────────────────────────

  it('transitions to HALF_OPEN after timeout', async () => {
    cb = new CircuitBreaker({ failureThreshold: 1, timeout: 50, halfOpenRetryInterval: 10 });
    cb.recordFailure();
    expect(cb.getState()).toBe(CircuitState.OPEN);

    await new Promise((r) => setTimeout(r, 60));
    expect(cb.allowRequest()).toBe(true);
    expect(cb.getState()).toBe(CircuitState.HALF_OPEN);
  });

  // ── HALF_OPEN → CLOSED transition ────────────────────────────────────────

  it('closes after success in HALF_OPEN state', async () => {
    cb = new CircuitBreaker({ failureThreshold: 1, timeout: 50, halfOpenRetryInterval: 10 });
    cb.recordFailure();
    await new Promise((r) => setTimeout(r, 60));
    cb.allowRequest(); // probe → HALF_OPEN
    cb.recordSuccess();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  // ── HALF_OPEN → OPEN transition ───────────────────────────────────────────

  it('re-opens on failure in HALF_OPEN state', async () => {
    cb = new CircuitBreaker({ failureThreshold: 1, timeout: 50, halfOpenRetryInterval: 10 });
    cb.recordFailure();
    await new Promise((r) => setTimeout(r, 60));
    cb.allowRequest(); // probe → HALF_OPEN
    cb.recordFailure();
    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  // ── Configurable options ──────────────────────────────────────────────────

  it('respects custom failureThreshold', () => {
    const custom = new CircuitBreaker({ failureThreshold: 10 });
    for (let i = 0; i < 9; i++) custom.recordFailure();
    expect(custom.getState()).toBe(CircuitState.CLOSED);
    custom.recordFailure();
    expect(custom.getState()).toBe(CircuitState.OPEN);
  });

  it('resets failure count on success', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
    // Threshold still requires 3 failures from scratch
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('throttles probes in HALF_OPEN by halfOpenRetryInterval', async () => {
    cb = new CircuitBreaker({ failureThreshold: 1, timeout: 50, halfOpenRetryInterval: 500 });
    cb.recordFailure();
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.allowRequest()).toBe(true); // first probe allowed
    expect(cb.allowRequest()).toBe(false); // too soon for second probe
  });
});
