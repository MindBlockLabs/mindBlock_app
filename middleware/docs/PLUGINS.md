# Plugin System Documentation

## Overview

The **External Plugin Loader** allows you to dynamically load, manage, and activate middleware plugins from npm packages into the `@mindblock/middleware` package. This enables a flexible, extensible architecture where developers can create custom middleware as independent npm packages.

## Table of Contents

- [Quick Start](#quick-start)
- [Plugin Architecture](#plugin-architecture)
- [Creating Plugins](#creating-plugins)
- [Loading Plugins](#loading-plugins)
- [Plugin Configuration](#plugin-configuration)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Quick Start

### 1. Install the Plugin System

The plugin system is built into `@mindblock/middleware`. No additional installation required.

### 2. Load a Plugin

```typescript
import { PluginRegistry } from '@mindblock/middleware';

// Create registry instance
const registry = new PluginRegistry({
  autoLoadEnabled: true,
  middlewareVersion: '1.0.0'
});

// Initialize registry
await registry.init();

// Load a plugin
const loaded = await registry.load('@yourorg/plugin-example');

// Activate the plugin
await registry.activate(loaded.metadata.id);
```

### 3. Use Plugin Middleware

```typescript
const app = express();

// Get all active plugin middlewares
const middlewares = registry.getAllMiddleware();

// Apply to your Express app
for (const [pluginId, middleware] of Object.entries(middlewares)) {
  app.use(middleware);
}
```

## Plugin Architecture

### Core Components

```
┌─────────────────────────────────────────────┐
│          PluginRegistry                     │
│  (High-level plugin management interface)   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│          PluginLoader                       │
│  (Low-level plugin loading & lifecycle)     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      PluginInterface (implements)            │
│  - Metadata                                  │
│  - Lifecycle Hooks                           │
│  - Middleware Export                         │
│  - Configuration Validation                  │
└─────────────────────────────────────────────┘
```

### Plugin Interface

All plugins must implement the `PluginInterface`:

```typescript
interface PluginInterface {
  // Required
  metadata: PluginMetadata;

  // Optional Lifecycle Hooks
  onLoad?(context: PluginContext): Promise<void>;
  onInit?(config: PluginConfig, context: PluginContext): Promise<void>;
  onActivate?(context: PluginContext): Promise<void>;
  onDeactivate?(context: PluginContext): Promise<void>;
  onUnload?(context: PluginContext): Promise<void>;
  onReload?(config: PluginConfig, context: PluginContext): Promise<void>;

  // Optional Methods
  getMiddleware?(): NestMiddleware | ExpressMiddleware;
  getExports?(): Record<string, any>;
  validateConfig?(config: PluginConfig): ValidationResult;
  getDependencies?(): string[];
}
```

## Creating Plugins

### Step 1: Set Up Your Plugin Project

```bash
mkdir @yourorg/plugin-example
cd @yourorg/plugin-example
npm init -y
npm install @nestjs/common express @mindblock/middleware typescript
npm install -D ts-node @types/express @types/node
```

### Step 2: Implement Your Plugin

Create `src/index.ts`:

```typescript
import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  PluginInterface,
  PluginMetadata,
  PluginConfig,
  PluginContext
} from '@mindblock/middleware';

export class MyPlugin implements PluginInterface {
  private readonly logger = new Logger('MyPlugin');

  metadata: PluginMetadata = {
    id: 'com.yourorg.plugin.example',
    name: 'My Custom Plugin',
    description: 'A custom middleware plugin',
    version: '1.0.0',
    author: 'Your Organization',
    homepage: 'https://github.com/yourorg/plugin-example',
    license: 'MIT',
    priority: 10
  };

  async onLoad(context: PluginContext) {
    this.logger.log('Plugin loaded');
  }

  async onInit(config: PluginConfig, context: PluginContext) {
    this.logger.log('Plugin initialized', config);
  }

  async onActivate(context: PluginContext) {
    this.logger.log('Plugin activated');
  }

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Your middleware logic
      res.setHeader('X-My-Plugin', 'active');
      next();
    };
  }

  validateConfig(config: PluginConfig) {
    const errors: string[] = [];
    // Validation logic
    return { valid: errors.length === 0, errors };
  }
}

export default MyPlugin;
```

### Step 3: Configure package.json

Add `mindblockPlugin` configuration:

```json
{
  "name": "@yourorg/plugin-example",
  "version": "1.0.0",
  "description": "Example middleware plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "license": "MIT",
  "keywords": ["mindblock", "plugin", "middleware"],
  "mindblockPlugin": {
    "version": "^1.0.0",
    "priority": 10,
    "autoLoad": false,
    "configSchema": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        }
      }
    }
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@mindblock/middleware": "^1.0.0",
    "express": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### Step 4: Build and Publish

```bash
npm run build
npm publish --access=public
```

## Loading Plugins

### Manual Loading

```typescript
const registry = new PluginRegistry();
await registry.init();

// Load plugin
const plugin = await registry.load('@yourorg/plugin-example');

// Initialize with config
await registry.initialize(plugin.metadata.id, {
  enabled: true,
  options: { /* plugin-specific options */ }
});

// Activate
await registry.activate(plugin.metadata.id);
```

### Auto-Loading

```typescript
const registry = new PluginRegistry({
  autoLoadPlugins: [
    '@yourorg/plugin-example',
    '@yourorg/plugin-another'
  ],
  autoLoadEnabled: true
});

await registry.init(); // Plugins load automatically
```

###Discovery

```typescript
// Discover available plugins in node_modules
const discovered = await registry.loader.discoverPlugins();
console.log('Available plugins:', discovered);
```

## Plugin Configuration

### Configuration Schema

Plugins can define JSON Schema for configuration validation:

```typescript
metadata: PluginMetadata = {
  id: 'com.example.plugin',
  // ...
  configSchema: {
    type: 'object',
    required: ['someRequired'],
    properties: {
      enabled: { type: 'boolean', default: true },
      someRequired: { type: 'string' },
      timeout: { type: 'number', minimum: 1000 }
    }
  }
};
```

### Validating Configuration

```typescript
const config: PluginConfig = {
  enabled: true,
  options: { someRequired: 'value', timeout: 5000 }
};

const result = registry.validateConfig(pluginId, config);
if (!result.valid) {
  console.error('Invalid config:', result.errors);
}
```

## Plugin Lifecycle

```
┌─────────────────────────────────────────────┐
│         Plugin Lifecycle Flow               │
└─────────────────────────────────────────────┘

    load()
       │
       ▼
    onLoad() ──► Initialization validation
       │
       ├────────────────┐
       │                │
    init()          manual config
       │              │
       ▼              ▼
    onInit() ◄─────────┘
       │
       ▼
    activate()
       │
       ▼
    onActivate() ──► Plugin ready & active
       │
       │ (optionally)
       ├─► reload() ──► onReload()
       │
       ▼ (eventually)
    deactivate()
       │
       ▼
    onDeactivate()
       │
       ▼
    unload()
       │
       ▼
    onUnload()
       │
       ▼
    ✓ Removed
```

### Lifecycle Hooks

| Hook | When Called | Purpose |
|------|-------------|---------|
| `onLoad` | After module import | Validate dependencies, setup |
| `onInit` | After configuration merge | Initialize with config |
| `onActivate` | When activated | Start services, open connections |
| `onDeactivate` | When deactivated | Stop services, cleanup |
| `onUnload` | Before removal | Final cleanup |
| `onReload` | On configuration change | Update configuration without unloading |

## Error Handling

### Error Types

```typescript
// Plugin not found
try {
  registry.getPluginOrThrow('unknown-plugin');
} catch (error) {
  if (error instanceof PluginNotFoundError) {
    console.error('Plugin not found');
  }
}

// Plugin already loaded
catch (error) {
  if (error instanceof PluginAlreadyLoadedError) {
    console.error('Plugin already loaded');
  }
}

// Invalid configuration
catch (error) {
  if (error instanceof PluginConfigError) {
    console.error('Invalid config:', error.details);
  }
}

// Unmet dependencies
catch (error) {
  if (error instanceof PluginDependencyError) {
    console.error('Missing dependencies');
  }
}

// Version mismatch
catch (error) {
  if (error instanceof PluginVersionError) {
    console.error('Version incompatible');
  }
}
```

## Examples

### Example 1: Rate Limiting Plugin

```typescript
export class RateLimitPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.rate-limit',
    name: 'Rate Limiting',
    version: '1.0.0',
    description: 'Rate limiting middleware'
  };

  private store = new Map<string, number[]>();

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip;
      const now = Date.now();
      const windowMs = 60 * 1000;

      if (!this.store.has(key)) {
        this.store.set(key, []);
      }

      const timestamps = this.store.get(key)!;
      const recentRequests = timestamps.filter(t => now - t < windowMs);

      if (recentRequests.length > 100) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      recentRequests.push(now);
      this.store.set(key, recentRequests);

      next();
    };
  }
}
```

### Example 2: Logging Plugin with Configuration

```typescript
export class LoggingPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.logging',
    name: 'Request Logging',
    version: '1.0.0',
    description: 'Log all HTTP requests',
    configSchema: {
      properties: {
        logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        excludePaths: { type: 'array', items: { type: 'string' } }
      }
    }
  };

  private config: PluginConfig;

  validateConfig(config: PluginConfig) {
    if (config.options?.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.options.logLevel)) {
      return { valid: false, errors: ['Invalid logLevel'] };
    }
    return { valid: true, errors: [] };
  }

  async onInit(config: PluginConfig) {
    this.config = config;
  }

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const excludePaths = this.config.options?.excludePaths || [];
      if (!excludePaths.includes(req.path)) {
        console.log(`[${this.config.options?.logLevel || 'info'}] ${req.method} ${req.path}`);
      }
      next();
    };
  }
}
```

## Best Practices

### 1. Plugin Naming Convention

- Use scoped package names: `@organization/plugin-feature`
- Use descriptive plugin IDs: `com.organization.plugin.feature`
- Include "plugin" in package and plugin names

### 2. Version Management

- Follow semantic versioning (semver) for your plugin
- Specify middleware version requirements in package.json
- Test against multiple middleware versions

### 3. Configuration Validation

```typescript
validateConfig(config: PluginConfig) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.options?.require Field) {
    errors.push('requiredField is required');
  }

  if (config.options?.someValue > 1000) {
    warnings.push('someValue is unusually high');
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### 4. Error Handling

```typescript
async onInit(config: PluginConfig, context: PluginContext) {
  try {
    // Initialization logic
  } catch (error) {
    context.logger?.error(`Failed to initialize: ${error.message}`);
    throw error; // Let framework handle it
  }
}
```

### 5. Resource Cleanup

```typescript
private connections: any[] = [];

async onActivate(context: PluginContext) {
  // Open resources
  this.connections.push(await openConnection());
}

async onDeactivate(context: PluginContext) {
  // Close resources
  for (const conn of this.connections) {
    await conn.close();
  }
  this.connections = [];
}
```

### 6. Dependencies

```typescript
getDependencies(): string[] {
  return [
    'com.example.auth-plugin', // This plugin must load first
    'com.example.logging-plugin'
  ];
}
```

### 7. Documentation

- Write clear README for your plugin
- Include configuration examples
- Document any external dependencies
- Provide troubleshooting guide
- Include integration examples

### 8. Testing

```typescript
describe('MyPlugin', () => {
  let plugin: MyPlugin;

  beforeEach(() => {
    plugin = new MyPlugin();
  });

  it('should validate configuration', () => {
    const result = plugin.validateConfig({ enabled: true });
    expect(result.valid).toBe(true);
  });

  it('should handle middleware requests', () => {
    const middleware = plugin.getMiddleware();
    const req = {}, res = { setHeader: jest.fn() }, next = jest.fn();
    middleware(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
  });
});
```

## Advanced Topics

### Priority-Based Execution

Set plugin priority to control execution order:

```typescript
metadata = {
  // ...
  priority: 10 // Higher = executes later
};
```

### Plugin Communication

Plugins can access other loaded plugins:

```typescript
async getOtherPlugin(context: PluginContext) {
  const otherPlugin = context.plugins?.get('com.example.other-plugin');
  const exports = otherPlugin?.instance.getExports?.();
  return exports;
}
```

### Runtime Configuration Updates

Update plugin configuration without full reload:

```typescript
await registry.reload(pluginId, {
  enabled: true,
  options: { /* new config */ }
});
```

## Troubleshooting

### Plugin Not Loading

1. Check that npm package is installed: `npm list @yourorg/plugin-name`
2. Verify `main` field in plugin's package.json
3. Check that plugin exports a valid PluginInterface
4. Review logs for specific error messages

### Configuration Errors

1. Validate config against schema
2. Check required fields are present
3. Ensure all options match expected types

### Permission Issues

1. Check plugin version compatibility
2. Verify all dependencies are met
3. Check that required plugins are loaded first

---

For more examples and details, see the [example plugin template](../src/plugins/example.plugin.ts).
