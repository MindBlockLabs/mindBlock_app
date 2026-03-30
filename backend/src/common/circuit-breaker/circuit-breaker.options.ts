export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Milliseconds to wait in OPEN state before moving to HALF_OPEN. Default: 60000 */
  timeout?: number;
  /** Milliseconds between retry attempts in HALF_OPEN state. Default: 5000 */
  halfOpenRetryInterval?: number;
}
