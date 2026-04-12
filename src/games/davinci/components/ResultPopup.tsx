import type { LastResult, Tile } from '../lib/types';
import { formatTileNumber } from '../lib/game-engine';
import type { I18N } from '../lib/i18n';
import { DAVINCI_TILE } from '../../../lib/colors';

interface Props {
  result: LastResult;
  guesserName: string;
  targetTile?: Tile | null;
  drawnTile?: Tile | null;
  hasWinner: boolean;
  countdown: number;
  canAct: boolean;
  txt: (typeof I18N)[keyof typeof I18N];
  onContinue: () => void;
  onEndTurn: () => void;
}

export default function ResultPopup({
  result, guesserName, targetTile, drawnTile, hasWinner, countdown, canAct, txt, onContinue, onEndTurn,
}: Props) {
  const isCorrect = result.correct;

  // 색상은 항상 공개 — 숫자만 비공개
  const targetColorClass = targetTile
    ? DAVINCI_TILE[targetTile.color].unrevealed
    : 'bg-stone-800 border-stone-600 text-stone-300';

  const tileColorLabel = targetTile
    ? (targetTile.color === 'black' ? '⬛' : '⬜')
    : '';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" />
      <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-6">
        <div className={`rounded-3xl p-5 shadow-2xl border ${
          isCorrect ? 'bg-emerald-950 border-emerald-600' : 'bg-red-950 border-red-700'
        }`}>

          <div className="text-center mb-3">
            <div className="text-4xl mb-1" aria-hidden="true">{isCorrect ? '✅' : '❌'}</div>
            <div className={`text-2xl font-black ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
              {isCorrect ? txt.correct : txt.wrong}
            </div>
            <p className="text-sm text-stone-400 mt-1">
              <span className="text-white font-bold">{guesserName}</span>
              {' → '}
              <span className="text-white font-bold">{result.targetId}</span>
              {txt.targetTileOf}
            </p>
          </div>

          {/* 지목한 타일  ≠/=  추측한 숫자 */}
          <div className="flex items-stretch justify-center gap-3 mb-3">
            {/* 지목 타일 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-stone-500">{txt.targeted}</span>
              <div className={`w-16 rounded-xl border-2 flex items-center justify-center font-black text-2xl ${targetColorClass}`}
                style={{ height: '5.5rem' }}>
                {isCorrect ? formatTileNumber(result.guessedNumber) : '?'}
              </div>
              <span className="text-xs text-stone-500">{tileColorLabel}</span>
            </div>

            {/* 연산자 */}
            <div className={`self-center text-2xl font-black pb-4 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {isCorrect ? '✓' : '≠'}
            </div>

            {/* 추측 숫자 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-stone-500">{txt.guessLabel}</span>
              <div className={`w-16 rounded-xl border-2 flex items-center justify-center font-black text-2xl ${
                isCorrect
                  ? 'bg-emerald-900 border-emerald-400 text-emerald-200'
                  : 'bg-red-900 border-red-400 text-red-200'
              }`} style={{ height: '5.5rem' }}>
                {formatTileNumber(result.guessedNumber)}
              </div>
              {/* 정렬 맞춤용 빈 칸 */}
              <span className="text-xs opacity-0">-</span>
            </div>
          </div>

          {!isCorrect && drawnTile != null && (
            <div className="mb-3 px-3 py-2 bg-amber-900/60 border border-amber-600 rounded-xl text-center text-sm text-amber-200">
              <span aria-hidden="true">⚠️ </span>
              <span className="font-bold">{guesserName}</span>
              {txt.drawnRevealPrefix}
              <span className="font-black text-amber-100 text-base">{formatTileNumber(drawnTile.number)}</span>
              {txt.drawnRevealSuffix}
            </div>
          )}

          <div className="mb-4">
            <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                  countdown <= 3 ? 'bg-red-400' : isCorrect ? 'bg-emerald-400' : 'bg-red-400'
                }`}
                style={{ width: `${countdown * 10}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 text-right mt-1">{countdown}s</p>
          </div>

          {/* 버튼 (현재 차례만) */}
          {canAct && (
            <div className="flex gap-2">
              {isCorrect && !hasWinner && (
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
