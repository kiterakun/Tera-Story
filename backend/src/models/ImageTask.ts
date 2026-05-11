import mongoose, { Schema, Document } from 'mongoose';
import { ImageJobDetails } from '../agents/imageAgent';

export type ImageEntityType = 'character' | 'item' | 'special-item' | 'world';
export type ImageTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IImageTaskDocument extends Document {
  entityDetails: ImageJobDetails;
  entityType: ImageEntityType;
  entityId: string;
  worldId: string;
  userId: mongoose.Types.ObjectId;
  status: ImageTaskStatus;
  resultUrl?: string;
  error?: string;
  retryCount: number;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImageTaskSchema = new Schema<IImageTaskDocument>(
  {
    entityDetails: { type: Schema.Types.Mixed, required: true },
    entityType: {
      type: String,
      required: true,
      enum: ['character', 'item', 'special-item', 'world'],
    },
    entityId: { type: String, required: true },
    worldId: { type: String, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    resultUrl: { type: String },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    nextRetryAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound index for claiming pending jobs in FIFO order
ImageTaskSchema.index({ status: 1, createdAt: 1 });

// TTL index: auto-delete completed/failed documents after 7 days
ImageTaskSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const ImageTask = mongoose.model<IImageTaskDocument>('ImageTask', ImageTaskSchema);
