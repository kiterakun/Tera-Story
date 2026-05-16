export type CharacterStatus = 'active' | 'dead' | 'injured' | 'missing';

export interface IDynamicStat {
  k: string;   // key — matches world resourceTemplate.key
  v: string | number | boolean; // value
  t: string;   // type — matches resourceTemplate.type
  maxV?: number; // only for 'pool' type — current maximum (e.g. max HP after buffs/debuffs)
  children?: IDynamicStat[]; // only for 'object' type — nested sub-properties
}

export interface ICharacterBase {
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  status: CharacterStatus;
  background: string;    // backstory, origin
  personality: string;   // personality traits
  goals: string;         // motivations, objectives
  appearance: string;    // physical description
}

export interface ICharacter extends ICharacterBase {
  _id: string;
  playthroughId: string;
  worldId: string;
  userId: string;
  createdInChapterId?: string;
  dynamicStats: IDynamicStat[];
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
