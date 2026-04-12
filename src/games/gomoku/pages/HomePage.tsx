import { useGameStore } from '../../codenames/store/game-store';
import { useGomokuStore } from '../store/game-store';
import { TEXTS } from '../lib/i18n';
import type { Difficulty, GameMode } from '../lib/types';
import { sfxGameStart, sfxClick, sfxToggle } from '../../../lib/sound';

interface Props {
  onStartGame: () => void;
  onBack: () => void;
}

export default function GomokuHome({ onStartGame, onBack }: Props) {
  const { lang } = useGameStore();
  const { mode, difficulty, setMode, setDifficulty } = useGomokuStore();
  const txt = TEXTS[lang];

  const MODES: { id: GameMode; label: string }[] = [
    { id: 'pvp', label: txt.pvp },
    { id: 'pve', label: txt.solo },
  ];

  const DIFFICULTIES: { id: Difficulty; label: string }[] = [
    { id: 'easy',   label: txt.easy },
    { id: 'medium', label: txt.medium },
    { id: 'hard',   label: txt.hard },
  ];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="text-center max-w-md w-full">
        <button
          onClick={() => { sfxClick(); onBack(); }}
          className="mb-4 text-stone-500 hover:text-stone-700 font-bold text-sm"
        >
          ← {txt.goHome}
        </button>

        <h1 className="text-5xl font-black text-stone-800 mb-2">{txt.title}</h1>
        <p className="text-stone-500 text-lg mb-6">{txt.subtitle}</p>

        <div className="flex gap-2 mb-4">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { sfxToggle(); setMode(id); }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-colors duration-150 ${
                mode === id
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-500 hover:bg-stone-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'pve' && (
          <div className="flex gap-2 mb-4">
            {DIFFICULTIES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { sfxToggle(); setDifficulty(id); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors duration-150 ${
                  difficulty === id
                    ? 'bg-stone-600 text-white'
                    : 'bg-white text-stone-400 hover:bg-stone-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="text-left bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-stone-700 mb-3">{txt.howToPlay}</h3>
          <ol className="text-sm text-stone-500 space-y-2">
            <li><strong>1.</strong> {txt.rule1}</li>
            <li><strong>2.</strong> {txt.rule2}</li>
            <li><strong>3.</strong> {mode === 'pve' ? txt.rule3Pve : txt.rule3}</li>
          </ol>
        </div>

        <button
          onClick={() => { sfxGameStart(); onStartGame(); }}
          className="w-full bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all"
        >
          {txt.start}
        </button>
      </div>
    </div>
  );
}
