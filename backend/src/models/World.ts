import mongoose, { Schema, Document } from 'mongoose';

export interface IResourceTemplateDocument {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum';
  min?: number;
  max?: number;
  defaultValue?: string | number;
  displayFormat?: string;
  options?: string[];
}

export interface IWorldDocument extends Document {
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  userId: mongoose.Types.ObjectId;
  imageUrl?: string;
  resourceTemplates: IResourceTemplateDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceTemplateSchema = new Schema<IResourceTemplateDocument>(
  {
    key: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['number', 'text', 'progress', 'enum'],
    },
    min: { type: Number },
    max: { type: Number },
    defaultValue: { type: Schema.Types.Mixed },
    displayFormat: { type: String },
    options: [{ type: String }],
  },
  { _id: false }
);

const WorldSchema = new Schema<IWorldDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    genre: {
      type: String,
      required: true,
      enum: ['fantasy', 'sci-fi', 'wuxia', 'modern', 'custom'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
    },
    resourceTemplates: {
      type: [ResourceTemplateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

WorldSchema.index({ userId: 1, createdAt: -1 });

export const World = mongoose.model<IWorldDocument>('World', WorldSchema);
