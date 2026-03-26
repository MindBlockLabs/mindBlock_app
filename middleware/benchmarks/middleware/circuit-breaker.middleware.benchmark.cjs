module.exports = {
  name: 'CircuitBreakerMiddleware',
  source: 'src/middleware/advanced/circuit-breaker.middleware.ts',
  notes: 'Healthy CLOSED-state request path with the default next() flow.',
  async createHandler({ importCompiled }) {
    const mod = await importCompiled('src/middleware/advanced/circuit-breaker.middleware.js');
    const service = new mod.CircuitBreakerService({
      name: 'benchmark-circuit-breaker',
      failureThreshold: 5,
      timeoutWindowMs: 10_000,
      halfOpenRetryIntervalMs: 30_000,
    });
    const middleware = new mod.CircuitBreakerMiddleware(service);

    return (req, res, done) => middleware.use(req, res, done);
  },
  createRequestOptions: ({ port }) => ({
    hostname: '127.0.0.1',
    port,
    path: '/benchmark',
    method: 'GET',
  }),
};
