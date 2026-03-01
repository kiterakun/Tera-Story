import mongoose, { Schema, Document } from 'mongoose';

export type SpecialItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ISpecialItemDocument extends Document {
  name: string;
  description: string;
  category: string;          // maps to World.specialItemTemplates[].category
  rarity: SpecialItemRarity;
  imageUrl?: string;
  ownerId?: mongoose.Types.ObjectId;   // Character who owns/learned this
  playthroughId: mongoose.Types.ObjectId;
  createdInChapterId?: mongoose.Types.ObjectId;
  customFields: Record<string, unknown>; // values matching SpecialItemTemplate.fields
  createdAt: Date;
  updatedAt: Date;
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
    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
SpecialItemSchema.index({ playthroughId: 1, category: 1 });
SpecialItemSchema.index({ ownerId: 1 });

export const SpecialItem = mongoose.model<ISpecialItemDocument>('SpecialItem', SpecialItemSchema);
