export interface IEntityRef {
  name: string;
  rarity: string;
  status?: string;
  category?: string;
  owner?: string;
}

export interface IContextOutput {
  outline: string;
  filteredContext: string;
  activeCharacters: string[];
  existingItems: IEntityRef[];
  existingSpecialItems: IEntityRef[];
  specialItemTemplateCategories: Array<{ category: string; description: string; fields: Array<{ name: string; type: string; options?: string[]; required?: boolean }> }>;
  currentScene: string;
  relevantPlotPoints: string[];
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
