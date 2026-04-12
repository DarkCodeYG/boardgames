import { create } from 'zustand';
import { createGame, placeStone as enginePlaceStone } from '../lib/game-engine';
import type { GomokuState } from '../lib/types';

interface GomokuStore extends GomokuState {
  placeStone: (row: number, col: number) => void;
  resetGame: () => void;
  forfeit: () => void;
}

export const useGomokuStore = create<GomokuStore>((set) => ({
  ...createGame(),
  placeStone: (row, col) => set((state) => enginePlaceStone(state, row, col)),
  resetGame: () => set(createGame()),
  forfeit: () => set((state) => ({
    winner: state.currentPlayer === 'black' ? 'white' : 'black',
    winLine: null,
  })),
}));
