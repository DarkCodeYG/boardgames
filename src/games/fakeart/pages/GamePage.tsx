import { useEffect, useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../../codenames/store/game-store';
import { useFakeartStore } from '../store/game-store';
import { I18N } from '../lib/i18n';
import { resolveGame, getAccused, generateSeed } from '../lib/game-engine';
import {
  subscribeFakeartRoom,
  updateFakeartRoom,
  setWinner,
  resetFakeartRoomForNewGame,
} from '../lib/firebase-room';
import type { RoomState } from '../lib/types';
import DrawCanvas from '../components/DrawCanvas';
import { sfxClick, sfxGameStart, sfxVictory, sfxDefeat, sfxTimerTick, sfxTimerUp, sfxRoleReveal } from '../../../lib/sound';
import { PLAYER_COLORS } from '../lib/constants';

interface GamePageProps {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: GamePageProps) {
  const globalLang = useGameStore((s) => s.lang);
  const { roomCode, pack, lang: storeLang, drawTime } = useFakeartStore();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [timer, setTimer] = useState(drawTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processedVotesRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lang = ((roomState?.lang ?? storeLang ?? globalLang) || 'ko') as NonNullable<typeof storeLang>;
  const txt = I18N[lang];

  // 게임 시작 후 freeze된 playerCount와 seed를 roomState에서 가져옴
  const playerCount = roomState?.playerCount ?? 0;
  const seed = roomState?.seed ?? '';

  const resolved = seed && playerCount > 0
    ? resolveGame(seed, playerCount, pack)
    : null;

  const { topic, fakeIndex, drawOrder } = resolved ?? { topic: null, fakeIndex: -1, drawOrder: [] as number[] };

  const playersByIndex = Object.entries(roomState?.players || {})
    .sort((a, b) => a[1].index - b[1].index)
    .map(([name]) => name);
  const playerName = (idx: number) => playersByIndex[idx] ?? `P${idx + 1}`;

  // Firebase 구독
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeFakeartRoom(roomCode, (state) => {
      setRoomState(state);
    });
    return unsub;
  }, [roomCode]);

  // 타이머 (drawing 단계)
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(drawTime);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        if (prev <= 10) sfxTimerTick();
        return prev - 1;
      });
    }, 1000);
  }, [drawTime]);

  // 타이머 0 → 자동 다음 차례
  useEffect(() => {
    if (timer === 0 && roomState?.phase === 'drawing') {
      handleNextTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, roomState?.phase]);

  useEffect(() => {
    if (roomState?.phase === 'drawing') {
      startTimer();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.phase, roomState?.currentDrawerIndex]);

  // 투표 완료 자동 처리 (phase 변경 시 ref 초기화 포함)
  useEffect(() => {
    if (!roomState || roomState.phase !== 'voting') {
      processedVotesRef.current = false;
      return;
    }
    const voteCount = Object.keys(roomState.votes || {}).length;
    if (voteCount < roomState.playerCount) return;
    if (processedVotesRef.current) return;
    processedVotesRef.current = true;

    const accused = getAccused(roomState.votes);
    if (accused === null) {
      // 동률 → 가짜 승리
      sfxVictory();
      setWinner(roomCode, 'fake').catch(console.error);
    } else if (accused === fakeIndex) {
      // 가짜 지목 → guess 단계
      sfxRoleReveal();
      updateFakeartRoom(roomCode, { phase: 'guess' }).catch(console.error);
    } else {
      // 엉뚱한 사람 지목 → 가짜 승리
      sfxVictory();
      setWinner(roomCode, 'fake').catch(console.error);
    }
  }, [roomState, fakeIndex, roomCode]);

  const handleStartDrawing = async () => {
    if (!roomState) return;
    const currentPlayers = roomState.players || {};
    const count = Object.keys(currentPlayers).length;
    if (count < 4) return;
    sfxRoleReveal();
    await updateFakeartRoom(roomCode, { phase: 'roles', playerCount: count, currentDrawerIndex: 0 });
  };

  const handleBeginDrawing = async () => {
    sfxGameStart();
    await updateFakeartRoom(roomCode, { phase: 'drawing' });
  };

  const handleNextTurn = async () => {
    if (!roomState) return;
    const nextIndex = roomState.currentDrawerIndex + 1;
    if (nextIndex >= roomState.playerCount) {
      // 모두 완료 → 캔버스 캡처 후 voting
      sfxTimerUp();
      const canvas = canvasRef.current;
      const canvasImage = canvas
        ? canvas.toDataURL('image/jpeg', 0.6)
        : undefined;
      await updateFakeartRoom(roomCode, { phase: 'voting', ...(canvasImage ? { canvasImage } : {}) });
    } else {
      sfxClick();
      await updateFakeartRoom(roomCode, { currentDrawerIndex: nextIndex });
    }
  };

  const handleGuessResult = async (correct: boolean) => {
    sfxClick();
    if (correct) {
      sfxVictory();
      await setWinner(roomCode, 'fake');
    } else {
      sfxDefeat();
      await setWinner(roomCode, 'others');
    }
  };

  const handleLangChange = async (newLang: NonNullable<typeof storeLang>) => {
    sfxClick();
    await updateFakeartRoom(roomCode, { lang: newLang });
  };

  const LangToggle = () => (
    <div className="flex gap-0.5 bg-stone-200 rounded-lg p-0.5">
      {(['ko', 'en', 'zh'] as const).map((l) => (
        <button
          key={l}
          onClick={() => handleLangChange(l)}
          className={`px-2 py-1 rounded-md text-xs font-black transition-all ${
            lang === l ? 'bg-white text-stone-800 shadow' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const handlePlayAgain = async () => {
    sfxClick();
    await resetFakeartRoomForNewGame(roomCode, generateSeed());
  };

  if (!roomCode || !roomState) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-stone-300 border-t-stone-800 rounded-full mx-auto mb-4" />
          <p className="text-stone-500 font-bold">{txt.creatingRoom}</p>
        </div>
      </div>
    );
  }

  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const currentDrawerPlayerIndex = drawOrder[roomState.currentDrawerIndex] ?? 0;
  const voteCount = Object.keys(roomState.votes || {}).length;
  const lobbyPlayerCount = Object.keys(roomState.players || {}).length;

  // ===== LOBBY =====
  if (roomState.phase === 'lobby') {
    const qrUrl = `${origin}${pathname}?game=fakeart&room=${roomCode}&lang=${lang}`;
    const canStart = lobbyPlayerCount >= 4;

    return (
      <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { sfxClick(); onGoHome(); }} className="text-stone-500 hover:text-stone-700 font-bold text-sm">
              ← {txt.goHome}
            </button>
            <LangToggle />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-stone-800">🎨 {txt.title}</h1>
            <p className="text-5xl font-black text-amber-600 mt-3 tracking-widest">{roomCode}</p>
            <p className="text-stone-500 text-sm mt-1">{txt.roomCode}</p>
          </div>

          {/* QR 하나 */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center gap-3">
              <QRCodeSVG value={qrUrl} size={180} />
              <p className="text-xs text-stone-400 text-center">{txt.qrScanGuide}</p>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-2 px-4 rounded-xl transition-colors"
              >
                🔗 {qrUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>

          {/* 실시간 참가자 목록 */}
          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <p className="text-sm font-bold text-stone-600 mb-3">
              {lobbyPlayerCount}{txt.playersJoined}
            </p>
            {lobbyPlayerCount === 0 ? (
              <p className="text-stone-400 text-sm text-center py-2">{txt.scanQr}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(roomState.players || {})
                  .sort((a, b) => a[1].index - b[1].index)
                  .map(([name, info]) => (
                    <span
                      key={name}
                      className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-bold"
                    >
                      {info.index + 1}. {name}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStartDrawing}
            disabled={!canStart}
            className="w-full bg-stone-800 text-white text-2xl font-black py-5 rounded-2xl shadow-lg
                       hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-40"
          >
            🎨 {txt.startDrawing}
          </button>
          {!canStart && (
            <p className="text-center text-stone-400 text-sm mt-2">
              {txt.minPlayersHint(lobbyPlayerCount)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ===== ROLES =====
  if (roomState.phase === 'roles') {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-end mb-3"><LangToggle /></div>
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-3xl font-black text-stone-800 mb-2">{txt.rolesChecking}</h2>
          <p className="text-stone-500 mb-6">{txt.rolesCheckingHint}</p>

          <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
            <div className="flex flex-wrap gap-2">
              {Object.entries(roomState.players || {})
                .sort((a, b) => a[1].index - b[1].index)
                .map(([name, info]) => (
                  <span key={name} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                    {info.index + 1}. {name}
                  </span>
                ))}
            </div>
          </div>

          <button
            onClick={handleBeginDrawing}
            className="w-full bg-stone-800 text-white text-2xl font-black py-5 rounded-2xl shadow-lg
                       hover:bg-stone-700 active:scale-95 transition-all"
          >
            🎨 {txt.startDrawing}
          </button>
        </div>
      </div>
    );
  }

  // ===== DRAWING =====
  if (roomState.phase === 'drawing' && topic) {
    const isLastTurn = roomState.currentDrawerIndex >= playerCount - 1;
    const timerColor = timer <= 10 ? 'text-red-500' : timer <= 20 ? 'text-amber-500' : 'text-stone-700';
    const drawingQrUrl = `${origin}${pathname}?game=fakeart&room=${roomCode}&lang=${lang}`;

    return (
      <div className="h-dvh bg-stone-100 flex flex-col px-3 pt-3 pb-2">
        {/* 상단 정보 바 */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-stone-800">
              {txt.drawingTurn(playerName(currentDrawerPlayerIndex))}
            </span>
            <span className="text-xs text-stone-400">
              ({roomState.currentDrawerIndex + 1}/{playerCount})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-black tabular-nums ${timerColor}`}>{timer}</span>
            <button
              onClick={() => { sfxClick(); handleNextTurn(); }}
              className="bg-stone-800 text-white font-bold px-3 py-1.5 rounded-xl text-sm
                         hover:bg-stone-700 active:scale-95 transition-all"
            >
              {isLastTurn ? txt.voting : txt.nextTurn} →
            </button>
          </div>
        </div>

        {/* 캔버스 영역 — 최대 크기 */}
        <div
          className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-xl border-4 transition-colors"
          style={{ borderColor: PLAYER_COLORS[currentDrawerPlayerIndex % PLAYER_COLORS.length] }}
        >
          <DrawCanvas
            disabled={false}
            undoLabel={txt.undo}
            canvasRef={canvasRef}
            strokeColor={PLAYER_COLORS[currentDrawerPlayerIndex % PLAYER_COLORS.length]}
          />
        </div>

        {/* 그리기 순서 + QR 한 줄로 */}
        <div className="mt-2 shrink-0 flex items-center justify-between gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {drawOrder.map((playerIdx, orderIdx) => (
              <span
                key={orderIdx}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all text-white ${
                  orderIdx < roomState.currentDrawerIndex ? 'opacity-40' : ''
                }`}
                style={{
                  backgroundColor: PLAYER_COLORS[playerIdx % PLAYER_COLORS.length],
                  transform: orderIdx === roomState.currentDrawerIndex ? 'scale(1.15)' : undefined,
                  outline: orderIdx === roomState.currentDrawerIndex ? '2px solid white' : undefined,
                  outlineOffset: '1px',
                }}
              >
                {playerName(playerIdx)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LangToggle />
            <a
              href={drawingQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-black text-blue-500 underline"
            >
              {roomCode}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ===== VOTING =====
  if (roomState.phase === 'voting') {
    const voteUrl = `${window.location.origin}${window.location.pathname}?game=fakeart&room=${roomCode}&lang=${lang}`;
    const votedSet = new Set(Object.keys(roomState.votes || {}).map(Number));
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="text-center max-w-md w-full">
          <div className="flex justify-end mb-3"><LangToggle /></div>
          <div className="text-6xl mb-4">🗳️</div>
          <h2 className="text-3xl font-black text-stone-800 mb-2">{txt.voting}</h2>
          <p className="text-stone-500 mb-4">{txt.voteWho}</p>

          {/* 완성된 그림 + 색상 범례 */}
          {roomState.canvasImage && (
            <div className="bg-white rounded-2xl p-3 shadow-md mb-4">
              <img
                src={roomState.canvasImage}
                alt="completed drawing"
                className="w-full rounded-xl border border-stone-200 mb-3"
              />
              <div className="flex flex-wrap gap-1.5 justify-center">
                {playersByIndex.map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-md mb-4">
            <p className="text-lg font-bold text-stone-700 mb-3">
              {txt.waitingVotes(voteCount, playerCount)}
            </p>
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {Array.from({ length: playerCount }, (_, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    votedSet.has(i)
                      ? 'bg-green-200 text-green-800'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {playerName(i)}
                </span>
              ))}
            </div>

            {/* 투표 재접속 QR */}
            <div className="border-t border-stone-100 pt-4">
              <p className="text-xs text-stone-400 mb-2">{txt.lostLink}</p>
              <QRCodeSVG value={voteUrl} size={100} className="mx-auto mb-2" />
              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono font-black text-blue-500 underline"
              >
                {roomCode}
              </a>
            </div>
          </div>

          <p className="text-stone-400 text-sm">{txt.waitingForVotes}</p>
        </div>
      </div>
    );
  }

  // ===== GUESS =====
  if (roomState.phase === 'guess' && topic) {
    const hasGuess = roomState.fakeGuess && roomState.fakeGuess.length > 0;
    const accused = getAccused(roomState.votes);

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="text-center max-w-md w-full">
          <div className="flex justify-end mb-3"><LangToggle /></div>
          <div className="text-5xl mb-4">🎭</div>
          {accused !== null && (
            <p className="text-lg text-stone-600 mb-2">{txt.accusedIs(playerName(accused))}</p>
          )}
          <h2 className="text-2xl font-black text-stone-800 mb-6">{txt.guessing}</h2>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            {!hasGuess ? (
              <p className="text-stone-400 font-bold animate-pulse">{txt.waitingForGuess}</p>
            ) : (
              <div>
                <p className="text-stone-600 mb-4">{txt.guessSubmitted(roomState.fakeGuess)}</p>
                <p className="text-stone-600 font-bold mb-4">
                  {txt.theWord}: <span className="text-amber-600">{topic.word[lang]}</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleGuessResult(true)}
                    className="bg-green-500 text-white font-black px-6 py-3 rounded-xl text-lg
                               hover:bg-green-600 active:scale-95 transition-all"
                  >
                    ✅ {txt.correct}
                  </button>
                  <button
                    onClick={() => handleGuessResult(false)}
                    className="bg-red-500 text-white font-black px-6 py-3 rounded-xl text-lg
                               hover:bg-red-600 active:scale-95 transition-all"
                  >
                    ❌ {txt.wrong}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== RESULT =====
  if (roomState.phase === 'result' && topic) {
    const isFakeWin = roomState.winner === 'fake';
    const accused = getAccused(roomState.votes);

    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center p-6 ${isFakeWin ? 'bg-purple-600' : 'bg-amber-500'}`}>
        <div className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">{isFakeWin ? '🎭' : '🔍'}</div>
          <h1 className="text-4xl font-black text-white mb-2">
            {isFakeWin ? txt.fakeWins : txt.othersWin}
          </h1>

          {accused === null && (
            <p className="text-white/80 mb-4">{txt.noVoteTie}</p>
          )}
          {accused !== null && accused !== fakeIndex && (
            <p className="text-white/80 mb-4">{txt.wrongAccused}</p>
          )}

          {/* 완성된 그림 + 색상 범례 */}
          {roomState.canvasImage && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 mt-4">
              <img
                src={roomState.canvasImage}
                alt="completed drawing"
                className="w-full rounded-xl mb-3"
              />
              <div className="flex flex-wrap gap-1.5 justify-center">
                {playersByIndex.map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mt-4 text-left space-y-3">
            <div>
              <p className="text-white/70 text-sm font-bold">{txt.category}</p>
              <p className="text-white text-xl font-black">{topic.category[lang]}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm font-bold">{txt.theWord}</p>
              <p className="text-white text-2xl font-black">{topic.word[lang]}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm font-bold">{txt.theFake}</p>
              <p className="text-white text-xl font-black">{playerName(fakeIndex)}</p>
            </div>
            {roomState.fakeGuess && (
              <div>
                <p className="text-white/70 text-sm font-bold">{txt.guessPlaceholder}</p>
                <p className="text-white text-lg font-bold">"{roomState.fakeGuess}"</p>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-4"><LangToggle /></div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePlayAgain}
              className="flex-1 bg-white text-stone-800 font-black py-3 rounded-2xl
                         hover:bg-stone-100 active:scale-95 transition-all"
            >
              {txt.playAgain}
            </button>
            <button
              onClick={() => { sfxClick(); onGoHome(); }}
              className="flex-1 bg-white/20 text-white font-black py-3 rounded-2xl
                         hover:bg-white/30 active:scale-95 transition-all"
            >
              {txt.goHome}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // fallback
  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-100">
      <div className="animate-spin w-10 h-10 border-4 border-stone-300 border-t-stone-800 rounded-full" />
    </div>
  );
}
