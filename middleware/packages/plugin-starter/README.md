# My Starter Plugin

A starter template for creating MindBlock middleware plugins.

## Description

This is a **template plugin** designed to help you get started with MindBlock plugin development. Copy this directory, customize it, and create your own plugins!

## Features

- ✅ Implements the IPlugin interface
- ✅ Lifecycle hooks (onInit, onDestroy)
- ✅ Configuration support
- ✅ TypeScript types included
- ✅ Jest test setup
- ✅ Ready to publish to npm

## Installation

```bash
npm install @mindblock/plugin-starter
```

## Usage

```typescript
import { MyStarterPlugin } from '@mindblock/plugin-starter';

// Create plugin instance
const plugin = new MyStarterPlugin({
  apiKey: process.env.API_KEY,
  timeout: 10000,
  enabled: true,
});

// Initialize
await plugin.onInit();

// Use plugin methods
await plugin.doSomething();

// Cleanup
await plugin.onDestroy();
```

## Configuration

The plugin accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | `undefined` | Optional API key |
| `timeout` | number | `5000` | Timeout in milliseconds |
| `enabled` | boolean | `true` | Enable/disable plugin |

## API Reference

### Constructor

```typescript
new MyStarterPlugin(config?: MyStarterPluginConfig)
```

### Properties

- `name: string` - Plugin identifier
- `version: string` - Plugin version
- `priority: PluginPriority` - Initialization priority

### Methods

#### onInit()

Initialize the plugin. Called by PluginManager during initialization phase.

```typescript
await plugin.onInit();
```

#### onDestroy()

Clean up plugin resources. Called by PluginManager during shutdown.

```typescript
await plugin.onDestroy();
```

#### doSomething()

Example custom method - replace with your plugin's functionality.

```typescript
await plugin.doSomething();
```

## Development

### Clone and Setup

```bash
git clone https://github.com/mindblock/middleware.git
cd middleware/packages/plugin-starter
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Test with Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

## Creating Your Own Plugin

1. **Copy this template**:
   ```bash
   cp -r packages/plugin-starter my-awesome-plugin
   cd my-awesome-plugin
   ```

2. **Update package.json**:
   - Change `name` to your plugin name
   - Update `description`
   - Update `author`

3. **Rename the plugin class**:
   - Replace `MyStarterPlugin` with your plugin name
   - Update the `name` property

4. **Implement your logic**:
   - Add your initialization code in `onInit()`
   - Add cleanup code in `onDestroy()`
   - Add custom methods

5. **Write tests**:
   - Update `tests/plugin.test.ts`
   - Aim for >80% coverage

6. **Publish**:
   ```bash
   npm run build
   npm publish --access public
   ```

## Plugin Guidelines

### Lifecycle Order

Plugins are initialized in this order:
1. By priority (CRITICAL → HIGH → NORMAL → LOW)
2. By registration time within same priority

Plugins are destroyed in **reverse** order.

### Priority Levels

```typescript
import { PluginPriority } from '@mindblock/middleware/common';

readonly priority = PluginPriority.CRITICAL; // Core plugins first
readonly priority = PluginPriority.HIGH;     // Important plugins
readonly priority = PluginPriority.NORMAL;   // Standard plugins
readonly priority = PluginPriority.LOW;      // Optional plugins last
```

### Dependencies

Declare plugin dependencies:

```typescript
readonly dependencies = ['prometheus-metrics', 'logging'];
```

### Best Practices

- ✅ Keep plugins focused on one responsibility
- ✅ Handle errors gracefully
- ✅ Clean up all resources in `onDestroy()`
- ✅ Use appropriate priority levels
- ✅ Document your API
- ✅ Write comprehensive tests
- ✅ Follow semantic versioning

## Troubleshooting

### Plugin Not Initializing

Check that:
- `onInit()` doesn't throw unhandled errors
- Plugin is registered with PluginManager
- All dependencies are satisfied

### Tests Failing

Ensure:
- Mock contexts are configured correctly
- Async code is properly awaited
- Resources are cleaned up between tests

## Examples

### Basic Plugin

```typescript
import { IPlugin } from '@mindblock/middleware/common';

export class MyPlugin implements IPlugin {
  readonly name = 'my-plugin';
  readonly version = '1.0.0';
  
  async onInit(): Promise<void> {
    console.log('Plugin initialized');
  }
  
  async onDestroy(): Promise<void> {
    console.log('Plugin destroyed');
  }
}
```

### Plugin with Configuration

```typescript
export class ConfigurablePlugin implements IPlugin {
  private config: MyConfig;
  
  constructor(config: MyConfig) {
    this.config = { timeout: 5000, ...config };
  }
  
  async onInit(): Promise<void> {
    // Use this.config
  }
}
```

### Plugin with Dependencies

```typescript
export class DependentPlugin implements IPlugin {
  readonly name = 'dependent-plugin';
  readonly dependencies = ['database', 'cache'];
  
  async onInit(): Promise<void> {
    // database and cache plugins are already initialized
  }
}
```

## Resources

- [Full Plugin Development Guide](../../docs/PLUGIN_DEVELOPMENT.md)
- [Plugin Interface](../../src/common/plugin.interface.ts)
- [Plugin Manager](../../src/common/plugin.manager.ts)
- [Testing Utilities](../../src/common/plugin-testing.utils.ts)

## License

MIT
