# Plugin Development Guide

This guide walks you through creating, testing, and publishing plugins for the MindBlock middleware system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Creating Your First Plugin](#creating-your-first-plugin)
- [Testing Your Plugin](#testing-your-plugin)
- [Publishing Your Plugin](#publishing-your-plugin)
- [Best Practices](#best-practices)

## Prerequisites

Before you start, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of TypeScript and NestJS
- Git for version control

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/mindblock/middleware.git
cd middleware
npm install
```

### Explore the Starter Template

We provide a starter template at `packages/plugin-starter/` with everything you need:

```bash
ls packages/plugin-starter/
# ├── src/
# │   └── index.ts          # Main plugin file
# ├── tests/
# │   └── plugin.test.ts    # Test file
# ├── package.json          # Pre-configured for publishing
# └── README.md             # Documentation template
```

## Creating Your First Plugin

### Step 1: Use the Starter Template

Copy the starter template to your new plugin directory:

```bash
cp -r packages/plugin-starter my-awesome-plugin
cd my-awesome-plugin
```

### Step 2: Update Package Configuration

Edit `package.json`:

```json
{
  "name": "@your-org/my-awesome-plugin",
  "version": "1.0.0",
  "description": "An awesome plugin for MindBlock",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["mindblock", "plugin", "middleware"],
  "license": "MIT",
  "peerDependencies": {
    "@mindblock/middleware": ">=0.1.0"
  }
}
```

### Step 3: Implement Your Plugin

Edit `src/index.ts`:

```typescript
import { IPlugin, PluginPriority } from '@mindblock/middleware/common';

export interface MyPluginConfig {
  apiKey?: string;
  timeout?: number;
  enabled?: boolean;
}

export class MyAwesomePlugin implements IPlugin {
  readonly name = 'my-awesome-plugin';
  readonly version = '1.0.0';
  readonly priority = PluginPriority.NORMAL;
  
  private config: MyPluginConfig;
  
  constructor(config: MyPluginConfig = {}) {
    this.config = {
      timeout: 5000,
      enabled: true,
      ...config,
    };
  }
  
  async onInit(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    
    // Initialize your plugin here
    // - Set up connections
    // - Load configuration
    // - Register handlers
    
    console.log(`[${this.name}] Initialized successfully`);
  }
  
  async onDestroy(): Promise<void> {
    console.log(`[${this.name}] Cleaning up...`);
    
    // Clean up resources
    // - Close connections
    // - Clear timers
    // - Release memory
    
    console.log(`[${this.name}] Cleanup complete`);
  }
  
  // Add your custom methods here
  async doSomething(): Promise<void> {
    // Your plugin logic
  }
}
```

### Step 4: Build Your Plugin

```bash
npm run build
```

## Testing Your Plugin

### Unit Testing

The starter template includes Jest configuration. Write tests in `tests/`:

```typescript
// tests/plugin.test.ts
import { MyAwesomePlugin } from '../src';
import { createPluginTestContext, testPluginLifecycle } from '@mindblock/middleware/common';

describe('MyAwesomePlugin', () => {
  it('should initialize successfully', async () => {
    const plugin = new MyAwesomePlugin({ enabled: true });
    await expect(plugin.onInit()).resolves.not.toThrow();
  });
  
  it('should clean up on destroy', async () => {
    const plugin = new MyAwesomePlugin();
    await plugin.onInit();
    await expect(plugin.onDestroy()).resolves.not.toThrow();
  });
  
  it('should work with test context', async () => {
    const ctx = createPluginTestContext({
      config: { apiKey: 'test-key' },
    });
    
    const plugin = new MyAwesomePlugin(ctx.config);
    await plugin.onInit();
    
    expect(ctx.logger.log).toHaveBeenCalled();
  });
  
  it('should follow lifecycle order', async () => {
    const plugin = new MyAwesomePlugin();
    const result = await testPluginLifecycle(plugin);
    
    expect(result.initCalled).toBe(true);
    expect(result.destroyCalled).toBe(true);
    expect(result.executionOrder).toEqual(['onInit', 'onDestroy']);
  });
});
```

### Run Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:cov
```

## Publishing Your Plugin

### Step 1: Prepare for Publishing

Update your README.md with:
- Plugin description
- Installation instructions
- Usage examples
- Configuration options
- API reference

### Step 2: Build Distribution

```bash
npm run build
```

### Step 3: Test Locally

```bash
npm pack
# Creates a .tgz file you can test in another project
```

### Step 4: Publish to npm

```bash
npm publish --access public
```

For scoped packages (@your-org/):
```bash
npm publish --access public
```

### Step 5: Verify Publication

Check your package on npmjs.com:
```
https://www.npmjs.com/package/@your-org/my-awesome-plugin
```

## Best Practices

### 1. Follow Plugin Lifecycle

Always implement both `onInit` and `onDestroy`:

```typescript
async onInit(): Promise<void> {
  // Setup code
}

async onDestroy(): Promise<void> {
  // Cleanup code - even if nothing to clean up
}
```

### 2. Handle Errors Gracefully

```typescript
async onInit(): Promise<void> {
  try {
    // Initialization logic
  } catch (error) {
    console.error(`[${this.name}] Init failed:`, error);
    throw error; // Re-throw to prevent broken plugin from loading
  }
}
```

### 3. Use Appropriate Priority

```typescript
readonly priority = PluginPriority.CRITICAL; // Core functionality
readonly priority = PluginPriority.HIGH;     // Important features
readonly priority = PluginPriority.NORMAL;   // Standard plugins
readonly priority = PluginPriority.LOW;      // Optional enhancements
```

### 4. Document Dependencies

```typescript
readonly dependencies = ['prometheus-metrics'];
```

### 5. Keep Plugins Focused

Each plugin should do one thing well. Avoid monolithic plugins.

### 6. Use Configuration Objects

```typescript
constructor(config: MyPluginConfig = {}) {
  this.config = {
    default: 'value',
    ...config,
  };
}
```

### 7. Write Comprehensive Tests

Aim for >80% code coverage. Test:
- Happy path
- Edge cases
- Error conditions
- Lifecycle methods

### 8. Follow Semantic Versioning

- MAJOR.MINOR.PATCH (e.g., 1.2.3)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### 9. Export Types

Always export TypeScript types for better DX:

```typescript
export interface MyPluginConfig { ... }
export type MyPluginOptions = Partial<MyPluginConfig>;
```

### 10. Provide Examples

Include usage examples in your README:

```typescript
import { MyAwesomePlugin } from '@your-org/my-awesome-plugin';

const plugin = new MyAwesomePlugin({
  apiKey: process.env.API_KEY,
  timeout: 10000,
});

await plugin.onInit();
```

## Example Plugin Structure

```
my-awesome-plugin/
├── src/
│   ├── index.ts              # Main plugin class
│   ├── types.ts              # Type definitions
│   └── utils.ts              # Helper functions
├── tests/
│   ├── plugin.test.ts        # Unit tests
│   └── integration.test.ts   # Integration tests
├── docs/
│   └── API.md                # API documentation
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Troubleshooting

### Plugin Not Initializing

Check that:
- `onInit()` is implemented
- No unhandled errors in `onInit()`
- Plugin is registered with PluginManager

### Tests Failing

Ensure:
- Mock contexts are properly configured
- Async code is awaited
- Resources are cleaned up

### Publishing Issues

Verify:
- Package name is unique
- You have npm publish permissions
- All files are included in `files` array in package.json

## Next Steps

- Browse existing plugins for inspiration
- Join the MindBlock community
- Contribute to the plugin ecosystem
- Share your plugins with the community!

## Resources

- [Plugin Interface Documentation](../src/common/plugin.interface.ts)
- [Plugin Manager Implementation](../src/common/plugin.manager.ts)
- [Testing Utilities](../src/common/plugin-testing.utils.ts)
- [Example: Prometheus Metrics Plugin](../src/monitoring/prometheus.plugin.ts)
