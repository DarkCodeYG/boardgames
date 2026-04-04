import { useState } from 'react';
import { useWitnessesStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import { wt } from '../lib/i18n';
import type { SpecialRole } from '../lib/types';

const ALL_ROLES: { key: SpecialRole; team: 'witness' | 'agent' }[] = [
  { key: 'overseer', team: 'witness' },
  { key: 'elder', team: 'witness' },
  { key: 'commander', team: 'agent' },
  { key: 'cleric', team: 'agent' },
  { key: 'apostate', team: 'agent' },
];

interface Props {
  onStartGame: () => void;
  onStartOnline?: (enabledRoles: SpecialRole[]) => void;
  onBack?: () => void;
}

export default function HomePage({ onStartGame, onStartOnline, onBack }: Props) {
  const lang = useGameStore((s) => s.lang);
  const { initAndStart } = useWitnessesStore();
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [enabledRoles, setEnabledRoles] = useState<SpecialRole[]>([
    'overseer', 'commander', 'elder', 'cleric', 'apostate',
  ]);

  const toggleRole = (role: SpecialRole) => {
    setEnabledRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const addName = () => {
    const trimmed = input.trim();
    if (trimmed && names.length < 12) {
      setNames([...names, trimmed]);
      setInput('');
    }
  };

  const removeName = (i: number) => {
    setNames(names.filter((_, idx) => idx !== i));
  };

  const handleStart = () => {
    if (names.length < 5) return;
    initAndStart(names, enabledRoles);
    onStartGame();
  };

  const canStart = names.length >= 5 && names.length <= 12;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="max-w-md mx-auto">
        {onBack && (
          <button onClick={onBack} className="mb-4 text-stone-500 hover:text-stone-700 font-bold text-sm">
            {wt(lang, 'back')}
          </button>
        )}

        <h1 className="text-4xl font-black text-stone-800 text-center mb-1">{wt(lang, 'title')}</h1>
        <p className="text-stone-500 text-center mb-6">{wt(lang, 'subtitle')}</p>

        {/* 룰 설명 */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-stone-700 mb-3">{wt(lang, 'howToPlay')}</h3>
          <ol className="text-sm text-stone-500 space-y-2">
            <li><strong>1.</strong> {wt(lang, 'rule1')}</li>
            <li><strong>2.</strong> {wt(lang, 'rule2')}</li>
            <li><strong>3.</strong> {wt(lang, 'rule3')}</li>
            <li><strong>4.</strong> {wt(lang, 'rule4')}</li>
            <li><strong>5.</strong> {wt(lang, 'rule5')}</li>
          </ol>
        </div>

        {/* 플레이어 이름 */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h3 className="font-bold text-stone-700 mb-3">
            {wt(lang, 'playerNames')} ({names.length}/12)
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addName()}
              placeholder={wt(lang, 'namePlaceholder')}
              className="flex-1 border-2 border-stone-300 rounded-lg px-3 py-2 font-bold
                         focus:outline-none focus:border-stone-500"
              maxLength={10}
            />
            <button
              onClick={addName}
              disabled={!input.trim() || names.length >= 12}
              className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold
                         disabled:opacity-40 hover:bg-stone-700"
            >
              {wt(lang, 'addPlayer')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {names.map((name, i) => (
              <span
                key={i}
                className="bg-stone-100 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
              >
                {name}
                <button
                  onClick={() => removeName(i)}
                  className="text-stone-400 hover:text-red-500 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 특수 직분 */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-stone-700 mb-3">{wt(lang, 'specialRoles')}</h3>
          <div className="space-y-2">
            {ALL_ROLES.map(({ key, team }) => (
              <label
                key={key}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={enabledRoles.includes(key)}
                  onChange={() => toggleRole(key)}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <span className={`font-bold text-sm ${team === 'witness' ? 'text-blue-600' : 'text-red-600'}`}>
                    {wt(lang, key as any)}
                  </span>
                  <p className="text-xs text-stone-400">
                    {wt(lang, `${key}Desc` as any)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-40 mb-3"
        >
          {canStart ? `🎴 ${wt(lang, 'startGame')} (오프라인)` : wt(lang, 'needPlayers')}
        </button>

        {onStartOnline && (
          <button
            onClick={() => onStartOnline(enabledRoles)}
            className="w-full bg-blue-600 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                       hover:bg-blue-500 active:scale-95 transition-all"
          >
            📱 온라인 모드 (각자 폰 연동)
          </button>
        )}
      </div>
    </div>
  );
}
