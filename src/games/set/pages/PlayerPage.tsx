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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasReceivedRoomRef = useRef(false);
  const roomNullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setView('waiting');
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
      <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🃏</div>
            <h1 className="text-3xl font-black text-stone-800">{txt.title}</h1>
            {roomCode && (
              <p className="text-2xl font-black text-amber-600 mt-2 tracking-widest">{roomCode}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            <label className="text-sm font-bold text-stone-600 block mb-2">{txt.yourName}</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder={txt.enterName}
              maxLength={20}
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-lg font-bold
                         focus:outline-none focus:border-stone-500 mb-4"
              autoFocus
            />
            {joinError && <p className="text-red-500 text-sm font-bold mb-3">{joinError}</p>}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-stone-800 text-white font-black py-4 rounded-xl text-lg
                         hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50"
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
      <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🃏</div>
          <h2 className="text-2xl font-black text-stone-800 mb-2">{myName}</h2>
          <p className="text-stone-500">{txt.waitingToStart}</p>
          <div className="mt-6 flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
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
    const timerColor = timeLeft <= 3 ? 'text-red-500' : timeLeft <= 6 ? 'text-amber-500' : 'text-stone-600';

    return (
      <div className="min-h-dvh bg-stone-50 flex flex-col select-none">
        {/* Name banner */}
        <div className="bg-stone-800 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <span className="font-black text-lg">{myName}</span>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xl font-black">{myCards}</div>
              <div className="text-xs text-stone-400">{txt.cardsLabel}</div>
            </div>
            {myBonus > 0 && (
              <div className="text-center">
                <div className="text-xl font-black text-amber-400">+{myBonus}</div>
                <div className="text-xs text-stone-400">{txt.bonusLabel}</div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="px-5 py-4 shrink-0">
          {!hasTurn && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
              <p className="text-green-700 font-bold text-sm">준비 완료! 셋이 보이면 버튼을 누르세요</p>
            </div>
          )}
          {isMySetTurn && (
            <div className="bg-orange-100 border-2 border-orange-400 rounded-xl px-4 py-3 text-center">
              <p className="font-black text-orange-700">{txt.yourTurnSet}</p>
              <p className={`text-3xl font-black mt-1 ${timerColor}`}>{txt.timeLeft(timeLeft)}</p>
            </div>
          )}
          {isMyGyulTurn && (
            <div className="bg-blue-100 border-2 border-blue-400 rounded-xl px-4 py-3 text-center">
              <p className="font-black text-blue-700">{txt.yourTurnGyul}</p>
            </div>
          )}
          {hasTurn && !isMySetTurn && !isMyGyulTurn && turn && (
            <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-center">
              <p className="font-bold text-stone-600 text-sm">{txt.turnDeclared(turn.playerName, turn.type)}</p>
              {turn.type === 'set' && (
                <p className={`text-2xl font-black mt-1 ${timerColor}`}>{timeLeft}초</p>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-1 flex flex-col gap-4 px-5 pb-8 justify-end">
          {/* 결 button — 상단, 작게 */}
          <button
            onPointerDown={handleGyul}
            disabled={hasTurn || claimingTurn}
            className={`
              w-full py-4 rounded-2xl font-black text-xl shadow-md transition-all
              ${hasTurn || claimingTurn
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-400 active:scale-95 active:shadow-inner'}
            `}
          >
            {txt.gyulBtn}
          </button>

          {/* 셋 button — 하단, 크게 */}
          <button
            onPointerDown={handleSet}
            disabled={hasTurn || claimingTurn}
            className={`
              w-full py-16 rounded-3xl font-black text-5xl shadow-xl transition-all
              ${hasTurn || claimingTurn
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-400 active:scale-95 active:shadow-inner'}
            `}
          >
            {txt.setBtn}
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
        ${isWinner ? 'bg-gradient-to-b from-amber-500 to-amber-600' : 'bg-gradient-to-b from-stone-700 to-stone-800'}`}>
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-3">{isWinner ? '🏆' : '🃏'}</div>
          <h1 className="text-3xl font-black text-white mb-1">{txt.gameOver}</h1>
          <p className="text-white/80 mb-6">#{myRank} — {myName}</p>

          <div className="bg-white/20 rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-3 gap-2 text-white">
              <div>
                <div className="text-3xl font-black">{myCards}</div>
                <div className="text-xs text-white/70">{txt.cardsLabel}</div>
              </div>
              <div>
                <div className="text-3xl font-black">+{myBonus}</div>
                <div className="text-xs text-white/70">{txt.bonusLabel}</div>
              </div>
              <div>
                <div className="text-3xl font-black">{myTotal}</div>
                <div className="text-xs text-white/70">{txt.totalLabel}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4">
            {sortedPlayers.map((p, idx) => (
              <div key={p.name}
                className={`flex items-center justify-between py-2 border-b border-white/10 last:border-0
                  ${p.name === myName ? 'text-amber-300' : 'text-white'}`}>
                <span className="font-bold">{idx + 1}. {p.name}</span>
                <span className="font-black">{p.cards + p.bonus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-100">
      <div className="animate-spin w-10 h-10 border-4 border-stone-300 border-t-stone-800 rounded-full" />
    </div>
  );
}
