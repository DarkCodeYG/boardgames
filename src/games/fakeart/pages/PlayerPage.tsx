import { useEffect, useState, useRef } from 'react';
import GameEndedModal from '../../../components/GameEndedModal';
import { I18N } from '../lib/i18n';
import type { Lang } from '../lib/types';
import { resolveGame } from '../lib/game-engine';
import {
  subscribeFakeartRoom,
  joinFakeartRoom,
  submitVote,
  submitFakeGuess,
} from '../lib/firebase-room';
import type { RoomState } from '../lib/types';
import { sfxClick, sfxRoleReveal, sfxVictory } from '../../../lib/sound';
import { PLAYER_COLORS } from '../lib/constants';

type PlayerView = 'join' | 'waiting' | 'role' | 'roleConfirmed' | 'drawing' | 'voting' | 'guess' | 'result';

export default function PlayerPage() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('room') ?? '';
  const urlLang = params.get('lang') as Lang | null;

  const [myName, setMyName] = useState('');
  const [playerIndex, setPlayerIndex] = useState(-1);
  const [view, setView] = useState<PlayerView>('join');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteAbstained, setVoteAbstained] = useState(false);
  const [voteTimeLeft, setVoteTimeLeft] = useState(60);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const resultSoundPlayedRef = useRef(false);
  const roleSoundPlayedRef = useRef(false);
  const autoReconnectAttempted = useRef(false);
  const roomNullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasReceivedRoomRef = useRef(false);
  const [roomEndedByHost, setRoomEndedByHost] = useState(false);

  // Firebase 구독 (null 오탐지 방지: 3초 디바운스 후 게임 종료 처리)
  useEffect(() => {
    if (!roomCode) return;
    return subscribeFakeartRoom(roomCode, (state) => {
      if (state !== null) {
        hasReceivedRoomRef.current = true;
        if (roomNullTimerRef.current) {
          clearTimeout(roomNullTimerRef.current);
          roomNullTimerRef.current = null;
        }
        setRoomState(state);
      } else if (hasReceivedRoomRef.current && playerIndex !== -1) {
        if (!roomNullTimerRef.current) {
          roomNullTimerRef.current = setTimeout(() => setRoomEndedByHost(true), 3000);
        }
      } else {
        setRoomState(state);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // 자동 재접속: sessionStorage(탭 독립) → 새로고침 복구 / localStorage → 이름 pre-fill만
  useEffect(() => {
    if (!roomCode || autoReconnectAttempted.current) return;
    autoReconnectAttempted.current = true;

    // sessionStorage: 이 탭에서 직접 참가한 경우만 자동 재접속 (새 탭·새 스캔은 빈 sessionStorage)
    const sessionRaw = sessionStorage.getItem(`fakeart_session_${roomCode}`);
    if (sessionRaw) {
      try {
        const { name: sName, deviceToken: sToken } = JSON.parse(sessionRaw) as { name: string; deviceToken: string };
        if (sName && sToken) {
          setNameInput(sName);
          joinFakeartRoom(roomCode, sName, sToken).then((result) => {
            if ('error' in result || !result.reconnect) return;
            setMyName(sName);
            setPlayerIndex(result.index);
            setView('waiting');
          }).catch(() => {});
          return; // sessionStorage로 처리, localStorage 체크 불필요
        }
      } catch { /* ignore */ }
    }

    // localStorage: 이름 pre-fill만 (join 화면 유지)
    const localRaw = localStorage.getItem(`fakeart_name_${roomCode}`);
    if (!localRaw) return;
    try {
      const { name: savedName } = JSON.parse(localRaw) as { name: string };
      if (savedName) setNameInput(savedName);
    } catch {
      setNameInput(localRaw); // 구버전 단순 문자열 호환
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // phase 변화 감지 → view 전환
  useEffect(() => {
    if (!roomState || view === 'join') return;
    const phase = roomState.phase;
    if (phase === 'lobby') {
      setView('waiting');
      roleSoundPlayedRef.current = false;
      resultSoundPlayedRef.current = false;
      setHasVoted(false);
      setVoteAbstained(false);
      setHasGuessed(false);
    } else if ((phase === 'roles' || phase === 'drawing') && view === 'waiting') {
      setView('role');
    } else if (phase === 'drawing' && view === 'roleConfirmed') {
      setView('drawing');
    } else if (phase === 'drawing' && view !== 'role' && view !== 'drawing' && view !== 'roleConfirmed') {
      setView('drawing');
    } else if (phase === 'voting' && view !== 'voting') {
      setView('voting');
    } else if (phase === 'guess' && view !== 'guess') {
      setView('guess');
    } else if (phase === 'result') {
      setView('result');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.phase, view === 'join']);

  // lang: roomState 우선, 없으면 URL params, 없으면 ko
  const lang = (roomState?.lang ?? (urlLang && ['ko','en','zh'].includes(urlLang) ? urlLang : 'ko')) as Lang;
  const txt = I18N[lang];

  const playersByIndex = Object.entries(roomState?.players || {})
    .sort((a, b) => a[1].index - b[1].index)
    .map(([name]) => name);
  const playerName = (idx: number) => playersByIndex[idx] ?? `P${idx + 1}`;

  // 역할 계산 (playerIndex와 roomState 모두 있을 때)
  const resolved =
    roomState?.seed && roomState?.playerCount && playerIndex >= 0
      ? resolveGame(roomState.seed, roomState.playerCount, roomState.pack)
      : null;
  const topic = resolved?.topic ?? null;
  const fakeIndex = resolved?.fakeIndex ?? -1;
  const drawOrder = resolved?.drawOrder ?? ([] as number[]);
  const isFake = playerIndex >= 0 && playerIndex === fakeIndex;

  // 역할 공개 효과음
  useEffect(() => {
    if (view === 'role' && !roleSoundPlayedRef.current) {
      roleSoundPlayedRef.current = true;
      sfxRoleReveal();
    }
  }, [view]);

  // 결과 효과음
  useEffect(() => {
    if (view === 'result' && roomState && !resultSoundPlayedRef.current) {
      resultSoundPlayedRef.current = true;
      sfxVictory();
    }
  }, [view, roomState]);

  // 투표 단계 진입 시 타이머 리셋 (재접속 동기화: votingStartedAt 기준 잔여 시간 계산)
  useEffect(() => {
    if (view !== 'voting') return;
    const startedAt = roomState?.votingStartedAt;
    // Math.ceil로 잔여 시간 계산 → 재접속 시 witnesses와 동일한 방식으로 동기화
    const remaining = startedAt ? Math.max(0, Math.ceil((startedAt + 60000 - Date.now()) / 1000)) : 60;
    setVoteTimeLeft(remaining);
    setVoteAbstained(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, roomState?.votingStartedAt]);

  // 투표 카운트다운 (1초마다)
  useEffect(() => {
    if (view !== 'voting' || hasVoted || voteTimeLeft <= 0) return;
    const id = setTimeout(() => setVoteTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [view, hasVoted, voteTimeLeft]);

  // 시간 초과 → 자동 기권 (-1 제출)
  useEffect(() => {
    if (view !== 'voting' || hasVoted || voteTimeLeft !== 0 || playerIndex < 0) return;
    submitVote(roomCode, playerIndex, -1).catch(console.error);
    setHasVoted(true);
    setVoteAbstained(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, hasVoted, voteTimeLeft]);

  // 이름 배너 (join 제외 모든 화면 상단 고정)
  const NameBanner = () => {
    if (!myName || view === 'join') return null;
    return (
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-stone-200 py-2 px-4 flex items-center justify-center gap-2 z-50">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
        <span className="font-bold text-stone-800 text-sm">{myName}</span>
      </div>
    );
  };

  const handleJoin = async () => {
    if (!nameInput.trim() || joining) return;
    setJoining(true);
    setJoinError('');
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      const result = await Promise.race([joinFakeartRoom(roomCode, nameInput.trim()), timeout]);
      if ('error' in result) {
        const msg =
          result.error === 'not_found'
            ? txt.roomNotFound
            : txt.gameAlreadyStarted;
        setJoinError(msg);
        setJoining(false);
        return;
      }
      setMyName(nameInput.trim());
      setPlayerIndex(result.index);
      const sessionData = JSON.stringify({ name: nameInput.trim(), deviceToken: result.deviceToken });
      sessionStorage.setItem(`fakeart_session_${roomCode}`, sessionData);
      localStorage.setItem(`fakeart_name_${roomCode}`, JSON.stringify({ name: nameInput.trim(), deviceToken: result.deviceToken }));
      const currentPhase = roomState?.phase ?? 'lobby';
      if (currentPhase === 'lobby') {
        setView('waiting');
      } else if (currentPhase === 'drawing') {
        setView('role');
      } else if (currentPhase === 'voting') {
        setView('voting');
      } else if (currentPhase === 'guess') {
        setView('guess');
      } else if (currentPhase === 'result') {
        setView('result');
      } else {
        setView('waiting');
      }
    } catch {
      setJoinError(txt.connectionError);
      setJoining(false);
    }
  };

  const handleProceedFromRole = () => {
    sfxClick();
    if (!roomState) {
      setView('roleConfirmed');
      return;
    }
    const phase = roomState.phase;
    if (phase === 'roles') setView('roleConfirmed');
    else if (phase === 'drawing') setView('drawing');
    else if (phase === 'voting') setView('voting');
    else if (phase === 'guess') setView('guess');
    else if (phase === 'result') setView('result');
    else setView('roleConfirmed');
  };

  const handleVote = async (accusedIdx: number) => {
    sfxClick();
    await submitVote(roomCode, playerIndex, accusedIdx);
    setHasVoted(true);
  };

  const handleSubmitGuess = async () => {
    if (!guessInput.trim()) return;
    sfxClick();
    await submitFakeGuess(roomCode, guessInput.trim());
    setHasGuessed(true);
  };

  // ===== 게임 종료 (호스트가 방을 닫음, 3초 디바운스 후) =====
  if (roomEndedByHost) {
    return <GameEndedModal emoji="🎨" title={txt.gameEnded} closeLabel={txt.closeTab} closeHint={txt.closeTabHint} />;
  }

  // ===== JOIN =====
  if (view === 'join') {
    return (
      <div className="min-h-dvh flex flex-col bg-stone-100">
        {/* 좌상단 홈 링크 */}
        <div className="p-4">
          <a
            href="/"
            className="text-stone-400 hover:text-stone-600 text-sm font-bold"
          >
            ← 홈
          </a>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-8xl mb-4">🎨</div>
          <h1 className="text-3xl font-black text-stone-800 mb-2">{txt.title}</h1>
          <p className="text-stone-500 mb-6">{txt.enterName}</p>
          <input
            type="text"
            maxLength={10}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder={txt.namePlaceholder}
            className="w-full max-w-xs border-2 border-stone-300 rounded-xl px-4 py-3 text-xl text-center font-bold mb-3 focus:border-amber-500 outline-none bg-white"
            autoFocus
          />
          {joinError && <p className="text-red-500 text-sm mb-3">{joinError}</p>}
          <button
            onClick={handleJoin}
            disabled={!nameInput.trim() || joining}
            className="w-full max-w-xs bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-50 hover:bg-stone-700 active:scale-95 transition-all"
          >
            {joining ? '...' : txt.joinRoom}
          </button>
        </div>
      </div>
    );
  }

  // ===== WAITING =====
  if (view === 'waiting') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6 text-center">
        <NameBanner />
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-black text-stone-800 mb-2">{txt.waitingForHost}</h2>
        <p className="text-stone-400 text-sm mt-2">
          {Object.keys(roomState?.players ?? {}).length}{txt.playersJoined}
        </p>
      </div>
    );
  }

  // ===== ROLE (drawing phase 진입 시 역할 공개) =====
  if (view === 'role') {
    if (!topic) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-stone-100">
          <div className="animate-spin w-10 h-10 border-4 border-stone-300 border-t-stone-800 rounded-full" />
        </div>
      );
    }

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <NameBanner />
        <div className="rounded-2xl p-8 max-w-xs w-full text-center shadow-xl bg-white">
          {/* 역할 배지 */}
          <div className="flex justify-center mb-3">
            {isFake ? (
              <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-black px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                {txt.fakeArtist}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {txt.realArtist}
              </span>
            )}
          </div>

          <div className="text-5xl mb-3">{isFake ? '🎭' : '🎨'}</div>

          {isFake ? (
            <>
              <h2 className="text-2xl font-black text-stone-800 mb-2">{txt.youAreFake}</h2>
              <div className="bg-stone-50 rounded-xl p-4 mb-4">
                <p className="text-stone-500 text-sm font-bold">{txt.categoryLabel}</p>
                <p className="text-stone-800 text-xl font-black">{topic.category[lang]}</p>
              </div>
              <p className="text-stone-500 text-sm mb-4">{txt.fakeNoWord}</p>
              <p className="text-stone-600 text-sm font-bold mb-6">{txt.fakeHint}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-stone-800 mb-2">{txt.youAreReal}</h2>
              <div className="bg-stone-50 rounded-xl p-4 mb-4">
                <p className="text-stone-500 text-sm font-bold">{txt.categoryLabel}</p>
                <p className="text-stone-800 text-xl font-black">{topic.category[lang]}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="text-amber-600 text-sm font-bold">{txt.yourWordIs}</p>
                <p className="text-amber-800 text-2xl font-black">{topic.word[lang]}</p>
              </div>
            </>
          )}

          <p className="text-xs text-stone-400 mb-4">
            {isFake ? '' : txt.hideFromOthers}
          </p>

          <button
            onClick={handleProceedFromRole}
            className="w-full bg-stone-800 text-white font-black py-3 rounded-2xl active:scale-95 transition-all hover:bg-stone-700"
          >
            {txt.confirmBtn}
          </button>
        </div>
      </div>
    );
  }

  // ===== ROLE CONFIRMED =====
  if (view === 'roleConfirmed') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6 text-center">
        <NameBanner />
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-stone-800 mb-2">{txt.roleConfirmedTitle}</h2>
        <p className="text-stone-500">{txt.waitingDrawStart}</p>
      </div>
    );
  }

  // ===== DRAWING =====
  if (view === 'drawing' && roomState) {
    const currentDrawerPlayerIndex = drawOrder[roomState.currentDrawerIndex] ?? 0;
    const isMyTurn = currentDrawerPlayerIndex === playerIndex;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6 pt-16 gap-3 overflow-y-auto">
        <NameBanner />

        {/* 그림 진행 상황 미리보기 (턴 교체 시마다 갱신) */}
        {roomState.canvasImage && (
          <div className="bg-white rounded-2xl p-3 max-w-xs w-full shadow-md">
            <img
              src={roomState.canvasImage}
              alt="drawing progress"
              className="w-full max-h-48 object-contain rounded-xl border border-stone-200 mb-2"
            />
            <div className="flex flex-wrap gap-1 justify-center">
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

        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          {isMyTurn ? (
            <>
              <div className="text-4xl mb-3">✏️</div>
              <h2 className="text-xl font-black text-stone-800 mb-2">{txt.yourTurn}</h2>
              <p className="text-stone-500 text-sm">{txt.drawingPhase}</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">⏳</div>
              <h2 className="text-lg font-bold text-stone-700 mb-2">
                {txt.isDrawingNow(playerName(currentDrawerPlayerIndex))}
              </h2>
              <p className="text-stone-400 text-sm">{txt.drawingInProgress}</p>
            </>
          )}
          <div className="mt-4 flex gap-1 justify-center flex-wrap">
            {drawOrder.map((pidx, oidx) => (
              <span
                key={oidx}
                className={`px-2 py-1 rounded-full text-xs font-bold flex items-center justify-center ${
                  oidx < roomState.currentDrawerIndex
                    ? 'bg-stone-200 text-stone-400'
                    : oidx === roomState.currentDrawerIndex
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {playerName(pidx)}
              </span>
            ))}
          </div>

          {/* 제시어 다시보기 */}
          {topic && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-stone-400 font-bold cursor-pointer select-none text-center">
                {txt.reviewWordBtn}
              </summary>
              <div className="mt-3 bg-stone-50 rounded-xl p-3">
                {isFake ? (
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-black px-2 py-0.5 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" /> {txt.fakeArtist}
                    </span>
                    <p className="text-stone-500 text-sm">{topic.category[lang]}</p>
                    <p className="text-stone-400 text-xs mt-1">{txt.fakeNoWord}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-stone-400 text-xs font-bold">{txt.categoryLabel}: {topic.category[lang]}</p>
                    <p className="text-amber-700 text-lg font-black mt-1">{topic.word[lang]}</p>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // ===== VOTING =====
  if (view === 'voting') {
    const playerCount = roomState?.playerCount ?? 0;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <NameBanner />
        {/* 완성된 그림 + 색상 범례 */}
        {roomState?.canvasImage && (
          <div className="bg-white rounded-2xl p-3 max-w-xs w-full shadow-lg mb-3">
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

        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <div className="text-4xl mb-3">🗳️</div>
          <h2 className="text-xl font-black text-stone-800 mb-2">{txt.voting}</h2>
          <p className="text-stone-500 text-sm mb-3">{txt.voteWho}</p>

          {!hasVoted && (
            <div className="mb-4">
              <div className="flex items-center justify-end mb-1">
                <span className={`font-black text-base tabular-nums ${
                  voteTimeLeft > 30 ? 'text-green-600' : voteTimeLeft > 15 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {txt.voteTimerLabel(voteTimeLeft)}
                </span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    voteTimeLeft > 30 ? 'bg-green-500' : voteTimeLeft > 15 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(voteTimeLeft / 60) * 100}%` }}
                />
              </div>
            </div>
          )}

          {hasVoted ? (
            <p className={`font-black text-lg ${voteAbstained ? 'text-orange-500' : 'text-green-600'}`}>
              {voteAbstained ? txt.voteAbstained : txt.alreadyVoted}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: playerCount }, (_, i) => {
                if (i === playerIndex) return null;
                return (
                  <button
                    key={i}
                    onClick={() => handleVote(i)}
                    className="bg-stone-800 text-white font-bold py-3 rounded-xl
                               hover:bg-stone-700 active:scale-95 transition-all"
                  >
                    {txt.voteButton(playerName(i))}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== GUESS =====
  if (view === 'guess') {
    if (isFake) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
          <NameBanner />
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
            <div className="text-4xl mb-3">🎭</div>
            <h2 className="text-xl font-black text-stone-800 mb-2">{txt.guessYourWord}</h2>
            <p className="text-stone-500 text-sm mb-4">
              {txt.category}: {topic?.category[lang]}
            </p>

            {hasGuessed ? (
              <p className="text-green-600 font-black">{txt.waitingForResult}</p>
            ) : (
              <>
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitGuess()}
                  placeholder={txt.guessPlaceholder}
                  className="w-full border-2 border-stone-300 rounded-xl px-3 py-3 text-center font-bold text-lg
                             focus:outline-none focus:border-stone-500 mb-3"
                  autoFocus
                />
                <button
                  onClick={handleSubmitGuess}
                  disabled={!guessInput.trim()}
                  className="w-full bg-purple-600 text-white font-black py-3 rounded-2xl
                             hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-40"
                >
                  {txt.submitGuess}
                </button>
              </>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
          <NameBanner />
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
            <div className="text-4xl mb-3">⏳</div>
            <h2 className="text-lg font-bold text-stone-700">{txt.guessing}</h2>
          </div>
        </div>
      );
    }
  }

  // ===== RESULT =====
  if (view === 'result' && roomState) {
    const isFakeWin = roomState.winner === 'fake';
    const iWon = isFake ? isFakeWin : !isFakeWin;

    return (
      <div
        className={`min-h-dvh flex flex-col items-center justify-center p-6 ${
          isFakeWin ? 'bg-purple-600' : 'bg-amber-500'
        }`}
      >
        <NameBanner />
        <div className="text-center max-w-xs w-full">
          <div className="text-6xl mb-3">{isFakeWin ? '🎭' : '🔍'}</div>
          <h1 className="text-3xl font-black text-white mb-2">
            {isFakeWin ? txt.fakeWins : txt.othersWin}
          </h1>
          <p className={`text-lg font-black mb-4 ${iWon ? 'text-yellow-200' : 'text-white/70'}`}>
            {iWon ? '🏆 WIN!' : '😢 LOSE'}
          </p>

          {/* 완성된 그림 + 색상 범례 */}
          {roomState.canvasImage && (
            <div className="bg-white/20 rounded-2xl p-3 mb-4">
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

          <div className="bg-white/20 rounded-2xl p-4 text-left space-y-3 mb-6">
            {topic && (
              <>
                <div>
                  <p className="text-white/60 text-xs font-bold">{txt.category}</p>
                  <p className="text-white font-black">{topic.category[lang]}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-bold">{txt.theWord}</p>
                  <p className="text-white text-xl font-black">{topic.word[lang]}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-white/60 text-xs font-bold">{txt.theFake}</p>
              <p className="text-white font-black">{playerName(fakeIndex)}</p>
            </div>
            {roomState.fakeGuess && (
              <div>
                <p className="text-white/60 text-xs font-bold">{txt.guessPlaceholder}</p>
                <p className="text-white font-bold">"{roomState.fakeGuess}"</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              roleSoundPlayedRef.current = false;
              resultSoundPlayedRef.current = false;
              setHasVoted(false);
              setHasGuessed(false);
              setView('waiting');
            }}
            className="w-full bg-white text-stone-800 font-black py-3 rounded-2xl
                       hover:bg-stone-100 active:scale-95 transition-all"
          >
            {txt.playAgain}
          </button>
        </div>
      </div>
    );
  }

  // 로딩 / fallback
  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-100">
      <div className="animate-spin w-10 h-10 border-4 border-stone-300 border-t-stone-800 rounded-full" />
    </div>
  );
}
