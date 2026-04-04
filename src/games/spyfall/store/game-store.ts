import { create } from 'zustand';
import type { GameState } from '../lib/types';
import { createGame, startGame } from '../lib/game-engine';
import type { WordPack } from '../../codenames/lib/words';

interface SpyfallStore {
  game: GameState | null;
  pack: WordPack;

  setPack: (pack: WordPack) => void;
  newGame: (playerCount: number, roundMinutes?: number) => void;
  start: () => void;
  reset: () => void;
}

export const useSpyfallStore = create<SpyfallStore>((set, get) => ({
  game: null,
  pack: 'standard',

  setPack: (pack: WordPack) => set({ pack }),

  newGame: (playerCount: number, roundMinutes: number = 8) => {
    set({ game: createGame(playerCount, get().pack, roundMinutes) });
  },

  start: () => {
    set((s) => (s.game ? { game: startGame(s.game) } : s));
  },

  reset: () => set({ game: null }),
}));
