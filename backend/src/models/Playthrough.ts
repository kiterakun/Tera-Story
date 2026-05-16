import mongoose, { Schema, Document } from 'mongoose';

interface IArcSummary {
  arcId: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  sceneCount: number;
  keyScenes: IKeyScene[];
}

interface IKeyScene {
  sceneId: mongoose.Types.ObjectId;
  title: string;
  thumbnailUrl?: string;
}

interface IChronicleStats {
  totalScenes: number;
  totalChoices: number;
  totalCombats: number;
  totalPlayTimeMinutes: number;
}

interface IChronicleCache {
  generatedAt: Date;
  arcSummaries: IArcSummary[];
  stats: IChronicleStats;
}

export interface IPlaythroughDocument extends Document {
  name: string;
  worldId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'completed';
  premise: string; // optional story premise/description for better generation
  currentArcIndex: number;
  // Echoes
  echoesCount: number;
  echoesResolvedCount: number;
  // Location tracking
  currentLocationId: mongoose.Types.ObjectId | null;
  // Whispers
  lastActiveAt: Date;
  lastWhispersViewedAt: Date | null;
  // Chronicle
  chronicleCache?: IChronicleCache;
  completedAt?: Date;
  shareId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const PlaythroughSchema = new Schema<IPlaythroughDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    worldId: {
      type: Schema.Types.ObjectId,
      ref: 'World',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    premise: {
      type: String,
      default: '',
    },
    currentArcIndex: {
      type: Number,
      default: 0,
    },
    // Echoes
    echoesCount: { type: Number, default: 0, min: 0 },
    echoesResolvedCount: { type: Number, default: 0, min: 0 },
    // Location tracking
    currentLocationId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
    // Whispers
    lastActiveAt: { type: Date, default: Date.now },
    lastWhispersViewedAt: { type: Date, default: null },
    // Chronicle
    chronicleCache: { type: Schema.Types.Mixed, default: null },
    completedAt: { type: Date, default: null },
    shareId: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PlaythroughSchema.index({ userId: 1, worldId: 1 });
PlaythroughSchema.index({ userId: 1, lastActiveAt: -1 });

// Soft delete: auto-filter non-deleted documents
PlaythroughSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const Playthrough = mongoose.model<IPlaythroughDocument>('Playthrough', PlaythroughSchema);
