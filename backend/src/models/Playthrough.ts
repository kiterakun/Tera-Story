import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaythroughDocument extends Document {
  name: string;
  worldId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'completed';
  currentArcIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlaythroughSchema = new Schema<IPlaythroughDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    worldId: {
      type: Schema.Types.ObjectId,
      ref: 'World',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    currentArcIndex: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

PlaythroughSchema.index({ worldId: 1, userId: 1 });

export const Playthrough = mongoose.model<IPlaythroughDocument>('Playthrough', PlaythroughSchema);
