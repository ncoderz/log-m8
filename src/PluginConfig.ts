export interface PluginConfig {
  name: string;
  [key: string]: unknown; // Additional plugin-specific settings
}
