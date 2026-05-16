import mongoose, { Document } from 'mongoose';
import { IDynamicStat } from './character.types';
import { IResourceTemplate } from './world.types';

export interface IOrganizationTemplate {
  type: string; // e.g. 'guild', 'kingdom', 'cult', 'faction', 'corporation'
  description: string;
  defaultStats: IResourceTemplate[];
}

export interface IOrganizationDocument extends Document {
  name: string;
  description: string;
  type: string; // matches organizationTemplate.type
  worldId: mongoose.Types.ObjectId;
  playthroughId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'disbanded' | 'hidden';
  goals: string;
  structure: string; // organizational structure description
  dynamicStats: IDynamicStat[];
  memberIds: mongoose.Types.ObjectId[]; // character references
  createdInChapterId?: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
