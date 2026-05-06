import mongoose, { Schema, Document } from 'mongoose';

export interface ICombatant {
  characterId: mongoose.Types.ObjectId;
  name: string;
  side: 'player' | 'enemy';
  currentHp: number;
  maxHp: number;
  defeated: boolean;
}

export interface ICombatRound {
  roundIndex: number;
  playerAction: string;
  narrative: string;
  stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }>;
}

export interface ICombatEncounterDocument extends Document {
  playthroughId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  combatants: ICombatant[];
  rounds: ICombatRound[];
  status: 'active' | 'victory' | 'defeat' | 'fled' | 'resolved';
  context: string; // scene description for combat
  availableActions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CombatantSchema = new Schema<ICombatant>(
  {
    characterId: { type: Schema.Types.ObjectId, ref: 'Character', required: true },
    name: { type: String, required: true },
    side: { type: String, enum: ['player', 'enemy'], required: true },
    currentHp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    defeated: { type: Boolean, default: false },
  },
  { _id: false }
);

const StateChangeSchema = new Schema(
  {
    characterName: { type: String, required: true },
    stat: { type: String, required: true },
    oldValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
  },
  { _id: false }
);

const CombatRoundSchema = new Schema<ICombatRound>(
  {
    roundIndex: { type: Number, required: true },
    playerAction: { type: String, required: true },
    narrative: { type: String, required: true },
    stateChanges: { type: [StateChangeSchema], default: [] },
  },
  { _id: false }
);

const CombatEncounterSchema = new Schema<ICombatEncounterDocument>(
  {
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    combatants: {
      type: [CombatantSchema],
      default: [],
    },
    rounds: {
      type: [CombatRoundSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'victory', 'defeat', 'fled', 'resolved'],
      default: 'active',
    },
    context: {
      type: String,
      default: '',
    },
    availableActions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

CombatEncounterSchema.index({ playthroughId: 1, status: 1 });
CombatEncounterSchema.index({ chapterId: 1 });

export const CombatEncounter = mongoose.model<ICombatEncounterDocument>('CombatEncounter', CombatEncounterSchema);
