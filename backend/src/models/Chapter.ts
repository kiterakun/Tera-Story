import mongoose, { Schema, Document } from 'mongoose';

export interface IChapterDocument extends Document {
  content: string;
  arcId: mongoose.Types.ObjectId;
  playthroughId: mongoose.Types.ObjectId;
  chapterIndex: number;
  choices: Array<{ text: string; type: 'continue' | 'new_arc' | 'custom' }>;
  newCharacters: Array<{ name: string; description: string; role: string }>;
  newItems: Array<{ name: string; description: string; ownerId?: mongoose.Types.ObjectId }>;
  metadata: {
    tokensUsed?: number;
    model?: string;
    generatedAt: Date;
  };
  createdAt: Date;
}

const ChoiceSchema = new Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ['continue', 'new_arc', 'custom'], required: true },
  },
  { _id: false }
);

const NewCharacterSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    role: { type: String },
  },
  { _id: false }
);

const NewItemSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Character' },
  },
  { _id: false }
);

const MetadataSchema = new Schema(
  {
    tokensUsed: { type: Number },
    model: { type: String },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChapterSchema = new Schema<IChapterDocument>(
  {
    content: {
      type: String,
      required: true,
    },
    arcId: {
      type: Schema.Types.ObjectId,
      ref: 'Arc',
      required: true,
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    chapterIndex: {
      type: Number,
      required: true,
    },
    choices: {
      type: [ChoiceSchema],
      default: [],
    },
    newCharacters: {
      type: [NewCharacterSchema],
      default: [],
    },
    newItems: {
      type: [NewItemSchema],
      default: [],
    },
    metadata: {
      type: MetadataSchema,
      default: () => ({ generatedAt: new Date() }),
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes — chapters are SEPARATE documents, NOT embedded in Arc
ChapterSchema.index({ playthroughId: 1, arcId: 1, chapterIndex: 1 }, { unique: true });
ChapterSchema.index({ arcId: 1 });

export const Chapter = mongoose.model<IChapterDocument>('Chapter', ChapterSchema);
