import { Plugin, PluginContext } from "./types";
import { PluginRegistry } from "./PluginRegistry";

export class PluginManager {
  private registry = new PluginRegistry();
  private context: PluginContext;

  constructor(context: PluginContext = {}) {
    this.context = context;
  }

  register(plugin: Plugin) {
    this.registry.register(plugin);
  }

  async initAll() {
    for (const plugin of this.registry.getAll()) {
      await plugin.init?.(this.context);
    }
  }

  async startAll() {
    for (const plugin of this.registry.getAll()) {
      await plugin.start?.();
    }
  }

  async stopAll() {
    for (const plugin of this.registry.getAll()) {
      await plugin.stop?.();
    }
  }

  getPlugin(name: string) {
    return this.registry.get(name);
  }
}