import mongoose, { Schema, Document } from 'mongoose';

export interface IUnlockCriteria {
  type: 'count' | 'specific_action' | 'collection_threshold' | 'playthrough_complete' | 'streak';
  field?: string;
  threshold?: number;
  condition?: string;
}

export interface ILocalizedString {
  en: string;
  vi: string;
}

export interface IAchievement {
  key: string;
  name: ILocalizedString;
  description: ILocalizedString;
  icon: string;
  category: 'exploration' | 'combat' | 'collection' | 'social' | 'milestone' | 'hidden';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  hidden: boolean;
  unlockCriteria: IUnlockCriteria;
  xpReward: number;
  sortOrder: number;
}

export interface IAchievementDocument extends IAchievement, Document {}

const unlockCriteriaSchema = new Schema<IUnlockCriteria>(
  {
    type: {
      type: String,
      enum: ['count', 'specific_action', 'collection_threshold', 'playthrough_complete', 'streak'],
      required: true,
    },
    field: { type: String },
    threshold: { type: Number },
    condition: { type: String },
  },
  { _id: false }
);

const localizedStringSchema = new Schema<ILocalizedString>(
  {
    en: { type: String, required: true },
    vi: { type: String, required: true },
  },
  { _id: false }
);

const AchievementSchema = new Schema<IAchievementDocument>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: localizedStringSchema, required: true },
    description: { type: localizedStringSchema, required: true },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: ['exploration', 'combat', 'collection', 'social', 'milestone', 'hidden'],
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic'],
      required: true,
    },
    hidden: { type: Boolean, default: false },
    unlockCriteria: { type: unlockCriteriaSchema, required: true },
    xpReward: { type: Number, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model<IAchievementDocument>('Achievement', AchievementSchema);
