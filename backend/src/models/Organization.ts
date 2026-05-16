import mongoose, { Schema, Document } from 'mongoose';
import { IDynamicStat } from '../types/character.types';
import { IOrganizationDocument } from '../types/organization.types';

const DynamicStatSchema = new Schema(
  {
    k: { type: String, required: true },
    v: { type: Schema.Types.Mixed },
    t: { type: String, required: true },
    maxV: { type: Number },
    children: { type: [Schema.Types.Mixed], default: undefined },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganizationDocument>(
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
    type: {
      type: String,
      required: true,
      trim: true,
    },
    worldId: {
      type: Schema.Types.ObjectId,
      ref: 'World',
      required: true,
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'disbanded', 'hidden'],
      default: 'active',
    },
    goals: {
      type: String,
      default: '',
    },
    structure: {
      type: String,
      default: '',
    },
    dynamicStats: {
      type: [DynamicStatSchema],
      default: [],
    },
    memberIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Character',
    }],
    createdInChapterId: {
      type: String,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-query hooks: exclude archived and deleted organizations
OrganizationSchema.pre('find', function () {
  this.where({ archivedAt: null });
});

OrganizationSchema.pre('findOne', function () {
  this.where({ archivedAt: null });
});

OrganizationSchema.pre('findOneAndUpdate', function () {
  this.where({ archivedAt: null });
});

// Index for fast lookups
OrganizationSchema.index({ playthroughId: 1, archivedAt: 1 });
OrganizationSchema.index({ worldId: 1 });
OrganizationSchema.index({ name: 1, playthroughId: 1 });

export const Organization = mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);
