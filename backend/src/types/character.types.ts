export type CharacterStatus = 'active' | 'dead' | 'injured' | 'missing';

export interface IDynamicStat {
  k: string;   // key — matches world resourceTemplate.key
  v: string | number | boolean; // value
  t: string;   // type — matches resourceTemplate.type
}

export interface ICharacterBase {
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  status: CharacterStatus;
}

export interface ICharacter extends ICharacterBase {
  _id: string;
  playthroughId: string;
  worldId: string;
  userId: string;
  dynamicStats: IDynamicStat[];
  createdAt: Date;
  updatedAt: Date;
}
