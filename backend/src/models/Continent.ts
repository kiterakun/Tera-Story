import mongoose, { Schema, Document } from 'mongoose';

export interface IContinentDocument extends Document {
  worldId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  terrainType: string;
  climate: string;
  dominantCulture: string;
  regions: mongoose.Types.ObjectId[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const ContinentSchema = new Schema<IContinentDocument>(
  {
    worldId: {
      type: Schema.Types.ObjectId,
      ref: 'World',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    terrainType: {
      type: String,
    },
    climate: {
      type: String,
    },
    dominantCulture: {
      type: String,
    },
    regions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Region',
      },
    ],
    imageUrl: {
      type: String,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ContinentSchema.index({ worldId: 1 });

// Soft delete: auto-filter non-deleted documents
ContinentSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const Continent = mongoose.model<IContinentDocument>('Continent', ContinentSchema);
