module.exports = {
  name: 'TimeoutMiddleware',
  source: 'src/middleware/advanced/timeout.middleware.ts',
  notes: 'Healthy request path where the response completes before the timeout window.',
  async createHandler({ importCompiled }) {
    const mod = await importCompiled('src/middleware/advanced/timeout.middleware.js');
    const middleware = new mod.TimeoutMiddleware({
      timeoutMs: 5_000,
      message: 'Request timed out.',
    });

    return (req, res, done) => middleware.use(req, res, done);
  },
  createRequestOptions: ({ port }) => ({
    hostname: '127.0.0.1',
    port,
    path: '/benchmark',
    method: 'GET',
  }),
};
