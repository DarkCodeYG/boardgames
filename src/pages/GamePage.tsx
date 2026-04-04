import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import Board from '../components/Board';
import ClueInput from '../components/ClueInput';
import GameHeader from '../components/GameHeader';
import GameOverModal from '../components/GameOverModal';
import { useGameStore } from '../store/game-store';

interface GamePageProps {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: GamePageProps) {
  const { game, newGame, start, submitClue, selectCard, passTurn } = useGameStore();
  const [showQR, setShowQR] = useState(false);

  if (!game) return null;

  const spymasterUrl = `${window.location.origin}${window.location.pathname}?seed=${game.seed}`;

  const handleNewGame = () => {
    newGame();
    start();
  };

  return (
    <div className="min-h-dvh bg-stone-100 flex flex-col">
      <GameHeader game={game} />

      {/* 게임 시작 전 셋업 */}
      {game.phase === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-md text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-stone-800 mb-2">팀장 답안 QR코드</h2>
            <p className="text-stone-500 text-sm mb-4">
              각 팀의 팀장이 자기 폰으로 스캔하세요
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={spymasterUrl} size={200} />
            </div>
            <p className="text-xs text-stone-400 break-all mb-4">
              시드: <span className="font-mono font-bold">{game.seed}</span>
            </p>
            <p className="text-stone-500 text-sm mb-2">
              선공: {game.startingTeam === 'red' ? '🔴 RED (9장)' : '🔵 BLUE (9장)'}
            </p>
            <button
              onClick={start}
              className="w-full bg-stone-800 text-white text-lg font-bold
                         py-3 rounded-xl hover:bg-stone-700 active:scale-95 transition-all mt-2"
            >
              게임 시작!
            </button>
          </div>
        </div>
      )}

      {/* 게임 진행 중 */}
      {game.phase === 'playing' && (
        <>
          <Board
            game={game}
            isSpymasterView={false}
            onSelectCard={selectCard}
          />

          <div className="mt-auto border-t border-stone-200 bg-white">
            {game.turn.phase === 'giving_clue' && (
              <ClueInput team={game.turn.team} onSubmit={submitClue} />
            )}

            {game.turn.phase === 'guessing' && (
              <div className="flex items-center justify-center gap-3 p-4">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-bold
                             hover:bg-stone-300 transition-colors text-sm"
                >
                  {showQR ? 'QR 숨기기' : '📱 QR 보기'}
                </button>
                <button
                  onClick={passTurn}
                  className="bg-stone-500 text-white px-4 py-2 rounded-lg font-bold
                             hover:bg-stone-600 transition-colors"
                >
                  턴 종료
                </button>
              </div>
            )}

            {showQR && (
              <div className="flex justify-center pb-4">
                <QRCodeSVG value={spymasterUrl} size={120} />
              </div>
            )}
          </div>
        </>
      )}

      {/* 게임 종료 */}
      {game.phase === 'finished' && (
        <>
          <Board
            game={game}
            isSpymasterView={true}
            onSelectCard={() => {}}
          />
          <GameOverModal game={game} onNewGame={handleNewGame} onGoHome={onGoHome} />
        </>
      )}
    </div>
  );
}
