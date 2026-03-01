import mongoose, { Schema, Document } from 'mongoose';
import { IAISettings } from '../types/user.types';

export interface IUserSettingsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  language: string;
  theme: 'dark' | 'light';
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
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    aiSettings: { type: AISettingsSchema, required: true },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model<IUserSettingsDocument>(
  'UserSettings',
  UserSettingsSchema
);
