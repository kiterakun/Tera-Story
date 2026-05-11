import mongoose, { Schema, Document } from 'mongoose';
import { IDynamicStat } from '../types/character.types';

export interface ICharacterDocument extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  status: 'active' | 'dead' | 'injured' | 'missing';
  playthroughId: mongoose.Types.ObjectId;
  worldId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdInChapterId?: mongoose.Types.ObjectId;
  dynamicStats: IDynamicStat[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const DynamicStatSchema = new Schema(
  {
    k: { type: String, required: true },
    v: { type: Schema.Types.Mixed },
    t: { type: String, required: true },
  },
  { _id: false }
);

const CharacterSchema = new Schema<ICharacterDocument>(
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
    role: {
      type: String,
      enum: ['protagonist', 'npc'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'dead', 'injured', 'missing'],
      default: 'active',
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
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
    createdInChapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    dynamicStats: {
      type: [DynamicStatSchema],
      default: [],
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
CharacterSchema.index({ playthroughId: 1, role: 1 });
CharacterSchema.index({ 'dynamicStats.k': 1, 'dynamicStats.v': 1 });

// Soft delete: auto-filter non-deleted documents
CharacterSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const Character = mongoose.model<ICharacterDocument>('Character', CharacterSchema);
