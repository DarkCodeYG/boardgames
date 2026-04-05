import { useState } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { wt } from '../lib/i18n';
import type { SpecialRole } from '../lib/types';
import { sfxClick, sfxToggle, sfxGameStart } from '../../../lib/sound';

const ALL_ROLES: { key: SpecialRole; team: 'witness' | 'agent' }[] = [
  { key: 'overseer', team: 'witness' },
  { key: 'elder', team: 'witness' },
  { key: 'commander', team: 'agent' },
  { key: 'cleric', team: 'agent' },
  { key: 'apostate', team: 'agent' },
];

interface Props {
  onStart: (enabledRoles: SpecialRole[]) => void;
  onBack?: () => void;
}

export default function HomePage({ onStart, onBack }: Props) {
  const lang = useGameStore((s) => s.lang);
  const [enabledRoles, setEnabledRoles] = useState<SpecialRole[]>([
    'overseer', 'commander', 'elder', 'cleric', 'apostate',
  ]);

  const toggleRole = (role: SpecialRole) => {
    sfxToggle();
    setEnabledRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="max-w-md mx-auto">
        {onBack && (
          <div className="text-center mb-4">
            <button onClick={() => { sfxClick(); onBack?.(); }} className="text-stone-500 hover:text-stone-700 font-bold text-sm">
              {wt(lang, 'back')}
            </button>
          </div>
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

        {/* 특수 직분 */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-stone-700 mb-3">{wt(lang, 'specialRoles')}</h3>
          <div className="space-y-2">
            {ALL_ROLES.map(({ key, team }) => (
              <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
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
                  <p className="text-xs text-stone-400">{wt(lang, `${key}Desc` as any)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => { sfxGameStart(); onStart(enabledRoles); }}
          className="w-full bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all"
        >
          {wt(lang, 'startGame')}
        </button>
      </div>
    </div>
  );
}
