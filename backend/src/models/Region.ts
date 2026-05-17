import mongoose, { Schema, Document } from 'mongoose';

export interface IRegionDocument extends Document {
  continentId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  terrainType: string;
  neighborRegions: mongoose.Types.ObjectId[];
  locations: mongoose.Types.ObjectId[];
  dangerLevel: number;
  resources: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const RegionSchema = new Schema<IRegionDocument>(
  {
    continentId: {
      type: Schema.Types.ObjectId,
      ref: 'Continent',
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
    neighborRegions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Region',
      },
    ],
    locations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Location',
      },
    ],
    dangerLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    resources: [{ type: String }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RegionSchema.index({ continentId: 1 });

// Soft delete: auto-filter non-deleted documents
RegionSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const Region = mongoose.model<IRegionDocument>('Region', RegionSchema);
