import { useEffect, useState, useRef } from 'react';
import GameEndedModal from '../../../components/GameEndedModal';
import { I18N } from '../lib/i18n';
import { subscribeSetRoom, joinSetRoom, claimTurn, sanitizeName } from '../lib/firebase-set';
import type { SetRoomState, Lang } from '../lib/types';
import { sfxClick, sfxTimerTick } from '../../../lib/sound';

const SET_TIMEOUT_SECS = 10;
const STORAGE_KEY = (code: string) => `set_name_${code}`;

type PlayerView = 'join' | 'waiting' | 'playing' | 'ended';

export default function PlayerPage() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('room') ?? '';
  const urlLang = params.get('lang') as Lang | null;

  const [myName, setMyName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [view, setView] = useState<PlayerView>('join');
  const [roomState, setRoomState] = useState<SetRoomState | null>(null);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [claimingTurn, setClaimingTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SET_TIMEOUT_SECS);
  const [roomEndedByHost, setRoomEndedByHost] = useState(false);
  const [flashResult, setFlashResult] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasReceivedRoomRef = useRef(false);
  const roomNullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResultTimestampRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lang = (urlLang || (roomState?.lang) || 'ko') as Lang;
  const txt = I18N[lang];

  // Pre-fill name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(roomCode));
    if (saved) setNameInput(saved);
  }, [roomCode]);

  // Firebase subscription
  useEffect(() => {
    if (!roomCode) return;
    return subscribeSetRoom(roomCode, (state) => {
      if (state !== null) {
        hasReceivedRoomRef.current = true;
        if (roomNullTimerRef.current) { clearTimeout(roomNullTimerRef.current); roomNullTimerRef.current = null; }
        setRoomState(state);
        if (state.phase === 'playing' && view === 'waiting') setView('playing');
        if (state.phase === 'ended') setView('ended');
      } else if (hasReceivedRoomRef.current && myName) {
        if (!roomNullTimerRef.current) {
          roomNullTimerRef.current = setTimeout(() => setRoomEndedByHost(true), 3000);
        }
      } else {
        setRoomState(state);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, myName]);

  // Phase transitions
  useEffect(() => {
    if (!roomState || !myName) return;
    if (roomState.phase === 'playing') setView('playing');
    if (roomState.phase === 'ended') setView('ended');
  }, [roomState?.phase, myName]);

  // Flash overlay when my result arrives
  useEffect(() => {
    const result = roomState?.lastResult;
    if (!result || !myName) return;
    if (lastResultTimestampRef.current === result.timestamp) return;
    if (result.playerName !== myName) return;
    lastResultTimestampRef.current = result.timestamp;

    const isCorrect = result.type === 'set_correct' || result.type === 'gyul_correct';
    setFlashResult(isCorrect ? 'correct' : 'wrong');
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashResult(null), 1800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.lastResult, myName]);

  // 10s countdown for set turns (player-side display only)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const turn = roomState?.currentTurn;
    if (!turn || turn.type !== 'set') { setTimeLeft(SET_TIMEOUT_SECS); return; }

    const elapsed = (Date.now() - turn.startedAt) / 1000;
    const initial = Math.max(0, SET_TIMEOUT_SECS - elapsed);
    setTimeLeft(Math.ceil(initial));

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        if (prev <= 4) sfxTimerTick();
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.currentTurn?.playerName, roomState?.currentTurn?.startedAt]);

  const handleJoin = async () => {
    const name = nameInput.trim();
    if (!name) { setJoinError(txt.nameRequired); return; }
    setJoinError('');
    setJoining(true);
    sfxClick();

    const result = await joinSetRoom(roomCode, name);
    setJoining(false);

    if (!result.joined) {
      if (result.error === 'not_found') setJoinError(txt.roomNotFound);
      else if (result.error === 'started') setJoinError(txt.gameAlreadyStarted);
      return;
    }

    localStorage.setItem(STORAGE_KEY(roomCode), name);
    setMyName(name);
    if (roomState?.phase === 'playing') setView('playing');
    else if (roomState?.phase === 'ended') setView('ended');
    else setView('waiting');
  };

  const handleSet = async () => {
    if (!myName || claimingTurn || roomState?.currentTurn) return;
    setClaimingTurn(true);
    sfxClick();
    await claimTurn(roomCode, myName, 'set');
    setClaimingTurn(false);
  };

  const handleGyul = async () => {
    if (!myName || claimingTurn || roomState?.currentTurn) return;
    setClaimingTurn(true);
    sfxClick();
    await claimTurn(roomCode, myName, 'gyul');
    setClaimingTurn(false);
  };

  if (roomEndedByHost) {
    return (
      <GameEndedModal
        emoji="🃏"
        title={lang === 'ko' ? '게임이 종료됐습니다' : lang === 'zh' ? '游戏已结束' : 'Game ended'}
        closeLabel={lang === 'ko' ? '탭 닫기' : lang === 'zh' ? '关闭' : 'Close tab'}
        closeHint={lang === 'ko' ? '탭을 직접 닫아주세요' : lang === 'zh' ? '请手动关闭标签页' : 'Please close this tab manually'}
      />
    );
  }

  // ===== JOIN =====
  if (view === 'join' || !myName) {
    return (
      <div className="min-h-dvh bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🃏</div>
            <h1 className="text-2xl font-black text-stone-800">{txt.title}</h1>
            {roomCode && (
              <p className="text-lg font-black text-stone-400 mt-1 tracking-[0.3em]">{roomCode}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <label className="text-xs font-semibold text-stone-400 block mb-2 tracking-widest uppercase">{txt.yourName}</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder={txt.enterName}
              maxLength={20}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-lg font-bold
                         text-stone-800 placeholder:text-stone-300
                         focus:outline-none focus:border-stone-400 transition-all mb-4"
              autoFocus
            />
            {joinError && <p className="text-red-500 text-sm font-semibold mb-3">{joinError}</p>}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-stone-800 text-white font-black py-4 rounded-xl text-lg
                         hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30"
            >
              {joining ? txt.joining : txt.join}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== WAITING =====
  if (view === 'waiting') {
    return (
      <div className="min-h-dvh bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-5">🃏</div>
          <h2 className="text-xl font-black text-stone-800 mb-2">{myName}</h2>
          <p className="text-stone-400 text-sm">{txt.waitingToStart}</p>
          <div className="mt-8 flex gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== PLAYING =====
  if (view === 'playing' && roomState) {
    const turn = roomState.currentTurn;
    const hasTurn = !!turn;
    const isMySetTurn = turn?.type === 'set' && turn.playerName === myName;
    const isMyGyulTurn = turn?.type === 'gyul' && turn.playerName === myName;
    const sanitized = sanitizeName(myName);
    const myInfo = roomState.players?.[sanitized];
    const myCards = (JSON.parse(myInfo?.collectedCards ?? '[]') as number[]).length;
    const myBonus = myInfo?.bonusPoints ?? 0;
    const timerColor = timeLeft <= 3 ? 'text-red-500' : timeLeft <= 6 ? 'text-amber-500' : 'text-stone-500';

    return (
      <div className="min-h-dvh bg-stone-50 flex flex-col select-none">
        {/* Result flash overlay */}
        {flashResult && (
          <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none
            ${flashResult === 'correct' ? 'bg-emerald-50/90' : 'bg-red-50/90'}`}>
            <div className={`text-8xl font-black mb-2
              ${flashResult === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
              {flashResult === 'correct' ? '✓' : '✗'}
            </div>
            <div className={`text-xl font-black
              ${flashResult === 'correct' ? 'text-emerald-600' : 'text-red-500'}`}>
              {flashResult === 'correct' ? txt.flashCorrect : txt.flashWrong}
            </div>
          </div>
        )}

        {/* Fixed top name banner */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-stone-100 py-3 px-4 flex items-center justify-center gap-2 z-50">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="font-semibold text-stone-700 text-sm">{myName}</span>
        </div>

        {/* Center: score */}
        <div className="flex-1 flex flex-col items-center justify-center pt-14 pb-4 px-6">
          <div className="flex items-end justify-center gap-4 mb-6">
            {/* Card stack */}
            <div className="relative">
              <div className="absolute top-2 left-2 w-32 h-44 bg-stone-200 rounded-2xl" />
              <div className="absolute top-1 left-1 w-32 h-44 bg-stone-100 rounded-2xl border border-stone-200" />
              <div className="relative w-32 h-44 bg-white rounded-2xl border border-stone-200 shadow-md flex flex-col items-center justify-center">
                <div className="text-6xl font-black text-stone-800">{myCards}</div>
                <div className="text-xs font-semibold text-stone-400 mt-1 tracking-widest uppercase">{txt.cardsLabel}</div>
              </div>
            </div>
            {/* Bonus badge */}
            {myBonus > 0 && (
              <div className="w-20 h-28 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-amber-500">+{myBonus}</div>
                <div className="text-xs font-semibold text-amber-400 mt-1 tracking-widest uppercase">{txt.bonusLabel}</div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="w-full max-w-sm">
            {!hasTurn && (
              <div className="bg-stone-100 rounded-xl px-4 py-3 text-center">
                <p className="text-stone-400 text-sm">{txt.readyHint}</p>
              </div>
            )}
            {isMySetTurn && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                <p className="font-bold text-red-600 text-sm">{txt.yourTurnSet}</p>
                <p className={`text-3xl font-black mt-1 ${timerColor}`}>{txt.timeLeft(timeLeft)}</p>
              </div>
            )}
            {isMyGyulTurn && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
                <p className="font-bold text-blue-600 text-sm">{txt.yourTurnGyul}</p>
              </div>
            )}
            {hasTurn && !isMySetTurn && !isMyGyulTurn && turn && (
              <div className="bg-stone-100 rounded-xl px-4 py-3 text-center">
                <p className="text-stone-400 text-sm">{txt.turnDeclared(turn.playerName, turn.type)}</p>
                {turn.type === 'set' && (
                  <p className={`text-2xl font-black mt-1 ${timerColor}`}>{txt.timeLeft(timeLeft)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 px-5 pb-8 shrink-0">
          {/* 결 button */}
          <button
            onPointerDown={handleGyul}
            disabled={hasTurn || claimingTurn}
            className={`
              w-full py-5 rounded-2xl font-black transition-all
              ${hasTurn || claimingTurn
                ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                : 'bg-stone-800 text-white hover:bg-stone-700 active:scale-95 shadow-sm'}
            `}
          >
            <div className="text-2xl">{txt.gyulBtn}</div>
            <div className="text-xs font-medium opacity-60 mt-0.5">{txt.gyulBtnHint}</div>
          </button>

          {/* 셋 button */}
          <button
            onPointerDown={handleSet}
            disabled={hasTurn || claimingTurn}
            className={`
              w-full py-14 rounded-3xl font-black transition-all
              ${hasTurn || claimingTurn
                ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-500 active:scale-95 shadow-md'}
            `}
          >
            <div className="text-5xl">{txt.setBtn}</div>
            <div className="text-sm font-medium opacity-70 mt-1">{txt.setBtnHint}</div>
          </button>
        </div>
      </div>
    );
  }

  // ===== ENDED =====
  if (view === 'ended' && roomState) {
    const sanitized = sanitizeName(myName);
    const myInfo = roomState.players?.[sanitized];
    const myCards = (JSON.parse(myInfo?.collectedCards ?? '[]') as number[]).length;
    const myBonus = myInfo?.bonusPoints ?? 0;
    const myTotal = myCards + myBonus;

    const sortedPlayers = Object.entries(roomState.players || {})
      .map(([, info]) => ({
        name: info.displayName,
        cards: (JSON.parse(info.collectedCards || '[]') as number[]).length,
        bonus: info.bonusPoints ?? 0,
      }))
      .sort((a, b) => (b.cards + b.bonus) - (a.cards + a.bonus));

    const myRank = sortedPlayers.findIndex((p) => p.name === myName) + 1;
    const isWinner = myRank === 1;

    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center p-6
        ${isWinner ? 'bg-amber-50' : 'bg-stone-50'}`}>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-3">{isWinner ? '🏆' : '🃏'}</div>
          <h1 className="text-2xl font-black text-stone-800 mb-1">{txt.gameOver}</h1>
          <p className="text-stone-400 text-sm mb-6">#{myRank} — {myName}</p>

          <div className="bg-white rounded-2xl p-5 mb-3 border border-stone-100 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-3xl font-black text-stone-800">{myCards}</div>
                <div className="text-xs text-stone-400 mt-1 tracking-wider uppercase">{txt.cardsLabel}</div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-500">+{myBonus}</div>
                <div className="text-xs text-stone-400 mt-1 tracking-wider uppercase">{txt.bonusLabel}</div>
              </div>
              <div>
                <div className="text-3xl font-black text-stone-800">{myTotal}</div>
                <div className="text-xs text-stone-400 mt-1 tracking-wider uppercase">{txt.totalLabel}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-2 border border-stone-100 shadow-sm">
            {sortedPlayers.map((p, idx) => (
              <div key={p.name}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl
                  ${p.name === myName ? 'bg-amber-50 text-amber-700' : 'text-stone-500'}`}>
                <span className="font-semibold text-sm">{idx + 1}. {p.name}</span>
                <span className="font-black text-stone-800">{p.cards + p.bonus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-50">
      <div className="animate-spin w-8 h-8 border-2 border-stone-200 border-t-stone-500 rounded-full" />
    </div>
  );
}
