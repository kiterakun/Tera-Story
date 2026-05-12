import type { AppTheme } from './theme';

export interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface AISettings {
  contextAgent: AgentConfig;
  writerAgent: AgentConfig;
  supportAgent: AgentConfig;
  imageAgent: AgentConfig;
}

export interface UserSettings {
  language: string;
  theme: AppTheme;
  aiSettings?: AISettings;
}
