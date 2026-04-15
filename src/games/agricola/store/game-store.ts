/**
 * Agricola Zustand 스토어
 * Phase 1 구현 대상.
 */

import { create } from 'zustand';
import type { AgricolaStoreState, GameState, Lang } from '../lib/types.js';

export const useAgricolaStore = create<AgricolaStoreState>((set) => ({
  lang: 'ko',
  mode: 'local',
  playerCount: 2,
  deck: 'AB',
  gameState: null,
  setLang: (lang: Lang) => set({ lang }),
  setMode: (mode: 'local' | 'online') => set({ mode }),
  setPlayerCount: (count: 2 | 3 | 4) => set({ playerCount: count }),
  setGameState: (state: GameState | null) => set({ gameState: state }),
}));
