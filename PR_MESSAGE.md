# PR: Middleware Performance Benchmarks & External Plugin System

## Overview

This PR adds two major features to the `@mindblock/middleware` package:

1. **Per-Middleware Performance Benchmarks** - Automated tooling to measure latency overhead of each middleware individually
2. **External Plugin Loader** - Complete system for dynamically loading and managing middleware plugins from npm packages

All implementation is confined to the middleware repository with no backend modifications.

## Features

### Performance Benchmarks (#369)

- Automated benchmarking script measuring middleware overhead against baseline
- Tracks requests/second, latency percentiles (p50, p95, p99), and error rates
- Individual profiling for JWT Auth, RBAC, Security Headers, Timeout, Circuit Breaker, Correlation ID
- Compare middlewares by contribution to overall latency
- CLI commands: `npm run benchmark` and `npm run benchmark:ci`

**Files:**
- `scripts/benchmark.ts` - Load testing implementation
- `docs/PERFORMANCE.md` - Benchmarking documentation (updated)
- `tests/integration/benchmark.integration.spec.ts` - Test coverage

### External Plugin Loader System

- **PluginInterface** - Standard contract for all plugins
- **PluginLoader** - Low-level discovery, loading, and lifecycle management
- **PluginRegistry** - High-level plugin orchestration and management
- Plugin lifecycle hooks: `onLoad`, `onInit`, `onActivate`, `onDeactivate`, `onUnload`, `onReload`
- Configuration validation with JSON Schema support
- Semantic version compatibility checking
- Plugin dependency resolution
- Priority-based execution ordering
- Comprehensive error handling (10 custom error types)

**Files:**
- `src/common/interfaces/plugin.interface.ts` - Plugin types and metadata
- `src/common/interfaces/plugin.errors.ts` - Error classes
- `src/common/utils/plugin-loader.ts` - Loader service (650+ lines)
- `src/common/utils/plugin-registry.ts` - Registry service (400+ lines)
- `src/plugins/example.plugin.ts` - Template plugin for developers
- `docs/PLUGINS.md` - Complete plugin documentation (750+ lines)
- `docs/PLUGIN_QUICKSTART.md` - Quick start guide for plugin developers (600+ lines)
- `tests/integration/plugin-system.integration.spec.ts` - Integration tests

## Usage

### Performance Benchmarking

```bash
npm run benchmark
```

Outputs comprehensive latency overhead comparison for each middleware.

### Loading Plugins

```typescript
import { PluginRegistry } from '@mindblock/middleware';

const registry = new PluginRegistry({ autoLoadEnabled: true });
await registry.init();

const plugin = await registry.load('@yourorg/plugin-example');
await registry.initialize(plugin.metadata.id);
await registry.activate(plugin.metadata.id);
```

### Creating Plugins

Developers can create plugins by implementing `PluginInterface`:

```typescript
export class MyPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.org.plugin.example',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'My custom middleware'
  };

  getMiddleware() {
    return (req, res, next) => { /* middleware logic */ };
  }
}
```

Publish to npm with scoped name (`@yourorg/plugin-name`) and users can discover and load automatically.

## Testing

- Benchmark integration tests validate middleware setup
- Plugin system tests cover:
  - Plugin interface validation
  - Lifecycle hook execution
  - Configuration validation
  - Dependency resolution
  - Error handling
  - Batch operations

Run tests: `npm test`

## Dependencies Added

- `autocannon@^7.15.0` - Load testing library (already installed, fallback to simple HTTP client)
- `semver@^7.6.0` - Semantic version validation
- `@types/semver@^7.5.8` - TypeScript definitions
- `ts-node@^10.9.2` - TypeScript execution

## Documentation

- **PERFORMANCE.md** - Performance optimization guide and benchmarking docs
- **PLUGINS.md** - Comprehensive plugin system documentation with examples
- **PLUGIN_QUICKSTART.md** - Quick start for plugin developers with patterns and examples
- **README.md** - Updated with plugin system overview

## Breaking Changes

None. All additions are backward compatible.

## Commits

- `4f83f97` - feat: #369 add per-middleware performance benchmarks
- `1e04e8f` - feat: External Plugin Loader for npm packages

---

**Ready for review and merge into main after testing!**
