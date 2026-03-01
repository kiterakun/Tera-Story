import mongoose, { Schema, Document } from 'mongoose';

export interface IItemDocument extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  ownerId?: mongoose.Types.ObjectId;
  playthroughId: mongoose.Types.ObjectId;
  createdInChapterId?: mongoose.Types.ObjectId;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItemDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'Character',
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    createdInChapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const Item = mongoose.model<IItemDocument>('Item', ItemSchema);
