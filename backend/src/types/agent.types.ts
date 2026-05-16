import type { IResourceTemplate } from './world.types';

export interface IEntityRef {
  name: string;
  rarity: string;
  status?: string;
  category?: string;
  owner?: string;
}

export interface ICharacterRef {
  name: string;
  role: 'protagonist' | 'npc';
  status: string;
  description: string;
  dynamicStats: Record<string, string | number | boolean>;
}

export interface IRelationshipRef {
  characterA: string;
  characterB: string;
  type: string;
  intensity: number;
}

export interface IConsequenceSeedRef {
  description: string;
  impact: string;
  tags: string[];
  triggerChapterIndex: number;
}

export interface ICombatRef {
  combatId: string;
  context: string;
  status: string;
  combatants: Array<{ name: string; side: string; currentHp: number; maxHp: number; defeated: boolean }>;
  availableActions: string[];
  roundCount: number;
}

export interface IContextOutput {
  outline: string;
  filteredContext: string;
  activeCharacters: ICharacterRef[];
  existingItems: IEntityRef[];
  existingSpecialItems: IEntityRef[];
  specialItemTemplateCategories: Array<{ category: string; description: string; fields: Array<{ name: string; type: string; options?: string[]; required?: boolean }> }>;
  currentScene: string;
  relevantPlotPoints: string[];
  resourceTemplates?: IResourceTemplate[];
  relationships: IRelationshipRef[];
  matureConsequences: IConsequenceSeedRef[];
  activeCombat: ICombatRef | null;
  geography?: {
    currentContinent?: { name: string; description: string; terrainType: string };
    currentRegion?: { name: string; description: string; terrainType: string; dangerLevel: number } | null;
    currentLocation?: { name: string; type: string; description: string; status: string } | null;
    nearbyLocations?: Array<{ name: string; type: string; description: string; status: string }>;
  };
  currentRegionId?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface IWriterOutput {
  content: string;
  choices: import('./story.types').IChoice[];
  newCharacters: Array<{ name: string; description: string; stats?: Record<string, string | number> }>;
  newItems: Array<{ name: string; description: string; rarity?: string; ownerName?: string }>;
  newSpecialItems: Array<{ name: string; description: string; category: string; rarity?: string; ownerName?: string }>;
  statUpdates: Array<{ characterName: string; statKey: string; value: string | number }>;
}

export interface ISupportOutput {
  // For world enrichment
  name?: string;
  description?: string;
  genre?: string;
  resourceTemplates?: import('./world.types').IResourceTemplate[];
  // For character enrichment
  characterName?: string;
  characterDescription?: string;
  suggestedStats?: import('./character.types').IDynamicStat[];
  // For choice enrichment
  enrichedChoices?: import('./story.types').IChoice[];
}
