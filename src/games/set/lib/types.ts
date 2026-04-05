export type Lang = 'ko' | 'en' | 'zh';
export type Theme = 'standard' | 'genius';
export type GamePhase = 'lobby' | 'playing' | 'ended';
export type TurnType = 'set' | 'gyul';
export type ResultType = 'set_correct' | 'set_wrong' | 'set_timeout' | 'gyul_correct' | 'gyul_wrong';

export interface CurrentTurn {
  type: TurnType;
  playerName: string;
  startedAt: number;
}

export interface PlayerInfo {
  displayName: string;
  joinedAt: number;
  collectedCards: string; // JSON: number[]
  bonusPoints: number;
}

export interface LastResult {
  playerName: string;
  type: ResultType;
  timestamp: number;
}

export interface SetRoomState {
  phase: GamePhase;
  theme: Theme;
  lang: Lang;
  createdAt: number;
  tableCards: string;  // JSON: number[]
  deckCards: string;   // JSON: number[]
  currentTurn: CurrentTurn | null;
  players: Record<string, PlayerInfo>;
  lastResult: LastResult | null;
}
