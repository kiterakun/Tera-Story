import mongoose, { Schema, Document } from 'mongoose';

const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

export interface IContinentDocument extends Document {
  worldId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  terrainType: 'plains' | 'forest' | 'mountain' | 'desert' | 'coastal' | 'tundra' | 'volcanic';
  climate: string;
  dominantCulture: string;
  position: { x: number; y: number };
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
      enum: ['plains', 'forest', 'mountain', 'desert', 'coastal', 'tundra', 'volcanic'],
    },
    climate: {
      type: String,
    },
    dominantCulture: {
      type: String,
    },
    position: {
      type: PositionSchema,
      required: true,
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
