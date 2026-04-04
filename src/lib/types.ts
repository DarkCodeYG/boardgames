export type Team = 'red' | 'blue';
export type CardType = 'red' | 'blue' | 'neutral' | 'assassin';
export type PlayerRole = 'spymaster' | 'operative';
export type GamePhase = 'setup' | 'playing' | 'finished';
export type TurnPhase = 'giving_clue' | 'guessing';

export interface Card {
  id: number;
  word: string;
  type: CardType;
  revealed: boolean;
}

export interface Clue {
  word: string;
  count: number;
  team: Team;
}

export interface Turn {
  team: Team;
  phase: TurnPhase;
  clue: Clue | null;
  guessesRemaining: number;
  guessesMade: number;
}

export interface GameState {
  board: Card[];
  turn: Turn;
  phase: GamePhase;
  startingTeam: Team;
  score: Record<Team, number>;
  target: Record<Team, number>;
  winner: Team | null;
  winReason: 'all_found' | 'assassin' | null;
  clueHistory: Clue[];
  seed: string;
}
