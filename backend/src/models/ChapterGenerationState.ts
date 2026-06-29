import mongoose, { Schema, Document } from 'mongoose';
import type { IContextOutput } from '../types/agent.types';
import type { IAISettings } from '../types/user.types';

export type GenerationPhase =
  | 'context'
  | 'writing'
  | 'tools'
  | 'post_effects'
  | 'travel'
  | 'complete';

export type GenerationStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'awaiting_user';

export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface IPhaseError {
  message: string;
  code?: string;
  stack?: string;
  provider?: string;
  model?: string;
  timestamp: Date;
}

export interface IPhaseState {
  phase: GenerationPhase;
  status: PhaseStatus;
  attempts: number;
  maxAttempts: number;
  lastStartedAt?: Date;
  lastCompletedAt?: Date;
  lastError?: IPhaseError;
  outputs?: Record<string, unknown>;
}

export interface IChapterGenerationStateDocument extends Document {
  playthroughId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  arcId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  playerChoice: string;
  status: GenerationStatus;
  currentPhase: GenerationPhase;
  phases: IPhaseState[];
  autoRetryCount: number;
  userRetryCount: number;
  modelSnapshot: IAISettings;
  contextOutput?: IContextOutput;
  appliedEffects?: string[];
  error?: {
    message: string;
    code?: string;
    failedPhase?: GenerationPhase;
    provider?: string;
    model?: string;
    details?: string;
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PhaseErrorSchema = new Schema(
  {
    message: { type: String, required: true },
    code: { type: String },
    stack: { type: String },
    provider: { type: String },
    model: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PhaseStateSchema = new Schema(
  {
    phase: {
      type: String,
      enum: ['context', 'writing', 'tools', 'post_effects', 'travel', 'complete'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 4 }, // 1 initial + 3 retries
    lastStartedAt: { type: Date },
    lastCompletedAt: { type: Date },
    lastError: { type: PhaseErrorSchema },
    outputs: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const GenerationErrorSchema = new Schema(
  {
    message: { type: String, required: true },
    code: { type: String },
    failedPhase: { type: String },
    provider: { type: String },
    model: { type: String },
    details: { type: String },
  },
  { _id: false }
);

const ChapterGenerationStateSchema = new Schema<IChapterGenerationStateDocument>(
  {
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      unique: true,
    },
    arcId: {
      type: Schema.Types.ObjectId,
      ref: 'Arc',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    playerChoice: { type: String, default: '' },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'awaiting_user'],
      default: 'running',
    },
    currentPhase: {
      type: String,
      enum: ['context', 'writing', 'tools', 'post_effects', 'travel', 'complete'],
      default: 'context',
    },
    phases: {
      type: [PhaseStateSchema],
      default: () => [
        { phase: 'context', status: 'pending', attempts: 0, maxAttempts: 4 },
        { phase: 'writing', status: 'pending', attempts: 0, maxAttempts: 4 },
        { phase: 'tools', status: 'pending', attempts: 0, maxAttempts: 4 },
        { phase: 'post_effects', status: 'pending', attempts: 0, maxAttempts: 4 },
        { phase: 'travel', status: 'pending', attempts: 0, maxAttempts: 4 },
        { phase: 'complete', status: 'pending', attempts: 0, maxAttempts: 1 },
      ],
    },
    autoRetryCount: { type: Number, default: 0 },
    userRetryCount: { type: Number, default: 0 },
    modelSnapshot: { type: Schema.Types.Mixed, required: true },
    contextOutput: { type: Schema.Types.Mixed },
    appliedEffects: { type: [String], default: [] },
    error: { type: GenerationErrorSchema },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ChapterGenerationStateSchema.index({ playthroughId: 1, status: 1, updatedAt: -1 });
ChapterGenerationStateSchema.index({ userId: 1, updatedAt: -1 });

export const ChapterGenerationState = mongoose.model<IChapterGenerationStateDocument>(
  'ChapterGenerationState',
  ChapterGenerationStateSchema
);
