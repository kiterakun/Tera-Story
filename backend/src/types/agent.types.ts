export interface IContextOutput {
  outline: string;
  filteredContext: string;
  activeCharacters: string[];
  currentScene: string;
  relevantPlotPoints: string[];
}

export interface IWriterOutput {
  content: string;
  choices: import('./story.types').IChoice[];
  newCharacters: Array<{ name: string; description: string; stats?: Record<string, string | number> }>;
  newItems: Array<{ name: string; description: string; ownerName?: string }>;
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
