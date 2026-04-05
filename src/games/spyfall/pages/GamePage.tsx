import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useCallback } from 'react';
import { useSpyfallStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import Timer from '../components/Timer';
import { getPlayerRole } from '../lib/game-engine';
import {
  createSpyfallRoom,
  startSpyfallRound,
  resetSpyfallToLobby,
  updateSpyfallSettings,
  subscribeSpyfallRoom,
  deleteSpyfallRoom,
  type SpyfallRoom,
} from '../lib/firebase-spyfall';
import { sfxClick, sfxModalOpen, sfxModalClose, sfxTimerUp, sfxGameStart, sfxCountUp, sfxCountDown } from '../../../lib/sound';

const TEXTS = {
  ko: {
    roomCode: '방 코드',
    scanQR: 'QR을 스캔하여 참가',
    players: '참가자',
    noPlayers: '아직 참가자가 없습니다',
    needPlayers: '라운드 시작하려면 최소 3명 필요',
    startRound: '라운드 시작!',
    minutes: '라운드 시간(분)',
    timeUp: '⏰ 시간 종료!',
    vote: '투표하여 스파이를 찾으세요!',
    newRound: '새 라운드',
    viewResults: '결과 보기',
    goHome: '홈으로',
    confirmHomeTitle: '게임 종료',
    confirmHomeMsg: '방을 삭제하고 홈으로 이동할까요?',
    resultConfirmTitle: '결과 확인',
    resultConfirmMsg: '게임이 종료되었습니까?',
    cancel: '취소',
    confirmHome: '홈으로',
    resultConfirm: '확인',
    resultTitle: '플레이어 정보',
    resultSubtitle: '각 플레이어의 장소와 역할을 확인하세요',
    close: '닫기',
    spy: '스파이',
    civilian: '스파이 아님',
    location: '장소',
    role: '역할',
    creating: '방 만드는 중...',
    player: '플레이어',
  },
  en: {
    roomCode: 'Room Code',
    scanQR: 'Scan QR to join',
    players: 'Players',
    noPlayers: 'No players yet',
    needPlayers: 'Need at least 3 players to start',
    startRound: 'Start Round!',
    minutes: 'Round (min)',
    timeUp: "⏰ Time's up!",
    vote: 'Vote to find the spy!',
    newRound: 'New Round',
    viewResults: 'View Results',
    goHome: 'Home',
    confirmHomeTitle: 'End Game',
    confirmHomeMsg: 'Delete room and go home?',
    resultConfirmTitle: 'Confirm End',
    resultConfirmMsg: 'Has the game ended?',
    cancel: 'Cancel',
    confirmHome: 'Go Home',
    resultConfirm: 'Confirm',
    resultTitle: 'Player Info',
    resultSubtitle: "Review each player's location and role",
    close: 'Close',
    spy: 'Spy',
    civilian: 'Not Spy',
    location: 'Location',
    role: 'Role',
    creating: 'Creating room...',
    player: 'Player',
  },
  zh: {
    roomCode: '房间码',
    scanQR: '扫描QR码加入',
    players: '玩家',
    noPlayers: '还没有玩家',
    needPlayers: '至少需要3名玩家才能开始',
    startRound: '开始回合！',
    minutes: '回合时间(分)',
    timeUp: '⏰ 时间到！',
    vote: '投票找出间谍！',
    newRound: '新回合',
    viewResults: '查看结果',
    goHome: '主页',
    confirmHomeTitle: '结束游戏',
    confirmHomeMsg: '删除房间并返回主页？',
    resultConfirmTitle: '确认结束',
    resultConfirmMsg: '游戏是否已经结束？',
    cancel: '取消',
    confirmHome: '返回主页',
    resultConfirm: '确认',
    resultTitle: '玩家信息',
    resultSubtitle: '查看每位玩家的地点和角色',
    close: '关闭',
    spy: '间谍',
    civilian: '非间谍',
    location: '地点',
    role: '角色',
    creating: '正在创建房间...',
    player: '玩家',
  },
};

interface GamePageProps {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: GamePageProps) {
  const { pack, roundMinutes, setRoundMinutes } = useSpyfallStore();
  const globalLang = useGameStore((s) => s.lang);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<SpyfallRoom | null>(null);
  const [createError, setCreateError] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [showResultsConfirm, setShowResultsConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    createSpyfallRoom(pack, lang, roundMinutes)
      .then((code) => {
        if (!active) return;
        setRoomCode(code);
        unsubscribe = subscribeSpyfallRoom(code, (data) => setRoom(data));
      })
      .catch((err) => {
        console.error('Failed to create spyfall room:', err);
        if (active) setCreateError(true);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const lang = (room?.lang ?? globalLang) as typeof globalLang;
  const txt = TEXTS[lang];

  const players = room?.players
    ? Object.entries(room.players).sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
    : [];
  const playerCount = players.length;

  const handleStart = async () => {
    if (!roomCode || playerCount < 3) return;
    sfxGameStart();
    setTimeUp(false);
    setShowResults(false);
    await startSpyfallRound(roomCode);
  };

  const handleNewRound = async () => {
    if (!roomCode) return;
    sfxClick();
    setTimeUp(false);
    setShowResults(false);
    await resetSpyfallToLobby(roomCode);
  };

  const handleTimeUp = useCallback(() => { sfxTimerUp(); setTimeUp(true); }, []);

  const handleGoHome = async () => {
    if (roomCode) await deleteSpyfallRoom(roomCode).catch(() => {});
    onGoHome();
  };

  const updateMinutes = (m: number) => {
    setRoundMinutes(m);
    if (roomCode) updateSpyfallSettings(roomCode, { roundMinutes: m }).catch(() => {});
  };

  const handleLangChange = (newLang: typeof globalLang) => {
    sfxClick();
    if (roomCode) updateSpyfallSettings(roomCode, { lang: newLang }).catch(() => {});
  };

  const LangToggle = () => (
    <div className="flex gap-0.5 bg-stone-200 rounded-lg p-0.5">
      {(['ko', 'en', 'zh'] as const).map((l) => (
        <button key={l} onClick={() => handleLangChange(l)}
          className={`px-2 py-1 rounded-md text-xs font-black transition-all ${
            lang === l ? 'bg-white text-stone-800 shadow' : 'text-stone-500 hover:text-stone-700'
          }`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const playerRoles = room?.seed && room.playerCount
    ? players.slice(0, room.playerCount).map(([name], i) => ({
        name,
        ...getPlayerRole(room.seed!, i, room.playerCount!, lang, pack),
      }))
    : [];

  if (createError) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-stone-100 gap-4 p-6">
        <p className="text-red-500 font-bold text-center">Firebase 연결에 실패했습니다.<br/>보안 규칙 만료 여부를 확인해주세요.</p>
        <button onClick={onGoHome} className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-700">
          {txt.goHome}
        </button>
      </div>
    );
  }

  if (!roomCode) {
    return (
      <div className="h-dvh flex items-center justify-center bg-stone-100">
        <p className="text-stone-500">{txt.creating}</p>
      </div>
    );
  }

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const joinUrl = `${baseUrl}?game=spyfall&room=${roomCode}&lang=${lang}`;

  return (
    <div className="h-dvh bg-stone-100 flex flex-col overflow-hidden">
      {/* Lobby */}
      {(!room || room.phase === 'lobby') && (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-sm mx-auto space-y-4">
            {/* 언어 토글 */}
            <div className="flex justify-end"><LangToggle /></div>

            {/* QR + Code */}
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center">
              <p className="text-xs text-stone-400 mb-3">{txt.scanQR}</p>
              <QRCodeSVG value={joinUrl} size={160} className="mb-4" />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-stone-500">{txt.roomCode}:</span>
                <span className="text-3xl font-black text-stone-800 tracking-widest">{roomCode}</span>
              </div>
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-2 px-4 rounded-xl transition-colors"
              >
                🔗 {joinUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>

            {/* Round minutes */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-stone-600 mb-2 text-center">{txt.minutes}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { sfxCountDown(); updateMinutes(Math.max(3, roundMinutes - 1)); }}
                  className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300"
                >-</button>
                <span className="text-3xl font-black w-10 text-center">{roundMinutes}</span>
                <button
                  onClick={() => { sfxCountUp(); updateMinutes(Math.min(15, roundMinutes + 1)); }}
                  className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300"
                >+</button>
              </div>
            </div>

            {/* Players list */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-stone-600 mb-2">{txt.players} ({playerCount})</p>
              {playerCount === 0 ? (
                <p className="text-stone-400 text-sm text-center py-2">{txt.noPlayers}</p>
              ) : (
                <div className="space-y-1">
                  {players.map(([name], i) => (
                    <div key={name} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-stone-400 w-5">{i + 1}</span>
                      <span className="text-stone-800 font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Start */}
            <button
              onClick={handleStart}
              disabled={playerCount < 3}
              className="w-full bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                         hover:bg-stone-700 active:scale-95 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {playerCount < 3 ? txt.needPlayers : txt.startRound}
            </button>

            <button
              onClick={() => { sfxModalOpen(); setShowHomeConfirm(true); }}
              className="w-full text-stone-400 text-sm py-2 hover:text-stone-600"
            >
              {txt.goHome}
            </button>
          </div>
        </div>
      )}

      {/* Playing */}
      {room?.phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {!timeUp ? (
            <>
              <Timer
                startedAt={room.startedAt!}
                durationMinutes={room.roundMinutes}
                onTimeUp={handleTimeUp}
              />
              <p className="text-stone-500 mt-4 text-sm">
                {room.playerCount} {txt.player} · {room.roundMinutes} min
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">⏰</div>
              <h2 className="text-3xl font-black text-red-500 mb-2">{txt.timeUp}</h2>
              <p className="text-stone-500 text-lg">{txt.vote}</p>
            </>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={handleNewRound}
              className="flex-1 bg-stone-800 text-white px-6 py-3 rounded-xl font-bold
                         hover:bg-stone-700 transition-colors"
            >
              {txt.newRound}
            </button>
            <button
              onClick={() => { sfxModalOpen(); setShowResultsConfirm(true); }}
              className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-xl font-bold
                         hover:bg-slate-600 transition-colors text-sm"
            >
              {txt.viewResults}
            </button>
            <button
              onClick={() => { sfxModalOpen(); setShowHomeConfirm(true); }}
              className="flex-1 bg-stone-200 text-stone-700 px-4 py-3 rounded-xl font-bold
                         hover:bg-stone-300 transition-colors text-sm"
            >
              {txt.goHome}
            </button>
          </div>

          <div className="mt-4"><LangToggle /></div>

          {/* 재접속 QR + 링크 */}
          <div className="mt-4 flex items-center gap-4 bg-white rounded-2xl px-5 py-3 shadow-sm">
            <QRCodeSVG value={joinUrl} size={64} />
            <div>
              <p className="text-xs text-stone-400 mb-1">링크를 잃었나요?</p>
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono font-black text-blue-500 underline"
              >
                {roomCode}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Home */}
      {showHomeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-2">{txt.confirmHomeTitle}</h3>
            <p className="text-stone-500 mb-5">{txt.confirmHomeMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { sfxModalClose(); setShowHomeConfirm(false); }}
                className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-300">
                {txt.cancel}
              </button>
              <button onClick={() => { sfxClick(); handleGoHome(); }}
                className="bg-stone-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-stone-700">
                {txt.confirmHome}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Results */}
      {showResultsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-stone-800 mb-2">{txt.resultConfirmTitle}</h3>
            <p className="text-stone-500 mb-5">{txt.resultConfirmMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { sfxModalClose(); setShowResultsConfirm(false); }}
                className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-300">
                {txt.cancel}
              </button>
              <button onClick={() => { sfxClick(); setShowResultsConfirm(false); setShowResults(true); }}
                className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-700">
                {txt.resultConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
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
                    <p className="text-base font-bold text-stone-900">{player.name}</p>
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
