import { create } from 'zustand';
import type { GameState } from '../lib/types';
import type { Lang } from '../lib/i18n';
import type { WordPack } from '../lib/words';
import { createGame, startGame, revealCard, endTurnEarly } from '../lib/game-engine';
import { sfxCardFlip, sfxCorrect, sfxWrong, sfxAssassin, sfxVictory, sfxDefeat, sfxTurnEnd, sfxGameStart } from '../../../lib/sound';

interface GameStore {
  game: GameState | null;
  lang: Lang;
  pack: WordPack;
  hiddenMode: boolean;

  setLang: (lang: Lang) => void;
  setPack: (pack: WordPack) => void;
  setHiddenMode: (v: boolean) => void;
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
  hiddenMode: false,

  setLang: (lang: Lang) => {
    set({ lang });
  },

  setPack: (pack: WordPack) => {
    set({ pack });
  },

  setHiddenMode: (v: boolean) => {
    set({ hiddenMode: v });
  },

  newGame: (seed?: string) => {
    const { lang, pack } = get();
    set({ game: createGame(seed, lang, pack) });
  },

  start: () => {
    sfxGameStart();
    set((s) => (s.game ? { game: startGame(s.game) } : s));
  },

  selectCard: (cardId: number) => {
    const { game } = get();
    if (!game || game.phase !== 'playing') return;
    const card = game.board[cardId];
    if (!card || card.revealed) return;

    sfxCardFlip();
    const next = revealCard(game, cardId);
    set({ game: next });

    // 결과에 따른 효과음 (카드 뒤집기 후 딜레이)
    setTimeout(() => {
      if (next.phase === 'finished') {
        if (card.type === 'assassin') {
          sfxAssassin();
          setTimeout(sfxDefeat, 600);
        } else {
          sfxVictory();
        }
      } else if (card.type === game.currentTeam) {
        sfxCorrect();
      } else {
        sfxWrong();
      }
    }, 200);
  },

  passTurn: () => {
    sfxTurnEnd();
    set((s) => (s.game ? { game: endTurnEarly(s.game) } : s));
  },

  reset: () => {
    set({ game: null });
  },
}));
