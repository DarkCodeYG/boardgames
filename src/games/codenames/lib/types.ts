export type Team = 'red' | 'blue';
export type CardType = 'red' | 'blue' | 'neutral' | 'assassin';
export type GamePhase = 'setup' | 'playing' | 'finished';

export interface Card {
  id: number;
  word: string;
  type: CardType;
  revealed: boolean;
}

export interface GameState {
  board: Card[];
  currentTeam: Team;
  phase: GamePhase;
  startingTeam: Team;
  score: Record<Team, number>;
  target: Record<Team, number>;
  winner: Team | null;
  winReason: 'all_found' | 'assassin' | null;
  seed: string;
}
