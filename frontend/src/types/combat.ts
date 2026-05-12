export interface CombatCombatant {
  characterId: string;
  name: string;
  side: 'player' | 'enemy';
  currentHp: number;
  maxHp: number;
  defeated: boolean;
}

export interface CombatRound {
  roundIndex: number;
  playerAction: string;
  narrative: string;
  stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }>;
}

export interface CombatEncounter {
  _id: string;
  playthroughId: string;
  chapterId: string;
  combatants: CombatCombatant[];
  rounds: CombatRound[];
  status: 'active' | 'victory' | 'defeat' | 'fled' | 'resolved';
  context: string;
  availableActions: string[];
}

export interface CombatActionResponse {
  success: boolean;
  narrative: string;
  combat: CombatEncounter;
  stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }>;
}
