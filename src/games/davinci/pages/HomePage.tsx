import { useState } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { I18N } from '../lib/i18n';
import { useDavinciStore } from '../store/game-store';
import { createDavinciRoom } from '../lib/firebase-room';
import { sfxClick, sfxGameStart, sfxToggle } from '../../../lib/sound';
import type { Lang } from '../lib/types';

interface Props {
  onStartGame: () => void;
  onBack: () => void;
}

export default function DavinciHome({ onStartGame, onBack }: Props) {
  const globalLang = useGameStore((s) => s.lang);
  const { setRoom } = useDavinciStore();
  const [lang, setLang] = useState<Lang>((['ko', 'en', 'zh'].includes(globalLang) ? globalLang : 'ko') as Lang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const txt = I18N[lang];

  async function handleStart() {
    setLoading(true);
    setError('');
    try {
      const code = await createDavinciRoom(lang);
      setRoom(code, lang);
      sfxGameStart();
      onStartGame();
    } catch (e) {
      console.error('[Davinci] createRoom failed:', e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex flex-col items-center">
      <div className="w-full max-w-md flex justify-start mb-4">
        <button
          onClick={() => { sfxClick(); onBack(); }}
          className="text-stone-500 hover:text-stone-700 font-bold transition-colors"
        >
          ← {txt.back}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['ko', 'en', 'zh'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => { sfxToggle(); setLang(l); }}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors
              ${lang === l ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
          >
            {l === 'ko' ? '한국어' : l === 'en' ? 'English' : '中文'}
          </button>
        ))}
      </div>

      <div className="text-center mb-8">
        <div className="text-6xl mb-3" aria-hidden="true">🔢</div>
        <h1 className="text-4xl font-black text-stone-800">{txt.title}</h1>
        <p className="text-stone-500 mt-1">{txt.subtitle}</p>
        <p className="text-stone-400 text-sm mt-1">2–6 {txt.players}</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-md max-w-md w-full mb-6">
        <h2 className="text-lg font-bold text-stone-700 mb-3">{txt.howToPlay}</h2>
        <ul className="space-y-2 text-sm text-stone-600">
          {([txt.rule1, txt.rule2, txt.rule3, txt.rule4, txt.rule5, txt.rule6] as string[]).map(
            (rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-stone-400 shrink-0">{i + 1}.</span>
                <span>{rule}</span>
              </li>
            ),
          )}
          <li className="flex gap-2 text-amber-700 bg-amber-50 rounded-xl p-2 mt-1">
            <span aria-hidden="true">🃏</span>
            <span>{txt.jokerRule}</span>
          </li>
        </ul>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full max-w-md py-4 rounded-2xl bg-stone-800 text-white text-xl font-bold
                   hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? '...' : txt.startGame}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-3 max-w-md text-center break-all">{error}</p>
      )}
    </div>
  );
}
