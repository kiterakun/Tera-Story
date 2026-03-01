import mongoose, { Schema, Document } from 'mongoose';
import { ICharacter, IDynamicStat } from '../types/character.types';

export interface ICharacterDocument extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  playthroughId: mongoose.Types.ObjectId;
  worldId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  level: number;
  health: number;
  mana: number;
  dynamicStats: IDynamicStat[];
  createdAt: Date;
  updatedAt: Date;
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
    level: {
      type: Number,
      default: 1,
    },
    health: {
      type: Number,
      default: 100,
    },
    mana: {
      type: Number,
      default: 0,
    },
    dynamicStats: {
      type: [DynamicStatSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes
CharacterSchema.index({ playthroughId: 1, role: 1 });
CharacterSchema.index({ 'dynamicStats.k': 1, 'dynamicStats.v': 1 });

export const Character = mongoose.model<ICharacterDocument>('Character', CharacterSchema);
