import mongoose, { Schema, Document } from 'mongoose';

export type SpecialItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ISpecialItemDocument extends Document {
  name: string;
  description: string;
  category: string;          // maps to SpecialItemTemplate.category
  rarity: SpecialItemRarity;
  status: 'active' | 'sealed' | 'lost' | 'consumed';
  imageUrl?: string;
  templateId?: mongoose.Types.ObjectId; // FK to SpecialItemTemplate
  ownerId?: mongoose.Types.ObjectId;   // Character who owns/learned this
  playthroughId: mongoose.Types.ObjectId;
  createdInChapterId?: mongoose.Types.ObjectId;
  customFields: Record<string, unknown>; // values matching SpecialItemTemplate.fields
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const SpecialItemSchema = new Schema<ISpecialItemDocument>(
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
    category: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    status: {
      type: String,
      enum: ['active', 'sealed', 'lost', 'consumed'],
      default: 'active',
    },
    imageUrl: {
      type: String,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'SpecialItemTemplate',
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
    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
SpecialItemSchema.index({ playthroughId: 1, category: 1 });
SpecialItemSchema.index({ ownerId: 1 });

// Soft delete: auto-filter non-deleted and non-archived documents
SpecialItemSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
  if (!('archivedAt' in filter)) {
    const currentFilter = this.getFilter() as Record<string, unknown>;
    this.setQuery({ ...currentFilter, archivedAt: null });
  }
});

export const SpecialItem = mongoose.model<ISpecialItemDocument>('SpecialItem', SpecialItemSchema);
