export interface IChoice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
}

export interface IChapter {
  _id: string;
  content: string;
  arcId: string;
  playthroughId: string;
  chapterIndex: number;
  choices: IChoice[];
  newCharacters: Array<{ name: string; description: string; role: 'npc' }>;
  newItems: Array<{ name: string; description: string; rarity?: string; ownerId?: string }>;
  newSpecialItems: Array<{ name: string; description: string; category: string; rarity?: string }>;
  metadata: {
    tokensUsed?: number;
    model?: string;
    generatedAt: Date;
  };
  createdAt: Date;
}

export interface IArc {
  _id: string;
  title: string;
  summary?: string;
  playthroughId: string;
  arcIndex: number;
  status: 'active' | 'completed';
  createdAt: Date;
}

export interface IStoryState {
  playthrough: import('./playthrough.types').IPlaythrough;
  currentArc: IArc | null;
  recentChapters: IChapter[];
  choices: IChoice[];
  protagonist: import('./character.types').ICharacter | null;
}

export interface ISpecialItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  status: 'active' | 'sealed' | 'lost' | 'consumed';
  imageUrl?: string;
  ownerId?: string;
  playthroughId: string;
  createdInChapterId?: string;
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItem {
  _id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  status: 'active' | 'destroyed' | 'lost' | 'consumed';
  imageUrl?: string;
  ownerId?: string;
  playthroughId: string;
  createdInChapterId?: string;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
