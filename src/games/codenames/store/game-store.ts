import { create } from 'zustand';
import type { GameState } from '../lib/types';
import type { Lang } from '../lib/i18n';
import type { WordPack } from '../lib/words';
import { createGame, startGame, revealCard, endTurnEarly } from '../lib/game-engine';

interface GameStore {
  game: GameState | null;
  lang: Lang;
  pack: WordPack;

  setLang: (lang: Lang) => void;
  setPack: (pack: WordPack) => void;
  newGame: (seed?: string) => void;
  start: () => void;
  selectCard: (cardId: number) => void;
  passTurn: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  lang: 'ko',
  pack: 'standard',

  setLang: (lang: Lang) => {
    set({ lang });
  },

  setPack: (pack: WordPack) => {
    set({ pack });
  },

  newGame: (seed?: string) => {
    const { lang, pack } = get();
    set({ game: createGame(seed, lang, pack) });
  },

  start: () => {
    set((s) => (s.game ? { game: startGame(s.game) } : s));
  },

  selectCard: (cardId: number) => {
    set((s) => (s.game ? { game: revealCard(s.game, cardId) } : s));
  },

  passTurn: () => {
    set((s) => (s.game ? { game: endTurnEarly(s.game) } : s));
  },

  reset: () => {
    set({ game: null });
  },
}));
