import mongoose, { Schema, Document } from 'mongoose';

const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

export interface ILocationDocument extends Document {
  regionId: mongoose.Types.ObjectId;
  playthroughId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: 'town' | 'dungeon' | 'wilderness' | 'ruin' | 'sanctuary' | 'crossroad';
  position: { x: number; y: number };
  discoveredAt: number;
  status: 'undiscovered' | 'known' | 'visited' | 'cleared';
  connectedLocations: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const LocationSchema = new Schema<ILocationDocument>(
  {
    regionId: {
      type: Schema.Types.ObjectId,
      ref: 'Region',
      required: true,
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
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
    type: {
      type: String,
      enum: ['town', 'dungeon', 'wilderness', 'ruin', 'sanctuary', 'crossroad'],
    },
    position: {
      type: PositionSchema,
      required: true,
    },
    discoveredAt: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['undiscovered', 'known', 'visited', 'cleared'],
      default: 'undiscovered',
    },
    connectedLocations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Location',
      },
    ],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

LocationSchema.index({ regionId: 1, playthroughId: 1 });

// Soft delete: auto-filter non-deleted documents
LocationSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const Location = mongoose.model<ILocationDocument>('Location', LocationSchema);
