import { useState } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { useSetStore } from '../store/game-store';
import { I18N } from '../lib/i18n';
import { createSetRoom } from '../lib/firebase-set';
import { sfxClick, sfxGameStart } from '../../../lib/sound';
import type { Theme } from '../lib/types';

const LANGS = ['ko', 'en', 'zh'] as const;
const LANG_LABELS = { ko: '한국어', en: 'English', zh: '中文' };

interface HomePageProps {
  onStartGame: () => void;
  onBack: () => void;
}

export default function HomePage({ onStartGame, onBack }: HomePageProps) {
  const globalLang = useGameStore((s) => s.lang);
  const { lang, setRoom, setLang } = useSetStore();
  const [creating, setCreating] = useState(false);
  const activeLang = lang || globalLang;
  const txt = I18N[activeLang];

  const handleCreate = async (theme: Theme) => {
    if (creating) return;
    setCreating(true);
    sfxGameStart();
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      const code = await Promise.race([createSetRoom(theme, activeLang), timeout]);
      setRoom(code, theme, activeLang);
      onStartGame();
    } catch (err) {
      console.error('방 생성 실패:', err);
      alert('방 생성에 실패했습니다. 인터넷 연결을 확인해 주세요.');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { sfxClick(); onBack(); }}
            className="text-stone-500 hover:text-stone-700 font-bold text-sm"
          >
            ← {txt.goHome}
          </button>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => { sfxClick(); setLang(l); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors
                  ${activeLang === l ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🃏</div>
          <h1 className="text-5xl font-black text-stone-800">{txt.title}</h1>
          <p className="text-stone-500 mt-2 text-sm">{txt.subtitle}</p>
        </div>

        {/* Theme selection */}
        <p className="text-stone-600 font-bold mb-4 text-center text-lg">{txt.themeLabel}</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleCreate('standard')}
            disabled={creating}
            className="bg-white rounded-2xl p-6 shadow-md text-center
                       hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-center gap-1 mb-3">
              <div className="w-5 h-5 rounded-full bg-red-500" />
              <div className="w-5 h-5 rounded-full bg-green-500" />
              <div className="w-5 h-5 rounded-full bg-purple-500" />
            </div>
            <h2 className="text-xl font-black text-stone-800 mb-1">{txt.standard}</h2>
            <p className="text-xs text-stone-500">{txt.standardDesc}</p>
          </button>

          <button
            onClick={() => handleCreate('genius')}
            disabled={creating}
            className="bg-white rounded-2xl p-6 shadow-md text-center
                       hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex justify-center gap-2 mb-3">
              <svg viewBox="0 0 30 30" className="w-5 h-5">
                <polygon points="15,3 27,26 3,26" fill="#3b82f6" stroke="#f59e0b" strokeWidth="3" />
              </svg>
              <svg viewBox="0 0 30 30" className="w-5 h-5">
                <circle cx="15" cy="15" r="12" fill="#22c55e" stroke="#a855f7" strokeWidth="3" />
              </svg>
              <svg viewBox="0 0 30 30" className="w-5 h-5">
                <rect x="3" y="3" width="24" height="24" rx="3" fill="#ef4444" stroke="#f97316" strokeWidth="3" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-stone-800 mb-1">{txt.genius}</h2>
            <p className="text-xs text-stone-500">{txt.geniusDesc}</p>
          </button>
        </div>

        {creating && (
          <p className="text-center text-stone-500 font-bold mt-6">{txt.creatingRoom}</p>
        )}
      </div>
    </div>
  );
}
