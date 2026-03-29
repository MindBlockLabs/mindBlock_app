import { Plugin } from "./types";

export class PluginLoader {
  static async load(path: string): Promise<Plugin> {
    const mod = await import(path);
    return mod.default;
  }
}