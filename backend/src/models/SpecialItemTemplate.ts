import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialItemFieldDefinitionDoc {
  name: string;
  type: 'text' | 'number' | 'enum';
  options?: string[];
  required?: boolean;
}

export interface ISpecialItemTemplateDocument extends Document {
  worldId: mongoose.Types.ObjectId;
  category: string;
  description: string;
  fields: ISpecialItemFieldDefinitionDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const SpecialItemFieldDefinitionSchema = new Schema<ISpecialItemFieldDefinitionDoc>(
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
    worldId: {
      type: Schema.Types.ObjectId,
      ref: 'World',
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    fields: {
      type: [SpecialItemFieldDefinitionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes
SpecialItemTemplateSchema.index({ worldId: 1 });
SpecialItemTemplateSchema.index({ worldId: 1, category: 1 }, { unique: true });

export const SpecialItemTemplate = mongoose.model<ISpecialItemTemplateDocument>(
  'SpecialItemTemplate',
  SpecialItemTemplateSchema
);
