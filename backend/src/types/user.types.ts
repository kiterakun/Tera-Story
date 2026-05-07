export interface IAgentConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  baseUrl?: string;
  apiKey?: string; // stored encrypted in DB, masked in API responses
}

export interface IAISettings {
  contextAgent: IAgentConfig;
  writerAgent: IAgentConfig;
  supportAgent: IAgentConfig;
  imageAgent: IAgentConfig;
}

export interface IUserSettings {
  _id: string;
  userId: string;
  language: string; // e.g. 'en', 'vi'
  theme: string;
  aiSettings: IAISettings;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
  updatedAt: Date;
}
