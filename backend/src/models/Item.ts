import mongoose, { Schema, Document } from 'mongoose';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface IItemDocument extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  rarity: ItemRarity;
  status: 'active' | 'destroyed' | 'lost' | 'consumed';
  ownerId?: mongoose.Types.ObjectId;
  playthroughId: mongoose.Types.ObjectId;
  createdInChapterId?: mongoose.Types.ObjectId;
  properties: Record<string, unknown>;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    status: {
      type: String,
      enum: ['active', 'destroyed', 'lost', 'consumed'],
      default: 'active',
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
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Soft delete: auto-filter non-deleted and non-archived documents
ItemSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
  if (!('archivedAt' in filter)) {
    const currentFilter = this.getFilter() as Record<string, unknown>;
    this.setQuery({ ...currentFilter, archivedAt: null });
  }
});

export const Item = mongoose.model<IItemDocument>('Item', ItemSchema);
