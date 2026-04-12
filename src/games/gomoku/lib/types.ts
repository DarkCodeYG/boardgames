export type Player = 'black' | 'white';
export type Cell = Player | null;
export type Board = Cell[][];
export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GomokuState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  winLine: [number, number][] | null;
  moveCount: number;
}
