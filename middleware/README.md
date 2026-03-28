# @mindblock/middleware

## Package Overview

This package contains reusable, framework-friendly middleware building blocks for the Mind Block backend.

### Why a separate package?

Keeping middleware in its own workspace package makes it:

- easier to reuse across backend modules/services
- easier to test in isolation
- easier to version and evolve without coupling to app runtime concerns

### Main features / categories

- Auth
- Security
- Performance
- Monitoring
- Validation
- Common utilities
- **Plugin System** - Load custom middleware from npm packages

## Plugin System

The package includes an **External Plugin Loader** system that allows you to dynamically load and manage middleware plugins from npm packages.

```typescript
import { PluginRegistry } from '@mindblock/middleware';

// Create and initialize registry
const registry = new PluginRegistry();
await registry.init();

// Load a plugin
const plugin = await registry.load('@yourorg/plugin-example');

// Activate it
await registry.activate(plugin.metadata.id);

// Use plugin middleware
const middlewares = registry.getAllMiddleware();
app.use(middlewares['com.yourorg.plugin.example']);
```

**Key Features:**
- ✅ Dynamic plugin discovery and loading from npm
- ✅ Plugin lifecycle management (load, init, activate, deactivate, unload)
- ✅ Configuration validation with JSON Schema support
- ✅ Dependency resolution between plugins
- ✅ Version compatibility checking
- ✅ Plugin registry and search capabilities
- ✅ Comprehensive error handling

See [PLUGINS.md](docs/PLUGINS.md) for complete documentation on creating and using plugins.

### Getting Started with Plugins

To quickly start developing a plugin:

1. Read the [Plugin Quick Start Guide](docs/PLUGIN_QUICKSTART.md)
2. Check out the [Example Plugin](src/plugins/example.plugin.ts)
3. Review plugin [API Reference](src/common/interfaces/plugin.interface.ts)

## Installation

From the monorepo root:

```bash
npm install
```

### Using from the backend

The backend can import from this workspace package:

```ts
import { /* future exports */ } from '@mindblock/middleware';
```

You can also import by category (once the exports exist):

```ts
import { /* future exports */ } from '@mindblock/middleware/auth';
```

## Performance Benchmarking

This package includes automated performance benchmarks to measure the latency
overhead of each middleware component individually.

```bash
# Run performance benchmarks
npm run benchmark

# Run with CI-friendly output
npm run benchmark:ci
```

See [PERFORMANCE.md](docs/PERFORMANCE.md) for detailed benchmarking documentation
and optimization techniques.

## Quick Start

Example placeholder usage (actual middleware implementations will be added in later issues):

```ts
// import { AuthMiddleware } from '@mindblock/middleware/auth';

// app.use(new AuthMiddleware().handle);
```

## Available Middleware

- **Auth**: authentication/authorization helpers and middleware.
- **Security**: headers, CORS, rate limiting, and other security-related middleware.
- **Performance**: caching, compression, and performance instrumentation.
- **Monitoring**: logging, tracing, and metrics related middleware.
- **Validation**: request/DTO validation helpers.

Detailed documentation will live in the `docs/` folder (to be added in later issues).

## Configuration

A full configuration guide will be added at `docs/CONFIGURATION.md`.

Common environment variables (expected across middleware in the future) may include:

- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`

## Testing

Run unit/integration tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:cov
```

Coverage requirements:

- 80% branches
- 80% functions
- 80% lines
- 80% statements

## Development

Build the package:

```bash
npm run build
```

Lint:

```bash
npm run lint
npm run lint:fix
```

Format:

```bash
npm run format
npm run format:check
```

## Contributing

A package-level contributing guide will be added at `docs/CONTRIBUTING.md`.

For now, follow the main project contributing guidelines:

- `../CONTRIBUTING.md`

## License

MIT License (or whatever the Mind Block repository uses).
