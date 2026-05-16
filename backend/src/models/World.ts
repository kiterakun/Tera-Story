import mongoose, { Schema, Document } from 'mongoose';

export interface IResourceTemplateDocument {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum' | 'pool' | 'object';
  min?: number;
  max?: number;
  defaultValue?: string | number;
  displayFormat?: string;
  options?: string[];
  children?: IResourceTemplateDocument[];
}

export interface IOrganizationTemplateDocument {
  type: string;
  description: string;
  defaultStats: IResourceTemplateDocument[];
}

export interface IWorldDocument extends Document {
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  userId: mongoose.Types.ObjectId;
  imageUrl?: string;
  resourceTemplates: IResourceTemplateDocument[];
  locationResourceTemplates: IResourceTemplateDocument[];
  organizationTemplates: IOrganizationTemplateDocument[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const ResourceTemplateSchema = new Schema<IResourceTemplateDocument>(
  {
    key: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['number', 'text', 'progress', 'enum', 'pool', 'object'],
    },
    min: { type: Number },
    max: { type: Number },
    defaultValue: { type: Schema.Types.Mixed },
    displayFormat: { type: String },
    options: [{ type: String }],
    children: { type: [Schema.Types.Mixed], default: undefined }, // recursive for 'object' type
  },
  { _id: false }
);

const OrganizationTemplateSchema = new Schema<IOrganizationTemplateDocument>(
  {
    type: { type: String, required: true },
    description: { type: String, default: '' },
    defaultStats: { type: [ResourceTemplateSchema], default: [] },
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
    deletedAt: { type: Date, default: null },
    resourceTemplates: {
      type: [ResourceTemplateSchema],
      default: [],
    },
    locationResourceTemplates: {
      type: [ResourceTemplateSchema],
      default: [],
    },
    organizationTemplates: {
      type: [OrganizationTemplateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

WorldSchema.index({ userId: 1, createdAt: -1 });

// Soft delete: auto-filter non-deleted documents
WorldSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const World = mongoose.model<IWorldDocument>('World', WorldSchema);
