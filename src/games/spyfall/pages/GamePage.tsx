import { QRCodeSVG } from 'qrcode.react';
import { useState, useCallback } from 'react';
import { useSpyfallStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import Timer from '../components/Timer';
import { sfxClick, sfxModalOpen, sfxModalClose, sfxTimerUp } from '../../../lib/sound';

const TEXTS = {
  ko: {
    qrTitle: '각 플레이어가 자기 QR을 스캔하세요',
    player: '플레이어',
    startRound: '라운드 시작!',
    timeUp: '⏰ 시간 종료!',
    vote: '투표하여 스파이를 찾으세요!',
    newGame: '홈으로',
    restart: '다시 하기',
    confirmTitle: '게임 종료',
    confirmMsg: '현재 게임을 종료하고 홈으로 이동할까요?',
    cancel: '취소',
    confirm: '홈으로 이동',
  },
  en: {
    qrTitle: 'Each player scans their QR code',
    player: 'Player',
    startRound: 'Start Round!',
    timeUp: '⏰ Time\'s up!',
    vote: 'Vote to find the spy!',
    newGame: 'Home',
    restart: 'Play Again',
    confirmTitle: 'End Game',
    confirmMsg: 'End current game and go home?',
    cancel: 'Cancel',
    confirm: 'Start New Game',
  },
  zh: {
    qrTitle: '每位玩家扫描自己的QR码',
    player: '玩家',
    startRound: '开始回合！',
    timeUp: '⏰ 时间到！',
    vote: '投票找出间谍！',
    newGame: '主页',
    restart: '再来一局',
    confirmTitle: '结束游戏',
    confirmMsg: '结束当前游戏并返回主页？',
    cancel: '取消',
    confirm: '返回主页',
  },
};

interface GamePageProps {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: GamePageProps) {
  const { game, pack, start, newGame, reset } = useSpyfallStore();
  const lang = useGameStore((s) => s.lang);
  const [timeUp, setTimeUp] = useState(false);
  const [showRestart, setShowRestart] = useState(false);

  const txt = TEXTS[lang];

  if (!game) return null;

  const baseUrl = `${window.location.origin}${window.location.pathname}`;

  const handleTimeUp = useCallback(() => { sfxTimerUp(); setTimeUp(true); }, []);

  const handleRestart = () => {
    newGame(game.playerCount, game.roundMinutes);
    setTimeUp(false);
    setShowRestart(false);
  };

  return (
    <div className="h-dvh bg-stone-100 flex flex-col overflow-hidden">
      {/* 셋업: QR코드 배분 */}
      {game.phase === 'setup' && (
        <div className="flex-1 flex flex-col items-center p-4 overflow-auto">
          <h2 className="text-lg font-bold text-stone-800 mb-4">{txt.qrTitle}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6 max-w-lg w-full mb-6">
            {Array.from({ length: game.playerCount }, (_, i) => {
              const url = `${baseUrl}?game=spyfall&seed=${game.seed}&player=${i}&count=${game.playerCount}&lang=${lang}&pack=${pack}`;
              return (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <p className="text-sm font-bold text-stone-600 mb-2">{txt.player} {i + 1}</p>
                  <QRCodeSVG value={url} size={100} className="mx-auto" />
                </div>
              );
            })}
          </div>

          <button
            onClick={start}
            className="w-full max-w-xs bg-stone-800 text-white text-lg font-bold py-3 rounded-xl
                       hover:bg-stone-700 active:scale-95 transition-all"
          >
            {txt.startRound}
          </button>
        </div>
      )}

      {/* 게임 진행: 타이머 */}
      {game.phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {!timeUp ? (
            <>
              <Timer
                startedAt={game.startedAt!}
                durationMinutes={game.roundMinutes}
                onTimeUp={handleTimeUp}
              />
              <p className="text-stone-500 mt-4 text-sm">
                {game.playerCount} {txt.player} · {game.roundMinutes} min
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">⏰</div>
              <h2 className="text-3xl font-black text-red-500 mb-2">{txt.timeUp}</h2>
              <p className="text-stone-500 text-lg">{txt.vote}</p>
            </>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => { sfxClick(); handleRestart(); }}
              className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold
                         hover:bg-stone-700 transition-colors"
            >
              {txt.restart}
            </button>
            <button
              onClick={() => { sfxModalOpen(); setShowRestart(true); }}
              className="bg-stone-200 text-stone-700 px-4 py-3 rounded-xl font-bold
                         hover:bg-stone-300 transition-colors text-sm"
            >
              {txt.newGame}
            </button>
          </div>
        </div>
      )}

      {/* 재시작 확인 */}
      {showRestart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-2">{txt.confirmTitle}</h3>
            <p className="text-stone-500 mb-5">{txt.confirmMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { sfxModalClose(); setShowRestart(false); }}
                className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-300">
                {txt.cancel}
              </button>
              <button onClick={() => { sfxClick(); reset(); onGoHome(); }}
                className="bg-stone-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-stone-700">
                {txt.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
