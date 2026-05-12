export type RelationType = 'ally' | 'enemy' | 'romantic' | 'mentor' | 'rival' | 'neutral' | 'family';

export interface Relationship {
  _id: string;
  characterA: { _id: string; name: string };
  characterB: { _id: string; name: string };
  type: RelationType;
  intensity: number;
}
