# Plugin Development Quick Start Guide

This guide walks you through creating your first middleware plugin for `@mindblock/middleware`.

## 5-Minute Setup

### 1. Create Plugin Project

```bash
mkdir @myorg/plugin-awesome
cd @myorg/plugin-awesome
npm init -y
```

### 2. Install Dependencies

```bash
npm install --save @nestjs/common express
npm install --save-dev typescript @types/express @types/node ts-node
```

### 3. Create Your Plugin

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

export class AwesomePlugin implements PluginInterface {
  private readonly logger = new Logger('AwesomePlugin');

  metadata: PluginMetadata = {
    id: 'com.myorg.plugin.awesome',
    name: 'Awesome Plugin',
    description: 'My awesome middleware plugin',
    version: '1.0.0',
    author: 'Your Name',
    license: 'MIT'
  };

  async onLoad() {
    this.logger.log('Plugin loaded!');
  }

  async onActivate() {
    this.logger.log('Plugin is now active');
  }

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add your middleware logic
      res.setHeader('X-Awesome-Plugin', 'true');
      next();
    };
  }

  validateConfig(config: PluginConfig) {
    return { valid: true, errors: [] };
  }
}

export default AwesomePlugin;
```

### 4. Update package.json

```json
{
  "name": "@myorg/plugin-awesome",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "license": "MIT",
  "keywords": ["mindblock", "plugin", "middleware"],
  "mindblockPlugin": {
    "version": "^1.0.0",
    "autoLoad": false
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "express": "^5.0.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 5. Build and Test Locally

```bash
# Build TypeScript
npx tsc src/index.ts --outDir dist --declaration

# Test in your app
npm link
# In your app: npm link @myorg/plugin-awesome
```

### 6. Use Your Plugin

```typescript
import { PluginRegistry } from '@mindblock/middleware';

const registry = new PluginRegistry();
await registry.init();

// Load your local plugin
const plugin = await registry.load('@myorg/plugin-awesome');
await registry.initialize(plugin.metadata.id);
await registry.activate(plugin.metadata.id);

// Get the middleware
const middleware = registry.getMiddleware(plugin.metadata.id);
app.use(middleware);
```

## Common Plugin Patterns

### Pattern 1: Configuration-Based Plugin

```typescript
export class ConfigurablePlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.configurable',
    // ...
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        timeout: { type: 'number', minimum: 1000, default: 5000 },
        excludePaths: { type: 'array', items: { type: 'string' } }
      }
    }
  };

  private timeout = 5000;
  private excludePaths: string[] = [];

  async onInit(config: PluginConfig) {
    if (config.options) {
      this.timeout = config.options.timeout ?? 5000;
      this.excludePaths = config.options.excludePaths ?? [];
    }
  }

  validateConfig(config: PluginConfig) {
    const errors: string[] = [];
    if (config.options?.timeout && config.options.timeout < 1000) {
      errors.push('timeout must be at least 1000ms');
    }
    return { valid: errors.length === 0, errors };
  }

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Use configuration
      if (!this.excludePaths.includes(req.path)) {
        // Apply middleware with this.timeout
      }
      next();
    };
  }
}
```

### Pattern 2: Stateful Plugin with Resource Management

```typescript
export class StatefulPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.stateful',
    // ...
  };

  private connections: Database[] = [];

  async onActivate(context: PluginContext) {
    // Open resources
    const db = await Database.connect();
    this.connections.push(db);
    context.logger?.log('Database connected');
  }

  async onDeactivate(context: PluginContext) {
    // Close resources
    for (const conn of this.connections) {
      await conn.close();
    }
    this.connections = [];
    context.logger?.log('Database disconnected');
  }

  getMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Use this.connections
      const result = await this.connections[0].query('SELECT 1');
      next();
    };
  }
}
```

### Pattern 3: Plugin with Dependencies

```typescript
export class DependentPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.dependent',
    // ...
  };

  getDependencies(): string[] {
    return ['com.example.auth-plugin']; // Must load after auth plugin
  }

  async onInit(config: PluginConfig, context: PluginContext) {
    // Get the auth plugin
    const authPlugin = context.plugins?.get('com.example.auth-plugin');
    const authExports = authPlugin?.instance.getExports?.();
    // Use auth exports
  }

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Middleware that depends on auth plugin
      next();
    };
  }
}
```

### Pattern 4: Plugin with Custom Exports

```typescript
export class UtilityPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.utility',
    // ...
  };

  private cache = new Map();

  getExports() {
    return {
      cache: this.cache,
      clearCache: () => this.cache.clear(),
      getValue: (key: string) => this.cache.get(key),
      setValue: (key: string, value: any) => this.cache.set(key, value)
    };
  }

  // Other plugins can now use these exports:
  // const exports = registry.getExports('com.example.utility');
  // exports.setValue('key', 'value');
}
```

## Testing Your Plugin

Create `test/plugin.spec.ts`:

```typescript
import { AwesomePlugin } from '../src/index';
import { PluginContext } from '@mindblock/middleware';

describe('AwesomePlugin', () => {
  let plugin: AwesomePlugin;

  beforeEach(() => {
    plugin = new AwesomePlugin();
  });

  it('should have valid metadata', () => {
    expect(plugin.metadata).toBeDefined();
    expect(plugin.metadata.id).toBe('com.myorg.plugin.awesome');
  });

  it('should validate config', () => {
    const result = plugin.validateConfig({ enabled: true });
    expect(result.valid).toBe(true);
  });

  it('should provide middleware', () => {
    const middleware = plugin.getMiddleware();
    expect(typeof middleware).toBe('function');

    const res = { setHeader: jest.fn() };
    const next = jest.fn();
    middleware({} as any, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Awesome-Plugin', 'true');
    expect(next).toHaveBeenCalled();
  });

  it('should execute lifecycle hooks', async () => {
    const context: PluginContext = { logger: console };

    await expect(plugin.onLoad?.(context)).resolves.not.toThrow();
    await expect(plugin.onActivate?.(context)).resolves.not.toThrow();
  });
});
```

Run tests:

```bash
npm install --save-dev jest ts-jest @types/jest
npm test
```

## Publishing Your Plugin

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Awesome Plugin"
git remote add origin https://github.com/yourorg/plugin-awesome.git
git push -u origin main
```

### 2. Publish to npm

```bash
# Login to npm
npm login

# Publish (for scoped packages with --access=public)
npm publish --access=public
```

### 3. Add to Plugin Registry

Users can now install and use your plugin:

```bash
npm install @myorg/plugin-awesome
```

```typescript
const registry = new PluginRegistry();
await registry.init();
await registry.loadAndActivate('@myorg/plugin-awesome');
```

## Plugin Checklist

Before publishing, ensure:

- ✅ Plugin implements `PluginInterface`
- ✅ Metadata includes all required fields (id, name, version, description)
- ✅ Configuration validates correctly
- ✅ Lifecycle hooks handle errors gracefully
- ✅ Resource cleanup in `onDeactivate` and `onUnload`
- ✅ Tests pass (>80% coverage recommended)
- ✅ TypeScript compiles without errors
- ✅ README with setup and usage examples
- ✅ package.json includes `mindblockPlugin` configuration
- ✅ Scoped package name (e.g., `@org/plugin-name`)

## Example Plugins

### Example 1: CORS Plugin

```typescript
export class CorsPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.cors',
    name: 'CORS Handler',
    version: '1.0.0',
    description: 'Handle CORS headers'
  };

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }

      next();
    };
  }
}
```

### Example 2: Request ID Plugin

```typescript
import { v4 as uuidv4 } from 'uuid';

export class RequestIdPlugin implements PluginInterface {
  metadata: PluginMetadata = {
    id: 'com.example.request-id',
    name: 'Request ID Generator',
    version: '1.0.0',
    description: 'Add unique ID to each request'
  };

  getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-ID', requestId);
      (req as any).id = requestId;
      next();
    };
  }

  getExports() {
    return {
      getRequestId: (req: Request) => (req as any).id
    };
  }
}
```

## Advanced Topics

### Accessing Plugin Context

```typescript
async onInit(config: PluginConfig, context: PluginContext) {
  // Access logger
  context.logger?.log('Initializing plugin');

  // Access environment
  const apiKey = context.env?.API_KEY;

  // Access other plugins
  const otherPlugin = context.plugins?.get('com.example.other');

  // Access app config
  const appConfig = context.config;
}
```

### Plugin-to-Plugin Communication

```typescript
// Plugin A
getExports() {
  return {
    getUserData: (userId: string) => ({ id: userId, name: 'John' })
  };
}

// Plugin B
async onInit(config: PluginConfig, context: PluginContext) {
  const pluginA = context.plugins?.get('com.example.plugin-a');
  const moduleA = pluginA?.instance.getExports?.();
  const userData = moduleA?.getUserData('123');
}
```

## Resources

- [Full Plugin Documentation](PLUGINS.md)
- [Plugin API Reference](../src/common/interfaces/plugin.interface.ts)
- [Example Plugin](../src/plugins/example.plugin.ts)
- [Plugin System Tests](../tests/integration/plugin-system.integration.spec.ts)

---

**Happy plugin development!** 🚀

Have questions? Check the [main documentation](PLUGINS.md) or create an issue.
