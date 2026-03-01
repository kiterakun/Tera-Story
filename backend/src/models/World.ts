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

export interface ISpecialItemFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'enum';
  options?: string[];  // for 'enum' type
  required?: boolean;
}

export interface ISpecialItemTemplateDocument {
  category: string;           // e.g. 'skill', 'technique', 'spiritual_root'
  description: string;        // describes what this category represents
  fields: ISpecialItemFieldDefinition[];  // custom fields beyond name/description/rarity
}

export interface IWorldDocument extends Document {
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  userId: mongoose.Types.ObjectId;
  imageUrl?: string;
  resourceTemplates: IResourceTemplateDocument[];
  specialItemTemplates: ISpecialItemTemplateDocument[];
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

const SpecialItemFieldDefinitionSchema = new Schema<ISpecialItemFieldDefinition>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'number', 'enum'] },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const SpecialItemTemplateSchema = new Schema<ISpecialItemTemplateDocument>(
  {
    category: { type: String, required: true },
    description: { type: String, default: '' },
    fields: { type: [SpecialItemFieldDefinitionSchema], default: [] },
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
    specialItemTemplates: {
      type: [SpecialItemTemplateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

WorldSchema.index({ userId: 1 });

export const World = mongoose.model<IWorldDocument>('World', WorldSchema);
