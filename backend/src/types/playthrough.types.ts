export interface IPlaythrough {
  _id: string;
  name: string;
  worldId: string;
  userId: string;
  status: 'active' | 'paused' | 'completed';
  currentArcIndex: number;
  createdAt: Date;
  updatedAt: Date;
}
