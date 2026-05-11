import mongoose, { Schema, Document } from 'mongoose';
import { IAISettings } from '../types/user.types';
import { encrypt } from '../services/encryption';

export interface IUserSettingsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  language: string;
  theme: string;
  aiSettings: IAISettings;
  createdAt: Date;
  updatedAt: Date;
}

const AgentConfigSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'google', 'custom'],
      required: true,
    },
    model: { type: String, required: true },
    baseUrl: { type: String },
    apiKey: { type: String }, // stored encrypted
  },
  { _id: false }
);

const AISettingsSchema = new Schema(
  {
    contextAgent: { type: AgentConfigSchema, required: true },
    writerAgent: { type: AgentConfigSchema, required: true },
    supportAgent: { type: AgentConfigSchema, required: true },
    imageAgent: { type: AgentConfigSchema, required: true },
  },
  { _id: false }
);

const UserSettingsSchema = new Schema<IUserSettingsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['dark', 'light', 'cyberpunk', 'sepia', 'abyssal'], default: 'dark' },
    aiSettings: { type: AISettingsSchema, required: true },
  },
  { timestamps: true }
);

// Encrypt apiKey fields before save — skip if already in "iv:data" encrypted format
UserSettingsSchema.pre('save', function () {
  const agentNames = ['contextAgent', 'writerAgent', 'supportAgent', 'imageAgent'] as const;
  for (const name of agentNames) {
    const config = this.aiSettings?.[name];
    if (config?.apiKey && typeof config.apiKey === 'string' && !/^[0-9a-f]{32}:/.test(config.apiKey)) {
      config.apiKey = encrypt(config.apiKey);
    }
  }
});

export const UserSettings = mongoose.model<IUserSettingsDocument>(
  'UserSettings',
  UserSettingsSchema
);
