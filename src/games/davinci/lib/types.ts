export type Lang = 'ko' | 'en' | 'zh';
export type TileColor = 'black' | 'white';
export type GamePhase = 'lobby' | 'playing' | 'gameover';
export type TurnState = 'draw' | 'guess' | 'result';

export interface Tile {
  number: number;   // 0-11 = normal, 12 = joker
  color: TileColor;
  revealed: boolean;
}

export interface PlayerState {
  joinedAt: number;
  eliminated: boolean;
  tiles: Tile[];
}

export interface LastResult {
  correct: boolean;
  targetId: string;
  tileIndex: number;
  guessedNumber: number;
  actualNumber: number;
}

export interface RoomState {
  phase: GamePhase;
  lang: Lang;
  players: Record<string, PlayerState>;
  playerOrder: string[];
  deck: Tile[];
  currentTurnIndex: number;
  turnState: TurnState;
  drawnTileIndex: number | null;
  guessStartedAt: number | null;   // timestamp when 'guess' phase began (for countdown sync)
  pendingGuess: { targetId: string; tileIndex: number } | null;
  lastResult: LastResult | null;
  winner: string | null;
}
