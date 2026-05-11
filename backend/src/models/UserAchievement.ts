import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserAchievement {
  userId: Types.ObjectId;
  achievementKey: string;
  progress: number;
  unlockedAt: Date | null;
}

export interface IUserAchievementDocument extends IUserAchievement, Document {}

const UserAchievementSchema = new Schema<IUserAchievementDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    achievementKey: { type: String, required: true },
    progress: { type: Number, default: 0 },
    unlockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique compound index: one progress record per user per achievement
UserAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, unlockedAt: -1 });

export const UserAchievement = mongoose.model<IUserAchievementDocument>(
  'UserAchievement',
  UserAchievementSchema
);
