export type GamePhase = 'setup' | 'playing';

export interface PlayerRole {
  isSpy: boolean;
  location: string | null;
  role: string | null;
}

export interface GameState {
  phase: GamePhase;
  playerCount: number;
  spyIndex: number;
  seed: string;
  roundMinutes: number;
  startedAt: number | null;
}
