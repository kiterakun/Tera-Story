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

export interface IDirectorSettings {
  tone: 'serious' | 'balanced' | 'whimsical';
  danger: number; // 0-100
  romance: number; // 0-100
  comedy: number; // 0-100
  pacing: 'slow' | 'normal' | 'fast';
}

export const DEFAULT_DIRECTOR_SETTINGS: IDirectorSettings = {
  tone: 'balanced',
  danger: 50,
  romance: 30,
  comedy: 40,
  pacing: 'normal',
};

export interface IPlaythroughDocument extends Document {
  name: string;
  worldId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'completed';
  premise: string; // optional story premise/description for better generation
  currentArcIndex: number;
  // Director mode settings (tune AI narrative style)
  directorSettings: IDirectorSettings;
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
    directorSettings: {
      tone: { type: String, enum: ['serious', 'balanced', 'whimsical'], default: DEFAULT_DIRECTOR_SETTINGS.tone },
      danger: { type: Number, default: DEFAULT_DIRECTOR_SETTINGS.danger, min: 0, max: 100 },
      romance: { type: Number, default: DEFAULT_DIRECTOR_SETTINGS.romance, min: 0, max: 100 },
      comedy: { type: Number, default: DEFAULT_DIRECTOR_SETTINGS.comedy, min: 0, max: 100 },
      pacing: { type: String, enum: ['slow', 'normal', 'fast'], default: DEFAULT_DIRECTOR_SETTINGS.pacing },
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
