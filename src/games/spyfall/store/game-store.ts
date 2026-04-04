import { create } from 'zustand';
import type { WordPack } from '../../codenames/lib/words';

interface SpyfallStore {
  pack: WordPack;
  roundMinutes: number;
  setPack: (pack: WordPack) => void;
  setRoundMinutes: (minutes: number) => void;
}

export const useSpyfallStore = create<SpyfallStore>((set) => ({
  pack: 'standard',
  roundMinutes: 8,
  setPack: (pack) => set({ pack }),
  setRoundMinutes: (roundMinutes) => set({ roundMinutes }),
}));
