import { useGameStore } from '../../codenames/store/game-store';
import { useGoStore } from '../store/game-store';
import { TEXTS } from '../lib/i18n';
import type { BoardSize, Difficulty, GameMode } from '../lib/types';
import { sfxGameStart, sfxClick, sfxToggle } from '../../../lib/sound';

interface Props {
  onStartGame: () => void;
  onBack: () => void;
}

const BOARD_SIZES: { id: BoardSize; label: string; sizeKey: 'size9' | 'size13' | 'size19' }[] = [
  { id: 9,  label: '9×9',   sizeKey: 'size9'  },
  { id: 13, label: '13×13', sizeKey: 'size13' },
  { id: 19, label: '19×19', sizeKey: 'size19' },
];

const MODES: { id: GameMode; labelKey: 'pvp' | 'pve' }[] = [
  { id: 'pvp', labelKey: 'pvp' },
  { id: 'pve', labelKey: 'pve' },
];

const DIFFICULTIES: { id: Difficulty; labelKey: 'easy' | 'medium' | 'hard' }[] = [
  { id: 'easy',   labelKey: 'easy'   },
  { id: 'medium', labelKey: 'medium' },
  { id: 'hard',   labelKey: 'hard'   },
];

export default function GoHome({ onStartGame, onBack }: Props) {
  const { lang } = useGameStore();
  const {
    boardSize, setBoardSize,
    mode, setMode,
    difficulty, setDifficulty,
    timerEnabled, setTimerEnabled,
  } = useGoStore();
  const txt = TEXTS[lang];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100 p-6">
      <div className="text-center max-w-md w-full">
        <button
          onClick={() => { sfxClick(); onBack(); }}
          className="mb-4 text-amber-700 hover:text-amber-900 font-bold text-sm transition-colors duration-150"
        >
          ← {txt.goHome}
        </button>

        <h1 className="text-5xl font-black text-amber-900 mb-2">{txt.title}</h1>
        <p className="text-amber-700 text-lg mb-6">{txt.subtitle}</p>

        {/* 판 크기 */}
        <p className="text-xs font-bold text-amber-700 mb-1.5 text-left uppercase tracking-wide">{txt.boardSize}</p>
        <div className="flex gap-2 mb-4">
          {BOARD_SIZES.map(({ id, label, sizeKey }) => (
            <button
              key={id}
              onClick={() => { sfxToggle(); setBoardSize(id); }}
              className={`flex-1 py-3 rounded-xl font-bold transition-colors duration-150 ${
                boardSize === id
                  ? 'bg-amber-800 text-white shadow-md'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <div className="text-sm font-bold">{label}</div>
              <div className={`text-xs mt-0.5 ${boardSize === id ? 'text-amber-200' : 'text-amber-400'}`}>
                {txt[sizeKey]}
              </div>
            </button>
          ))}
        </div>

        {/* 대전 방식 */}
        <p className="text-xs font-bold text-amber-700 mb-1.5 text-left uppercase tracking-wide">{txt.mode}</p>
        <div className="flex gap-2 mb-4">
          {MODES.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => { sfxToggle(); setMode(id); }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-colors duration-150 ${
                mode === id
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              {txt[labelKey]}
            </button>
          ))}
        </div>

        {/* 난이도 (PvE 선택 시) */}
        {mode === 'pve' && (
          <div className="mb-4">
            <p className="text-xs font-bold text-amber-700 mb-1.5 text-left uppercase tracking-wide">{txt.difficulty}</p>
            <div className="flex gap-2">
              {DIFFICULTIES.map(({ id, labelKey }) => (
                <button
                  key={id}
                  onClick={() => { sfxToggle(); setDifficulty(id); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors duration-150 ${
                    difficulty === id
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-amber-500 hover:bg-amber-50 border border-amber-200'
                  }`}
                >
                  {txt[labelKey]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 턴 제한시간 */}
        <p className="text-xs font-bold text-amber-700 mb-1.5 text-left uppercase tracking-wide">{txt.timerLabel}</p>
        <div className="flex gap-2 mb-5">
          {([true, false] as const).map((enabled) => (
            <button
              key={String(enabled)}
              onClick={() => { sfxToggle(); setTimerEnabled(enabled); }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-colors duration-150 ${
                timerEnabled === enabled
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              {enabled ? txt.timerOn : txt.timerOff}
            </button>
          ))}
        </div>

        {/* 게임 규칙 */}
        <div className="text-left bg-white rounded-xl p-5 shadow-sm mb-6 border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-3">{txt.howToPlay}</h3>
          <ol className="text-sm text-amber-700 space-y-1.5">
            <li><strong>1.</strong> {txt.rule1}</li>
            <li><strong>2.</strong> {txt.rule2}</li>
            <li><strong>3.</strong> {txt.rule3}</li>
            <li><strong>4.</strong> {txt.rule4}</li>
          </ol>
          <p className="text-xs text-amber-500 mt-3 pt-3 border-t border-amber-100">
            {txt.koNote}
          </p>
        </div>

        <button
          onClick={() => { sfxGameStart(); onStartGame(); }}
          className="w-full bg-amber-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-amber-700 active:scale-95 transition-all duration-150"
        >
          {txt.start}
        </button>
      </div>
    </div>
  );
}
