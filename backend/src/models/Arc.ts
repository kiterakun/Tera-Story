import mongoose, { Schema, Document } from 'mongoose';

export interface IArcDocument extends Document {
  title: string;
  summary?: string;
  playthroughId: mongoose.Types.ObjectId;
  arcIndex: number;
  status: 'active' | 'completed';
  createdAt: Date;
}

const ArcSchema = new Schema<IArcDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    arcIndex: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes
ArcSchema.index({ playthroughId: 1, arcIndex: 1 }, { unique: true });

export const Arc = mongoose.model<IArcDocument>('Arc', ArcSchema);
