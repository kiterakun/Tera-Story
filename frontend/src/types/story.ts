export interface Choice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
}

export interface Chapter {
  _id: string;
  content: string;
  chapterIndex: number;
  choices: Choice[];
  status?: 'generating' | 'completed' | 'failed';
  toolsStatus?: 'pending' | 'running' | 'completed' | 'failed';
  playerChoice?: string;
  metadata?: {
    contextTokens?: number;
    tokensUsed?: number;
  };
}
