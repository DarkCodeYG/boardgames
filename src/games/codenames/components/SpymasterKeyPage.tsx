import { useEffect, useState } from 'react';
import { createBoard } from '../lib/game-engine';
import type { Card } from '../lib/types';
import { t, type Lang } from '../lib/i18n';
import type { WordPack } from '../lib/words';

const COLOR_MAP = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  neutral: 'bg-amber-100 text-amber-800',
  assassin: 'bg-gray-900 text-white',
};

export default function SpymasterKeyPage() {
  const [board, setBoard] = useState<Card[] | null>(null);
  const [startingTeam, setStartingTeam] = useState<string>('');
  const [lang, setLang] = useState<Lang>('ko');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    const l = params.get('lang') as Lang | null;
    const rawPack = params.get('pack');
    const p = rawPack && ['standard', 'jw'].includes(rawPack) ? rawPack as WordPack : null;
    if (l && ['ko', 'en', 'zh'].includes(l)) setLang(l);
    if (seed) {
      const result = createBoard(seed, l || 'ko', p || 'standard');
      setBoard(result.board);
      setStartingTeam(result.startingTeam);
    }
  }, []);

  if (!board) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-100">
        <p className="text-stone-500 text-lg">{t(lang, 'spymasterNoSeed')}</p>
      </div>
    );
  }

  const firstTeamLabel = startingTeam === 'red'
    ? t(lang, 'redCards', { n: 9 })
    : t(lang, 'blueCards', { n: 9 });

  return (
    <div className="min-h-dvh bg-stone-900 p-4 flex flex-col items-center justify-center">
      <h1 className="text-white text-xl font-bold mb-2">{t(lang, 'spymasterTitle')}</h1>
      <p className="text-stone-400 text-sm mb-4">
        {t(lang, 'spymasterFirst', { team: firstTeamLabel })}
      </p>

      <div className="grid grid-cols-5 gap-1.5 max-w-sm w-full">
        {board.map((card) => (
          <div
            key={card.id}
            className={`
              aspect-square rounded-lg flex items-center justify-center p-1
              text-sm font-black shadow-sm
              ${COLOR_MAP[card.type]}
            `}
          >
            {card.word}
          </div>
        ))}
      </div>

      <p className="text-stone-500 text-xs mt-4">{t(lang, 'spymasterWarn')}</p>
    </div>
  );
}
