module.exports = {
  name: 'JwtAuthMiddleware',
  source: 'src/auth/jwt-auth.middleware.ts',
  notes: 'Benchmarks the authenticated success path with token verification and user validation.',
  async createHandler({ importCompiled }) {
    const mod = await importCompiled('src/auth/jwt-auth.middleware.js');
    const middleware = new mod.JwtAuthMiddleware({
      secret: 'benchmark-secret',
      publicRoutes: [],
      logging: false,
      validateUser: async () => ({ id: 'bench-user' }),
    });

    return (req, res, done) => middleware.use(req, res, done);
  },
  createRequestOptions: ({ port }) => ({
    hostname: '127.0.0.1',
    port,
    path: '/benchmark',
    method: 'GET',
    headers: {
      authorization:
        'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiZW5jaC11c2VyIiwiZW1haWwiOiJiZW5jaEBtaW5kYmxvY2suZGV2IiwidXNlclJvbGUiOiJ1c2VyIn0.FU1kP6QdIbGR0kJ7v7k3m4z29rB5Q6qOYZMquf3F5rA',
    },
  }),
};
