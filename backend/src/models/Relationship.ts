import mongoose, { Schema, Document } from 'mongoose';

export type RelationType = 'ally' | 'enemy' | 'romantic' | 'mentor' | 'rival' | 'neutral' | 'family';

export interface IRelationshipDocument extends Document {
  characterA: mongoose.Types.ObjectId;
  characterB: mongoose.Types.ObjectId;
  type: RelationType;
  intensity: number; // -100 (hostile) to +100 (devoted)
  playthroughId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RelationshipSchema = new Schema<IRelationshipDocument>(
  {
    characterA: {
      type: Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
    },
    characterB: {
      type: Schema.Types.ObjectId,
      ref: 'Character',
      required: true,
    },
    type: {
      type: String,
      enum: ['ally', 'enemy', 'romantic', 'mentor', 'rival', 'neutral', 'family'],
      default: 'neutral',
    },
    intensity: {
      type: Number,
      default: 0,
      min: -100,
      max: 100,
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
  },
  { timestamps: true }
);

// Unique pair per playthrough (A-B, not B-A duplicates)
RelationshipSchema.index({ playthroughId: 1, characterA: 1, characterB: 1 }, { unique: true });
RelationshipSchema.index({ playthroughId: 1 });

export const Relationship = mongoose.model<IRelationshipDocument>('Relationship', RelationshipSchema);
