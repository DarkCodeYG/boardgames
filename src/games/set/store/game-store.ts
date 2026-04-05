import { create } from 'zustand';
import type { Theme, Lang } from '../lib/types';

interface SetStore {
  roomCode: string;
  theme: Theme;
  lang: Lang;
  setRoom: (code: string, theme: Theme, lang: Lang) => void;
  setLang: (lang: Lang) => void;
  reset: () => void;
}

export const useSetStore = create<SetStore>((set) => ({
  roomCode: '',
  theme: 'standard',
  lang: 'ko',
  setRoom: (code, theme, lang) => set({ roomCode: code, theme, lang }),
  setLang: (lang) => set({ lang }),
  reset: () => set({ roomCode: '', theme: 'standard', lang: 'ko' }),
}));
