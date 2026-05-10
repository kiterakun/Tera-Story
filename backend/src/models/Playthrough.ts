import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaythroughDocument extends Document {
  name: string;
  worldId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'completed';
  currentArcIndex: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PlaythroughSchema.index({ userId: 1, worldId: 1 });

// Soft delete: auto-filter non-deleted documents
PlaythroughSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const Playthrough = mongoose.model<IPlaythroughDocument>('Playthrough', PlaythroughSchema);
