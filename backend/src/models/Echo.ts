import mongoose, { Schema, Document } from 'mongoose';

export type EchoType = 'mercy' | 'betrayal' | 'discovery' | 'consequence';
export type EchoStatus = 'planted' | 'approaching' | 'active' | 'resolved';

export interface IEchoDocument extends Document {
  playthroughId: mongoose.Types.ObjectId;
  triggerChapterId: mongoose.Types.ObjectId;
  triggerChapterIndex: number;
  targetChapterIndex: number;
  type: EchoType;
  description: string;
  narrative: string;
  status: EchoStatus;
  minChapterDelay: number;
  maxChapterDelay: number;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EchoSchema = new Schema<IEchoDocument>(
  {
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
      index: true,
    },
    triggerChapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    triggerChapterIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    targetChapterIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['mercy', 'betrayal', 'discovery', 'consequence'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    narrative: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['planted', 'approaching', 'active', 'resolved'],
      default: 'planted',
    },
    minChapterDelay: {
      type: Number,
      required: true,
      min: 5,
      max: 20,
      default: 10,
    },
    maxChapterDelay: {
      type: Number,
      required: true,
      min: 10,
      max: 25,
      default: 15,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
EchoSchema.index({ playthroughId: 1, status: 1 });
EchoSchema.index({ playthroughId: 1, targetChapterIndex: 1 });
EchoSchema.index({ playthroughId: 1, triggerChapterIndex: 1 });

// Compound unique index: one echo per trigger chapter per type per playthrough
EchoSchema.index(
  { playthroughId: 1, triggerChapterId: 1, type: 1 },
  { unique: true }
);

export const Echo = mongoose.model<IEchoDocument>('Echo', EchoSchema);
