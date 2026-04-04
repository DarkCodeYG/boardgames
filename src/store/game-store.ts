import { create } from 'zustand';
import type { GameState } from '../lib/types';
import {
  createGame,
  startGame,
  giveClue,
  revealCard,
  endTurnEarly,
} from '../lib/game-engine';

interface GameStore {
  game: GameState | null;
  showSpymasterView: boolean;

  // 액션
  newGame: (seed?: string) => void;
  start: () => void;
  submitClue: (word: string, count: number) => void;
  selectCard: (cardId: number) => void;
  passTurn: () => void;
  toggleSpymasterView: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  showSpymasterView: false,

  newGame: (seed?: string) => {
    set({ game: createGame(seed), showSpymasterView: false });
  },

  start: () => {
    set((s) => (s.game ? { game: startGame(s.game) } : s));
  },

  submitClue: (word: string, count: number) => {
    set((s) => (s.game ? { game: giveClue(s.game, word, count) } : s));
  },

  selectCard: (cardId: number) => {
    set((s) => (s.game ? { game: revealCard(s.game, cardId) } : s));
  },

  passTurn: () => {
    set((s) => (s.game ? { game: endTurnEarly(s.game) } : s));
  },

  toggleSpymasterView: () => {
    set((s) => ({ showSpymasterView: !s.showSpymasterView }));
  },

  reset: () => {
    set({ game: null, showSpymasterView: false });
  },
}));
