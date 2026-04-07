import type { GameState } from '../lib/types';
import { t, type Lang } from '../lib/i18n';
import { sfxClick } from '../../../lib/sound';
import Confetti from '../../../components/Confetti';

interface GameOverModalProps {
  game: GameState;
  lang: Lang;
  onNewGame: () => void;
  onGoHome: () => void;
}

export default function GameOverModal({ game, lang, onNewGame, onGoHome }: GameOverModalProps) {
  if (game.phase !== 'finished' || !game.winner) return null;

  const winnerColor = game.winner === 'red' ? 'text-red-500' : 'text-blue-500';
  const winnerBg = game.winner === 'red' ? 'bg-red-500' : 'bg-blue-500';
  const teamName = t(lang, game.winner === 'red' ? 'red' : 'blue');
  const reasonText = t(lang, game.winReason === 'assassin' ? 'reasonAssassin' : 'reasonAllFound');
  const isVictory = game.winReason !== 'assassin';
  const titleId = 'game-over-title';

  return (
    <>
      {isVictory && <Confetti />}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4" aria-hidden="true">
            {isVictory ? '🏆' : '💀'}
          </div>
          <h2 id={titleId} className={`text-3xl font-black ${winnerColor} mb-2`}>
            {t(lang, 'winner', { team: teamName })}
          </h2>
          <p className="text-stone-500 mb-6">{reasonText}</p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { sfxClick(); onNewGame(); }}
              className={`${winnerBg} text-white px-6 py-3 rounded-xl font-bold
                         hover:opacity-90 transition-opacity`}
            >
              {t(lang, 'playAgain')}
            </button>
            <button
              onClick={() => { sfxClick(); onGoHome(); }}
              className="bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold
                         hover:bg-stone-300 transition-colors"
            >
              {t(lang, 'goHome')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
