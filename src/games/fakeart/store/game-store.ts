import { create } from 'zustand';
import type { Pack, Lang } from '../lib/types';

interface FakeartStore {
  roomCode: string;
  seed: string;
  pack: Pack;
  lang: Lang;
  drawTime: number;
  setRoom: (code: string, seed: string, pack: Pack, lang: Lang, drawTime: number) => void;
  reset: () => void;
}

export const useFakeartStore = create<FakeartStore>((set) => ({
  roomCode: '',
  seed: '',
  pack: 'standard',
  lang: 'ko',
  drawTime: 45,

  setRoom: (code, seed, pack, lang, drawTime) => {
    set({ roomCode: code, seed, pack, lang, drawTime });
  },

  reset: () => {
    set({ roomCode: '', seed: '', pack: 'standard', lang: 'ko', drawTime: 45 });
  },
}));
