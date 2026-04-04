import type { GameState } from '../lib/types';
import { t, type Lang } from '../lib/i18n';

interface GameHeaderProps {
  game: GameState;
  lang: Lang;
}

export default function GameHeader({ game, lang }: GameHeaderProps) {
  const { currentTeam, score, target } = game;

  const teamBg = currentTeam === 'red' ? 'bg-red-500' : 'bg-blue-500';
  const teamName = t(lang, currentTeam === 'red' ? 'red' : 'blue');

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b border-stone-200">
      <div className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-lg">
        {score.red} / {target.red}
      </div>

      <div className={`${teamBg} text-white px-4 py-1 rounded-full font-bold text-base`}>
        {t(lang, 'teamTurn', { team: teamName })}
      </div>

      <div className="bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-lg">
        {score.blue} / {target.blue}
      </div>
    </div>
  );
}
