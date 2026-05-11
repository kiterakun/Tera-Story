import mongoose, { Schema, Document } from 'mongoose';

export type StoryCardRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type StoryCardCategory = 'story' | 'combat' | 'character' | 'discovery' | 'milestone';

export interface IStoryCard {
  userId: mongoose.Types.ObjectId;
  playthroughId: mongoose.Types.ObjectId;
  worldId: mongoose.Types.ObjectId;
  sceneId: mongoose.Types.ObjectId;
  choiceId?: mongoose.Types.ObjectId;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description: string;
  rarity: StoryCardRarity;
  category: StoryCardCategory;
  unlockedAt: Date;
  shared: boolean;
  shareCount: number;
  publicShareUrl?: string;
}

export interface IStoryCardDocument extends IStoryCard, Document {
  createdAt: Date;
  updatedAt: Date;
}

const StoryCardSchema = new Schema<IStoryCardDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    sceneId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    choiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic'],
      required: true,
    },
    category: {
      type: String,
      enum: ['story', 'combat', 'character', 'discovery', 'milestone'],
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
    shared: {
      type: Boolean,
      default: false,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    publicShareUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
StoryCardSchema.index({ userId: 1, rarity: 1 });
StoryCardSchema.index({ userId: 1, playthroughId: 1 });
StoryCardSchema.index({ playthroughId: 1, sceneId: 1 }, { unique: true });
StoryCardSchema.index({ publicShareUrl: 1 }, { unique: true, sparse: true });

export const StoryCard = mongoose.model<IStoryCardDocument>('StoryCard', StoryCardSchema);
