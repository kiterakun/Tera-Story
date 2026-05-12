import mongoose, { Schema, Document } from 'mongoose';

export interface IStreakFreezeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: string;
  available: number;
  usedDates: string[];
}

const StreakFreezeSchema = new Schema<IStreakFreezeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weekStart: {
      type: String,
      required: true,
    },
    available: {
      type: Number,
      required: true,
      max: 1,
    },
    usedDates: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const StreakFreeze = mongoose.model<IStreakFreezeDocument>(
  'StreakFreeze',
  StreakFreezeSchema
);
