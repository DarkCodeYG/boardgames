import { QRCodeSVG } from 'qrcode.react';
import { useState, useCallback, useMemo } from 'react';
import { useSpyfallStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import Timer from '../components/Timer';
import { getPlayerRole } from '../lib/game-engine';
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
    viewResults: '결과 보기',
    resultConfirmTitle: '게임 종료 확인',
    resultConfirmMsg: '게임이 종료되었습니까?',
    resultConfirm: '확인',
    resultTitle: '플레이어 정보',
    resultSubtitle: '각 플레이어의 장소와 역할을 확인하세요',
    close: '닫기',
    spy: '스파이',
    civilian: '스파이 아님',
    location: '장소',
    role: '역할',
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
    viewResults: 'View Results',
    resultConfirmTitle: 'Confirm End Game',
    resultConfirmMsg: 'Has the game ended?',
    resultConfirm: 'Confirm',
    resultTitle: 'Player Information',
    resultSubtitle: 'Review each player’s location and role',
    close: 'Close',
    spy: 'Spy',
    civilian: 'Not Spy',
    location: 'Location',
    role: 'Role',
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
    viewResults: '查看结果',
    resultConfirmTitle: '确认游戏结束',
    resultConfirmMsg: '游戏是否已经结束？',
    resultConfirm: '确认',
    resultTitle: '玩家信息',
    resultSubtitle: '查看每位玩家的地点和角色',
    close: '关闭',
    spy: '间谍',
    civilian: '非间谍',
    location: '地点',
    role: '角色',
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
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const txt = TEXTS[lang];

  const playerRoles = useMemo(() => {
    if (!game) return [];
    return Array.from({ length: game.playerCount }, (_, i) =>
      getPlayerRole(game.seed, i, game.playerCount, lang, pack),
    );
  }, [game, lang, pack]);

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

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
            <button
              onClick={() => { sfxModalOpen(); setShowEndConfirm(true); }}
              className="bg-slate-700 text-white px-4 py-3 rounded-xl font-bold
                         hover:bg-slate-600 transition-colors text-sm"
            >
              {txt.viewResults}
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

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-2">{txt.resultConfirmTitle}</h3>
            <p className="text-stone-500 mb-5">{txt.resultConfirmMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { sfxModalClose(); setShowEndConfirm(false); }}
                className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-300">
                {txt.cancel}
              </button>
              <button onClick={() => { sfxClick(); setShowEndConfirm(false); setShowResults(true); }}
                className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-700">
                {txt.resultConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-stone-900">{txt.resultTitle}</h3>
                <p className="text-sm text-stone-500">{txt.resultSubtitle}</p>
              </div>
              <button onClick={() => { sfxModalClose(); setShowResults(false); }}
                className="text-stone-500 hover:text-stone-800 text-sm font-bold">
                {txt.close}
              </button>
            </div>
            <div className="grid gap-3 max-h-[60vh] overflow-auto">
              {playerRoles.map((player, index) => (
                <div key={index} className="rounded-3xl border border-stone-200 bg-stone-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-stone-900">{txt.player} {index + 1}</p>
                    {player.isSpy ? (
                      <p className="text-sm text-red-600 font-semibold">{txt.spy}</p>
                    ) : (
                      <>
                        <p className="text-sm text-stone-700">{txt.location}: {player.location}</p>
                        <p className="text-sm text-stone-700">{txt.role}: {player.role}</p>
                      </>
                    )}
                  </div>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${player.isSpy ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {player.isSpy ? txt.spy : txt.civilian}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
