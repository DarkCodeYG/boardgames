import { useGameStore } from '../store/game-store';
import { t } from '../lib/i18n';
import type { WordPack } from '../lib/words';
import { sfxToggle, sfxClick } from '../../../lib/sound';
import JWIcon from '../../../components/JWIcon';

interface HomePageProps {
  onStartGame: () => void;
  onBack?: () => void;
}

const PACKS: { value: WordPack; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'jw', label: 'JW' },
];

export default function HomePage({ onStartGame, onBack }: HomePageProps) {
  const { newGame, lang, pack, setPack, hiddenMode } = useGameStore();

  const getPackButtonClass = (value: WordPack) => {
    const isJW = value === 'jw';
    const isActive = pack === value;
    if (isJW) {
      return `inline-flex items-center justify-center w-14 h-14 rounded-2xl transition-all ${isActive ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-90'}`;
    }
    return `px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${isActive ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`;
  };

  const handleStart = () => {
    newGame();
    onStartGame();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="text-center max-w-md">
        {/* 뒤로가기 */}
        {onBack && (
          <button
            onClick={() => { sfxClick(); onBack?.(); }}
            className="mb-4 text-stone-500 hover:text-stone-700 font-bold text-sm"
          >
            ← {t(lang, 'goHome')}
          </button>
        )}

        {/* 단어팩 선택 */}
        <div className="flex justify-center gap-2 mb-6">
          {PACKS.filter((p) => p.value !== 'jw' || hiddenMode).map((p) => (
            <button
              key={p.value}
              onClick={() => { sfxToggle(); setPack(p.value); }}
              className={getPackButtonClass(p.value)}
            >
              {p.value === 'jw' ? <JWIcon active={pack === 'jw'} /> : p.label}
            </button>
          ))}
        </div>

        <h1 className="text-6xl font-black text-stone-800 mb-2">
          {t(lang, 'title')}
        </h1>
        <p className="text-stone-500 text-lg mb-8">
          {t(lang, 'subtitle')}
        </p>

        <button
          onClick={handleStart}
          className="w-full bg-stone-800 text-white text-xl font-bold
                     py-4 px-8 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all"
        >
          {t(lang, 'newGame')}
        </button>

        <div className="mt-8 text-left bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-stone-700 mb-3">{t(lang, 'howToPlay')}</h3>
          <ol className="text-sm text-stone-500 space-y-2">
            <li><strong>1.</strong> {t(lang, 'rule1')}</li>
            <li><strong>2.</strong> {t(lang, 'rule2')}</li>
            <li><strong>3.</strong> {t(lang, 'rule3')}</li>
            <li><strong>4.</strong> {t(lang, 'rule4')}</li>
            <li><strong>5.</strong> {t(lang, 'rule5')}</li>
          </ol>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="font-bold text-stone-600 text-sm mb-2">{t(lang, 'tipTitle')}</p>
            <ul className="text-sm text-stone-400 space-y-1">
              <li>• {t(lang, 'tip1')}</li>
              <li>• {t(lang, 'tip2')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
