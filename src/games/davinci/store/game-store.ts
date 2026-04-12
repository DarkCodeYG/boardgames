import { create } from 'zustand';
import type { Lang } from '../lib/types';

interface DavinciStore {
  roomCode: string;
  lang: Lang;
  setRoom: (code: string, lang: Lang) => void;
  reset: () => void;
}

export const useDavinciStore = create<DavinciStore>((set) => ({
  roomCode: '',
  lang: 'ko',
  setRoom: (code, lang) => set({ roomCode: code, lang }),
  reset: () => set({ roomCode: '', lang: 'ko' }),
}));
