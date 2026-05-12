import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyLoginReward {
  xp: number;
  bonus?: string;
  bonusClaimed: boolean;
}

export interface IDailyLoginDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  streak: number;
  claimedAt: Date;
  reward: IDailyLoginReward;
}

const DailyLoginSchema = new Schema<IDailyLoginDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    streak: {
      type: Number,
      required: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    reward: {
      xp: { type: Number, required: true },
      bonus: { type: String },
      bonusClaimed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

DailyLoginSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyLoginSchema.index({ userId: 1, claimedAt: -1 });

export const DailyLogin = mongoose.model<IDailyLoginDocument>(
  'DailyLogin',
  DailyLoginSchema
);
