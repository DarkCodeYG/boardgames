import type { GameState } from '../lib/types';

interface GameHeaderProps {
  game: GameState;
}

export default function GameHeader({ game }: GameHeaderProps) {
  const { turn, score, target, phase } = game;

  const turnLabel = turn.team === 'red' ? '🔴 RED' : '🔵 BLUE';
  const phaseLabel = turn.phase === 'giving_clue' ? '단서 제출' : '추측 중';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
      {/* RED 점수 */}
      <div className="flex items-center gap-2">
        <div className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-lg">
          {score.red} / {target.red}
        </div>
      </div>

      {/* 턴 정보 */}
      <div className="text-center">
        {phase === 'playing' && (
          <>
            <div className="font-bold text-lg">{turnLabel} 팀</div>
            <div className="text-sm text-stone-500">
              {phaseLabel}
              {turn.clue && (
                <span className="ml-2 font-bold text-stone-700">
                  "{turn.clue.word}" {turn.clue.count}
                  {turn.phase === 'guessing' && ` (남은 추측: ${turn.guessesRemaining})`}
                </span>
              )}
            </div>
          </>
        )}
        {phase === 'setup' && (
          <div className="font-bold text-lg text-stone-600">게임 준비</div>
        )}
      </div>

      {/* BLUE 점수 */}
      <div className="flex items-center gap-2">
        <div className="bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-lg">
          {score.blue} / {target.blue}
        </div>
      </div>
    </div>
  );
}
