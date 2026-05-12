import mongoose, { Schema, Document } from 'mongoose';

export type QuestType =
  | 'read_scenes'
  | 'make_choices'
  | 'win_combat'
  | 'unlock_achievement'
  | 'collect_card';

export interface IDailyQuestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  questType: QuestType;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  xpReward: number;
}

const DailyQuestSchema = new Schema<IDailyQuestDocument>(
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
    questType: {
      type: String,
      enum: [
        'read_scenes',
        'make_choices',
        'win_combat',
        'unlock_achievement',
        'collect_card',
      ],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
    xpReward: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

DailyQuestSchema.index({ userId: 1, date: 1 });

export const DailyQuest = mongoose.model<IDailyQuestDocument>(
  'DailyQuest',
  DailyQuestSchema
);
