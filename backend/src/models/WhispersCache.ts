import mongoose, { Schema, Document } from 'mongoose';

export type WhisperType = 'rumor' | 'letter' | 'diary' | 'news';
export type WhisperEntityType = 'character' | 'location' | 'item' | 'arc';

export interface IWhisper {
  type: WhisperType;
  content: string;
  relatedEntityType?: WhisperEntityType;
  relatedEntityId?: mongoose.Types.ObjectId;
  attribution?: string;
}

export interface IWhispersCacheDocument extends Document {
  playthroughId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  whispers: IWhisper[];
  generatedAt: Date;
  expiresAt: Date;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WhisperSchema = new Schema<IWhisper>(
  {
    type: {
      type: String,
      enum: ['rumor', 'letter', 'diary', 'news'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 500,
    },
    relatedEntityType: {
      type: String,
      enum: ['character', 'location', 'item', 'arc'],
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
    },
    attribution: {
      type: String,
      maxlength: 100,
    },
  },
  { _id: false }
);

const WhispersCacheSchema = new Schema<IWhispersCacheDocument>(
  {
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    whispers: {
      type: [WhisperSchema],
      required: true,
      validate: {
        validator: (v: IWhisper[]) => v.length >= 3 && v.length <= 5,
        message: 'Whispers must contain 3-5 items',
      },
    },
    generatedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    viewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
WhispersCacheSchema.index({ playthroughId: 1 }, { unique: true });
WhispersCacheSchema.index({ userId: 1 });
WhispersCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save: set expiresAt to 7 days from generatedAt
WhispersCacheSchema.pre('save', function () {
  if (this.isNew || this.isModified('generatedAt')) {
    this.expiresAt = new Date(this.generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
});

export const WhispersCache = mongoose.model<IWhispersCacheDocument>(
  'WhispersCache',
  WhispersCacheSchema
);
