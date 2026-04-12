import type { LastResult, Tile } from '../lib/types';
import { formatTileNumber } from '../lib/game-engine';
import type { I18N } from '../lib/i18n';

interface Props {
  result: LastResult;
  guesserName: string;
  hasWinner: boolean;
  countdown: number;
  canAct: boolean;
  drawnTile: Tile | null | undefined;
  txt: (typeof I18N)[keyof typeof I18N];
  onContinue: () => void;
  onEndTurn: () => void;
}

export default function ResultPopup({
  result, guesserName, hasWinner, countdown, canAct, drawnTile, txt, onContinue, onEndTurn,
}: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" />
      <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-6">
        <div className={`rounded-3xl p-5 shadow-2xl border ${
          result.correct ? 'bg-emerald-950 border-emerald-600' : 'bg-red-950 border-red-700'
        }`}>
          <div className="text-center mb-4">
            <div className="text-5xl mb-2" aria-hidden="true">
              {result.correct ? '✅' : '❌'}
            </div>
            <div className={`text-3xl font-black ${result.correct ? 'text-emerald-300' : 'text-red-300'}`}>
              {result.correct ? txt.correct : txt.wrong}
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-stone-400 text-sm mb-3">
              <span className="text-white font-bold">{guesserName}</span>
              {' → '}
              <span className="text-white font-bold">{result.targetId}</span>
              {txt.targetTileOf}
            </p>
            <div className={`inline-flex items-center justify-center w-20 h-28 rounded-2xl border-4 font-black text-4xl shadow-lg ${
              result.correct
                ? 'bg-emerald-900 border-emerald-400 text-emerald-200'
                : 'bg-red-900 border-red-400 text-red-200'
            }`}>
              {formatTileNumber(result.guessedNumber)}
            </div>
            {!result.correct && drawnTile != null && (
              <div className="mt-3 px-3 py-2 bg-amber-900/60 border border-amber-600 rounded-xl text-center text-sm text-amber-200">
                <span aria-hidden="true">⚠️ </span>
                <span className="font-bold">{guesserName}</span>
                {txt.drawnRevealPrefix}
                <span className="font-black text-amber-100 text-base">{formatTileNumber(drawnTile.number)}</span>
                {txt.drawnRevealSuffix}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                  countdown <= 3 ? 'bg-red-400' : result.correct ? 'bg-emerald-400' : 'bg-red-400'
                }`}
                style={{ width: `${countdown * 10}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 text-right mt-1">{countdown}s</p>
          </div>

          {canAct && (
            <div className="flex gap-2">
              {result.correct && !hasWinner && (
                <button
                  onClick={onContinue}
                  className="flex-1 py-3 rounded-2xl bg-emerald-700 text-white font-bold hover:bg-emerald-600 active:scale-95 transition-all"
                >
                  {txt.continueGuess}
                </button>
              )}
              <button
                onClick={onEndTurn}
                className="flex-1 py-3 rounded-2xl bg-stone-700 text-white font-bold hover:bg-stone-600 active:scale-95 transition-all"
              >
                {txt.endTurn}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
