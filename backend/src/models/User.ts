import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type XpSource =
  | 'scene_complete'
  | 'choice_made'
  | 'combat_win'
  | 'achievement_unlock'
  | 'playthrough_complete'
  | 'daily_login';

export interface IXpHistoryEntry {
  amount: number;
  source: XpSource;
  timestamp: Date;
}

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  refreshToken?: string;
  refreshTokenExpires?: Date;
  // Progression
  xp: number;
  level: number;
  totalScenesCompleted: number;
  totalChoicesMade: number;
  totalCombatWon: number;
  totalPlaythroughsCompleted: number;
  totalAchievementsUnlocked: number;
  xpHistory?: IXpHistoryEntry[];
  // Social profile (Phase 3)
  displayName?: string;
  bio?: string;
  avatar?: string;
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    storyVisibility: 'public' | 'friends' | 'private';
    achievementVisibility: 'public' | 'friends' | 'private';
    allowFriendRequests: boolean;
    showOnLeaderboard: boolean;
  };
  comparePassword(candidate: string): Promise<boolean>;
  toPublicJSON(): {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    displayName?: string;
    bio?: string;
    avatar?: string;
    xp: number;
    level: number;
    totalScenesCompleted: number;
    totalChoicesMade: number;
    totalCombatWon: number;
    totalPlaythroughsCompleted: number;
    totalAchievementsUnlocked: number;
  };
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    deletedAt: { type: Date, default: null },
    refreshToken: { type: String },
    refreshTokenExpires: { type: Date },
    // Progression
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    totalScenesCompleted: { type: Number, default: 0, min: 0 },
    totalChoicesMade: { type: Number, default: 0, min: 0 },
    totalCombatWon: { type: Number, default: 0, min: 0 },
    totalPlaythroughsCompleted: { type: Number, default: 0, min: 0 },
    totalAchievementsUnlocked: { type: Number, default: 0, min: 0 },
    xpHistory: [
      {
        _id: false,
        amount: { type: Number, required: true },
        source: {
          type: String,
          enum: ['scene_complete', 'choice_made', 'combat_win', 'achievement_unlock', 'playthrough_complete', 'daily_login'],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Social profile (Phase 3)
    displayName: { type: String, trim: true, maxlength: 50 },
    bio: { type: String, maxlength: 500 },
    avatar: { type: String },
    privacySettings: {
      type: new Schema({
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
        storyVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
        achievementVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
        allowFriendRequests: { type: Boolean, default: false },
        showOnLeaderboard: { type: Boolean, default: false },
      }, { _id: false }),
      default: {},
    },
  },
  { timestamps: true }
);

// Pre-save: hash password
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Soft delete: auto-filter non-deleted documents
UserSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

// Instance method: compare password
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Instance method: return safe public representation
UserSchema.methods.toPublicJSON = function () {
  return {
    id: String(this._id),
    username: this.username,
    email: this.email,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
    xp: this.xp,
    level: this.level,
    totalScenesCompleted: this.totalScenesCompleted,
    totalChoicesMade: this.totalChoicesMade,
    totalCombatWon: this.totalCombatWon,
    totalPlaythroughsCompleted: this.totalPlaythroughsCompleted,
    totalAchievementsUnlocked: this.totalAchievementsUnlocked,
  };
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
