import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { decrypt } from '../services/encryption';
import { IAgentConfig, IAISettings } from '../types/user.types';

// Resolve a single agent config to a model instance
export function resolveAgentModel(config: IAgentConfig) {
  const apiKey = config.apiKey ? decrypt(config.apiKey) : undefined;

  switch (config.provider) {
    case 'openai':
    case 'custom': {
      const openai = createOpenAI({ apiKey, baseURL: config.baseUrl });
      return openai(config.model);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey, baseURL: config.baseUrl });
      return anthropic(config.model);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey, baseURL: config.baseUrl });
      return google(config.model);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export interface UserProviderRegistry {
  getContextModel(): ReturnType<typeof resolveAgentModel>;
  getWriterModel(): ReturnType<typeof resolveAgentModel>;
  getSupportModel(): ReturnType<typeof resolveAgentModel>;
  getImageConfig(): IAgentConfig;
}

export function createUserProviderRegistry(aiSettings: IAISettings): UserProviderRegistry {
  return {
    getContextModel: () => resolveAgentModel(aiSettings.contextAgent),
    getWriterModel: () => resolveAgentModel(aiSettings.writerAgent),
    getSupportModel: () => resolveAgentModel(aiSettings.supportAgent),
    getImageConfig: () => aiSettings.imageAgent,
  };
}
