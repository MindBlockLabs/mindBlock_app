export type PluginContext = {
  config?: Record<string, any>;
  logger?: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
};

export interface Plugin {
  name: string;
  version: string;

  init?(context: PluginContext): Promise<void> | void;
  start?(): Promise<void> | void;
  stop?(): Promise<void> | void;
}