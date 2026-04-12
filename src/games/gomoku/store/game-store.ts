import { create } from 'zustand';
import { createGame, placeStone as enginePlaceStone } from '../lib/game-engine';
import type { Difficulty, GameMode, GomokuState } from '../lib/types';

interface GomokuStore extends GomokuState {
  placeStone: (row: number, col: number) => void;
  resetGame: () => void;
  forfeit: () => void;
  mode: GameMode;
  difficulty: Difficulty;
  setMode: (mode: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
}

export const useGomokuStore = create<GomokuStore>((set) => ({
  ...createGame(),
  mode: 'pvp',
  difficulty: 'medium',
  placeStone: (row, col) => set((state) => enginePlaceStone(state, row, col)),
  resetGame: () => set((state) => ({ ...createGame(), mode: state.mode, difficulty: state.difficulty })),
  forfeit: () => set((state) => ({
    winner: state.currentPlayer === 'black' ? 'white' : 'black',
    winLine: null,
  })),
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
}));
