import mongoose, { Schema, Document } from 'mongoose';

export type EventLogSeverity = 'info' | 'success' | 'warning' | 'error';

export type EventLogType =
  | 'chapter_generation_started'
  | 'chapter_generation_completed'
  | 'chapter_generation_failed'
  | 'chapter_retried'
  | 'tools_retried'
  | 'phase_started'
  | 'phase_completed'
  | 'phase_failed'
  | 'context_agent_completed'
  | 'writer_pass1_completed'
  | 'writer_pass2_completed'
  | 'character_created'
  | 'item_created'
  | 'special_item_created'
  | 'organization_created'
  | 'stat_updated'
  | 'entity_status_updated'
  | 'relationship_updated'
  | 'consequence_planted'
  | 'consequence_activated'
  | 'combat_initiated'
  | 'combat_resolved'
  | 'location_discovered'
  | 'location_traveled'
  | 'location_stats_updated'
  | 'organization_updated'
  | 'entity_archived'
  | 'xp_awarded'
  | 'quest_progress_updated'
  | 'echo_planted'
  | 'achievement_unlocked'
  | 'achievement_checked'
  | 'story_card_created'
  | 'level_up'
  | 'error'
  | 'retry';

export interface IEventLogDocument extends Document {
  playthroughId: mongoose.Types.ObjectId;
  chapterId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: EventLogType;
  severity: EventLogSeverity;
  source: string;
  title: string;
  description: string;
  details?: Record<string, unknown>;
  language: string;
  seen: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EventLogSchema = new Schema<IEventLogDocument>(
  {
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'chapter_generation_started',
        'chapter_generation_completed',
        'chapter_generation_failed',
        'chapter_retried',
        'tools_retried',
        'phase_started',
        'phase_completed',
        'phase_failed',
        'context_agent_completed',
        'writer_pass1_completed',
        'writer_pass2_completed',
        'character_created',
        'item_created',
        'special_item_created',
        'organization_created',
        'stat_updated',
        'entity_status_updated',
        'relationship_updated',
        'consequence_planted',
        'consequence_activated',
        'combat_initiated',
        'combat_resolved',
        'location_discovered',
        'location_traveled',
        'location_stats_updated',
        'organization_updated',
        'entity_archived',
        'xp_awarded',
        'quest_progress_updated',
        'echo_planted',
        'achievement_unlocked',
        'achievement_checked',
        'story_card_created',
        'level_up',
        'error',
        'retry',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    source: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    details: { type: Schema.Types.Mixed },
    language: { type: String, default: 'en' },
    seen: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

EventLogSchema.index({ playthroughId: 1, deletedAt: 1, createdAt: -1 });
EventLogSchema.index({ playthroughId: 1, type: 1 });
EventLogSchema.index({ playthroughId: 1, severity: 1 });
EventLogSchema.index({ userId: 1, createdAt: -1 });

// Soft delete: auto-filter non-deleted documents
EventLogSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

export const EventLog = mongoose.model<IEventLogDocument>('EventLog', EventLogSchema);
