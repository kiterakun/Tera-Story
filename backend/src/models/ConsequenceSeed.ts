import mongoose, { Schema, Document } from 'mongoose';

export interface IConsequenceSeedDocument extends Document {
  playthroughId: mongoose.Types.ObjectId;
  triggerChapterId: mongoose.Types.ObjectId;
  triggerChapterIndex: number;
  description: string;
  minChapterDelay: number; // minimum chapters before this can activate
  activated: boolean;
  activatedInChapterId?: mongoose.Types.ObjectId;
  impact: 'minor' | 'major' | 'critical';
  tags: string[];
  createdAt: Date;
}

const ConsequenceSeedSchema = new Schema<IConsequenceSeedDocument>(
  {
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    triggerChapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    triggerChapterIndex: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    minChapterDelay: {
      type: Number,
      default: 3,
      min: 1,
      max: 20,
    },
    activated: {
      type: Boolean,
      default: false,
    },
    activatedInChapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    impact: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'minor',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ConsequenceSeedSchema.index({ playthroughId: 1, activated: 1 });

export const ConsequenceSeed = mongoose.model<IConsequenceSeedDocument>('ConsequenceSeed', ConsequenceSeedSchema);
