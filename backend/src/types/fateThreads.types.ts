export interface ThreadNode {
  id: string;
  chapterId: string;
  chapterIndex: number;
  arcId: string;
  arcIndex: number;
  title: string;
  summary: string;
  imageUrl?: string;
  isCurrentPath: boolean;
  depth: number;
  isCompleted: boolean;
}

export interface ThreadEdge {
  from: string;
  to: string;
  choiceText: string;
  choiceType: string;
  isChosen: boolean;
  arcIndex: number;
}

export interface FateThreadsGraph {
  nodes: ThreadNode[];
  edges: ThreadEdge[];
  metadata: {
    playthroughId: string;
    totalChapters: number;
    totalArcs: number;
    currentChapterId: string;
    totalGhostBranches: number;
    totalPeekedGhosts: number;
  };
}

export interface PeekRequest {
  playthroughId: string;
  currentChapterId: string;
  choiceIndex: number;
  language: 'en' | 'vi';
}

export interface PeekResponse {
  alternateDescription: string;
  choiceText: string;
  newDepth: number;
}

export interface UserPeekHistory {
  playthroughId: string;
  chapterId: string;
  choiceIndex: number;
  peekedAt: Date;
}
