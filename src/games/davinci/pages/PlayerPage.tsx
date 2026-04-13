import { useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeDavinciRoom,
  joinDavinciRoom,
  drawTile,
  skipDraw,
  confirmTilePlacement,
  submitGuess,
  setPendingGuess,
  clearPendingGuess,
  continueGuessing,
  endTurn,
  forfeitTurn,
} from '../lib/firebase-room';
import { formatTileNumber, JOKER_NUMBER, getPlacementMode } from '../lib/game-engine';
import { I18N } from '../lib/i18n';
import { DAVINCI_TILE } from '../../../lib/colors';
import Modal from '../../../components/Modal';
import { sfxClick, sfxCardFlip, sfxCorrect, sfxWrong, sfxTurnEnd, sfxModalClose, sfxVictory, sfxDefeat, sfxTimerTick } from '../../../lib/sound';

import type { RoomState, Lang, Tile } from '../lib/types';
import ResultPopup from '../components/ResultPopup';

const GUESS_TIMEOUT = 30;

export default function DavinciPlayer() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get('room') ?? '';
  const urlLang = params.get('lang') ?? 'ko';
  const lang = (['ko', 'en', 'zh'].includes(urlLang) ? urlLang : 'ko') as Lang;
  const txt = I18N[lang];

  const [name, setName] = useState(
    () => sessionStorage.getItem(`davinci_session_${roomCode}`) ?? localStorage.getItem(`davinci_name_${roomCode}`) ?? '',
  );
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ targetId: string; tileIndex: number } | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [guessTimer, setGuessTimer] = useState(GUESS_TIMEOUT);
  const [resultCountdown, setResultCountdown] = useState(10);
  const prevTurnStateRef = useRef('');
  const prevPhaseRef = useRef('');
  const isMyTurnRef = useRef(false);
  const autoEndedRef = useRef(false);
  const autoResultEndedRef = useRef(false);

  useEffect(() => {
    const sessionName = sessionStorage.getItem(`davinci_session_${roomCode}`);
    if (sessionName) doJoin(sessionName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!joined || !roomCode) return;
    return subscribeDavinciRoom(roomCode, (state) => {
      setRoom(state);

      if (state?.turnState !== prevTurnStateRef.current) {
        if (state?.turnState === 'result') {
          if (state.lastResult?.correct) sfxCorrect(); else sfxWrong();
        }
        prevTurnStateRef.current = state?.turnState ?? '';
      }

      if (state?.phase !== prevPhaseRef.current) {
        if (state?.phase === 'gameover') {
          const myName = sessionStorage.getItem(`davinci_session_${roomCode}`);
          if (state.winner === myName) sfxVictory();
          else sfxDefeat();
        }
        prevPhaseRef.current = state?.phase ?? '';
      }
    });
  }, [joined, roomCode]);

  async function doJoin(joinName: string) {
    const trimmed = joinName.trim();
    if (!trimmed) { setError(txt.nameRequired); return; }
    if (!roomCode) { setError(txt.codeRequired); return; }

    const result = await joinDavinciRoom(roomCode, trimmed);
    if ('error' in result) {
      if (result.error === 'not_found') setError(txt.roomNotFound);
      if (result.error === 'started') setError(txt.gameAlreadyStarted);
      return;
    }

    localStorage.setItem(`davinci_name_${roomCode}`, trimmed);
    sessionStorage.setItem(`davinci_session_${roomCode}`, trimmed);
    setName(trimmed);
    setJoined(true);
    sfxClick();
  }

  const myName = sessionStorage.getItem(`davinci_session_${roomCode}`) ?? name;
  const myPlayer = room?.players?.[myName];
  const myTiles = useMemo<Tile[]>(() => myPlayer?.tiles ?? [], [myPlayer?.tiles]);
  const isMyTurn = room?.playerOrder?.[room.currentTurnIndex] === myName;
  const isEliminated = myPlayer?.eliminated ?? false;
  const currentTurnPlayer = room ? room.playerOrder?.[room.currentTurnIndex] : null;

  // Keep ref in sync for use inside setInterval closure
  isMyTurnRef.current = isMyTurn;

  // Countdown — auto-end turn when timer hits 0 (only on my turn)
  useEffect(() => {
    if (room?.turnState !== 'guess' || !room.guessStartedAt) {
      setGuessTimer(GUESS_TIMEOUT);
      autoEndedRef.current = false;
      return;
    }
    autoEndedRef.current = false;
    const startedAt = room.guessStartedAt;
    const tick = () => {
      const remaining = Math.max(0, GUESS_TIMEOUT - (Date.now() - startedAt) / 1000);
      const secs = Math.ceil(remaining);
      setGuessTimer(secs);
      if (secs <= 5 && secs > 0) sfxTimerTick();
      if (remaining <= 0 && isMyTurnRef.current && !autoEndedRef.current) {
        autoEndedRef.current = true;
        forfeitTurn(roomCode).catch(console.error);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // room.guessStartedAt 변경 시마다 타이머 리셋
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.turnState, room?.guessStartedAt, roomCode]);

  // Result phase 10-second countdown — auto-endTurn on my turn
  useEffect(() => {
    setResultCountdown(10);
    autoResultEndedRef.current = false;
    if (room?.turnState !== 'result') return;
    const id = setInterval(() => {
      setResultCountdown((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && isMyTurnRef.current && !autoResultEndedRef.current) {
          autoResultEndedRef.current = true;
          endTurn(roomCode).catch(console.error);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.turnState, roomCode]);

  // placing 상태 이탈 시 슬롯 선택 초기화
  useEffect(() => {
    if (room?.turnState !== 'placing') setSelectedSlot(null);
  }, [room?.turnState]);

  // forced 모드: 위치 자동 선택
  useEffect(() => {
    if (room?.turnState !== 'placing' || !room.pendingDrawnTile) return;
    const mode = getPlacementMode(myTiles, room.pendingDrawnTile);
    if (mode.type === 'forced') setSelectedSlot(mode.index);
  }, [room?.turnState, room?.pendingDrawnTile, myTiles]);

  // 내 차례 draw 단계 — 자동 뽑기 (0.8초 딜레이)
  useEffect(() => {
    if (!isMyTurn || room?.turnState !== 'draw' || !roomCode) return;
    const deck = room.deck ?? [];
    const id = setTimeout(() => {
      if (deck.length > 0) {
        sfxCardFlip();
        drawTile(roomCode).catch(console.error);
      } else {
        skipDraw(roomCode).catch(console.error);
      }
    }, 800);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, room?.turnState, roomCode]);


  async function handleTileClick(targetId: string, tileIndex: number) {
    if (!isMyTurn || room?.turnState !== 'guess') return;
    if (room.pendingGuess) return;
    const tile = room.players[targetId]?.tiles?.[tileIndex];
    if (!tile || tile.revealed || targetId === myName) return;
    sfxCardFlip();
    setSelectedTile({ targetId, tileIndex });
    setSelectedNumber(null);
    await setPendingGuess(roomCode, targetId, tileIndex);
  }

  async function handleCancelGuess() {
    sfxModalClose();
    setSelectedTile(null);
    setSelectedNumber(null);
    await clearPendingGuess(roomCode);
  }

  async function handleSubmitGuess() {
    if (selectedNumber === null || !selectedTile) return;
    sfxClick();
    await submitGuess(roomCode, selectedTile.targetId, selectedTile.tileIndex, selectedNumber);
    setSelectedTile(null);
    setSelectedNumber(null);
  }

  async function handleConfirmPlacement() {
    if (selectedSlot === null) return;
    sfxCardFlip();
    await confirmTilePlacement(roomCode, selectedSlot);
    setSelectedSlot(null);
  }

  async function handleContinueGuessing() {
    sfxClick();
    await continueGuessing(roomCode);
  }

  async function handleEndTurn() {
    if (autoResultEndedRef.current) return;
    autoResultEndedRef.current = true;
    sfxTurnEnd();
    await endTurn(roomCode);
  }

  // ── JOIN SCREEN ──
  if (!joined) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 flex flex-col items-center justify-center p-6">
        <div className="text-5xl mb-4" aria-hidden="true">🔢</div>
        <h1 className="text-3xl font-black text-stone-800 mb-1">{txt.title}</h1>
        <p className="text-stone-500 text-sm mb-6">
          {txt.roomCodeLabel}: <span className="font-mono font-bold">{roomCode}</span>
        </p>

        <div className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doJoin(name)}
            placeholder={txt.enterName}
            maxLength={12}
            autoFocus
            className="w-full border-2 border-stone-300 focus:border-stone-500 rounded-xl px-4 py-3
                       text-center text-lg font-bold outline-none transition-colors"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={() => doJoin(name)}
            className="w-full py-3 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700 active:scale-95 transition-all"
          >
            {txt.join}
          </button>
        </div>
      </div>
    );
  }

  // ── LOBBY ──
  if (!room || room.phase === 'lobby') {
    return (
      <div className="min-h-dvh bg-stone-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="text-5xl mb-4" aria-hidden="true">🔢</div>
        <h1 className="text-2xl font-black mb-2">{txt.title}</h1>
        <p className="text-emerald-400 font-bold text-xl mb-1">{myName}</p>
        <p className="text-stone-400">{txt.waiting}</p>
        <p className="text-stone-500 text-sm mt-6">
          {txt.roomCodeLabel}: <span className="font-mono font-bold text-stone-300">{roomCode}</span>
        </p>
        {room && (
          <div className="mt-4 space-y-1 text-sm">
            {Object.keys(room.players ?? {}).map((p) => (
              <div key={p} className={p === myName ? 'text-white font-bold' : 'text-stone-500'}>
                {p === myName ? '▶ ' : '  '}{p}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── GAMEOVER ──
  if (room.phase === 'gameover') {
    const iWon = room.winner === myName;
    return (
      <div
        className={`min-h-dvh flex flex-col items-center justify-center p-6 text-white ${
          iWon ? 'bg-yellow-900' : 'bg-stone-900'
        }`}
      >
        <div className="text-6xl mb-4" aria-hidden="true">{iWon ? '🏆' : '💀'}</div>
        <h2 className="text-3xl font-black mb-1">{iWon ? txt.winner : txt.eliminated}</h2>
        <p className="text-stone-300 mb-8">{room.winner}{txt.winnerIs}</p>

        <p className="text-stone-400 text-sm mb-3">{txt.yourTiles}</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {myTiles.map((tile, idx) => {
            const colorClasses = tile.color === 'black'
              ? DAVINCI_TILE.black.unrevealed
              : DAVINCI_TILE.white.unrevealed;
            return (
              <div
                key={idx}
                className={`w-12 h-16 rounded-lg flex items-center justify-center text-xl font-black border-2 ${colorClasses}`}
              >
                {formatTileNumber(tile.number)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  const canAct = isMyTurn && !isEliminated;
  const slotBtnCls = (selected: boolean) =>
    `w-7 h-14 rounded-md border-2 border-dashed flex items-center justify-center shrink-0 transition-all duration-150 ${
      selected ? 'border-yellow-400 bg-yellow-400/20 scale-110' : 'border-stone-600 hover:border-yellow-600'
    }`;

  const placingPendingTile = (isMyTurn && room.turnState === 'placing') ? room.pendingDrawnTile : null;
  const placingMode = placingPendingTile ? getPlacementMode(myTiles, placingPendingTile) : null;
  const placingPendingColorCls = placingPendingTile
    ? (placingPendingTile.color === 'black' ? DAVINCI_TILE.black.unrevealed : DAVINCI_TILE.white.unrevealed)
    : '';
  const placingConflictIndices = placingMode?.type === 'conflict' ? placingMode.indices : null;
  const placingConflictTile = placingConflictIndices ? myTiles[placingConflictIndices[0]] : null;
  const placingConflictColorCls = placingConflictTile
    ? (placingConflictTile.color === 'black' ? DAVINCI_TILE.black.unrevealed : DAVINCI_TILE.white.unrevealed)
    : '';

  return (
    <div className="min-h-dvh bg-stone-900 text-white flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="font-bold">{myName}</span>
        <span className="text-stone-400 font-mono text-sm">{roomCode}</span>
      </div>

      {/* Turn banner */}
      <div
        className={`rounded-xl px-4 py-2 mb-3 text-center text-sm font-bold shrink-0 transition-colors duration-300 ${
          isMyTurn ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-800 text-stone-400'
        }`}
      >
        {isMyTurn
          ? room.turnState === 'placing'
            ? `▶ ${txt.placingTile}`
            : `▶ ${txt.currentTurn}!`
          : room.turnState === 'placing'
            ? `${currentTurnPlayer ?? ''} ${txt.opponentPlacing}`
            : `${currentTurnPlayer ?? ''} ${txt.currentTurn}`}
      </div>

      {/* My tiles */}
      <div className="mb-4 shrink-0">
        <p className="text-stone-400 text-xs mb-2">{txt.yourTiles}</p>
        <div className="flex gap-2 flex-wrap">
          {myTiles.map((tile, idx) => {
            const isDrawnTile = isMyTurn && room.drawnTileIndex === idx;
            const isRevealedByWrongGuess =
              room.turnState === 'result' && !room.lastResult?.correct && isMyTurn && room.drawnTileIndex === idx;
            const colorClasses = tile.color === 'black'
              ? (tile.revealed ? DAVINCI_TILE.black.revealed : DAVINCI_TILE.black.unrevealed)
              : (tile.revealed ? DAVINCI_TILE.white.revealed : DAVINCI_TILE.white.unrevealed);
            return (
              <div
                key={idx}
                className={`w-12 h-16 rounded-lg flex items-center justify-center text-xl font-black border-2 relative
                  ${colorClasses}
                  ${isDrawnTile && !isRevealedByWrongGuess ? 'ring-2 ring-blue-400' : ''}
                  ${isRevealedByWrongGuess ? 'ring-4 ring-amber-400' : ''}
                `}
              >
                {formatTileNumber(tile.number)}
                {tile.revealed && (
                  <span className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {isEliminated && (
          <p className="text-red-400 text-sm mt-2 font-bold">✕ {txt.eliminated}</p>
        )}
      </div>

      {/* Other players */}
      <div className="flex-1 overflow-y-auto px-1 pt-1 min-h-0">
        <p className="text-stone-400 text-xs mb-2">{txt.playerCount}</p>
        {room.turnState === 'guess' && (
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-bold ${canAct ? 'text-amber-300' : 'text-stone-500'}`}>
              {canAct ? txt.selectTarget : `${currentTurnPlayer} ${txt.guessOf}...`}
            </p>
            <span
              className={`font-black text-2xl tabular-nums transition-colors duration-300 ${
                guessTimer <= 10 ? 'text-red-400' : 'text-stone-300'
              }`}
            >
              {guessTimer}
            </span>
          </div>
        )}
        <div className="space-y-2 pb-2">
          {(room.playerOrder ?? [])
            .filter((p) => p !== myName)
            .map((p) => {
              const player = room.players[p];
              const isTheirTurn = p === currentTurnPlayer;
              return (
                <div
                  key={p}
                  className={`rounded-xl p-3 transition-all duration-300 ${
                    player.eliminated
                      ? 'bg-stone-800 opacity-40'
                      : isTheirTurn
                        ? 'bg-stone-700 ring-1 ring-emerald-500'
                        : canAct && room.turnState === 'guess'
                          ? 'bg-stone-800 ring-1 ring-amber-400'
                          : 'bg-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold">{p}</span>
                    {isTheirTurn && <span className="text-emerald-400 text-xs">▶</span>}
                    {player.eliminated && <span className="text-red-400 text-xs">✕</span>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(player.tiles ?? []).map((tile, idx) => {
                      const isPending =
                        room.pendingGuess?.targetId === p && room.pendingGuess?.tileIndex === idx;
                      const isSelectedByMe = selectedTile?.targetId === p && selectedTile?.tileIndex === idx;
                      const isTargeted =
                        room.turnState === 'result' &&
                        room.lastResult?.targetId === p &&
                        room.lastResult?.tileIndex === idx;
                      const isGuessable =
                        canAct && room.turnState === 'guess' && !tile.revealed && !player.eliminated;
                      const colorClasses = tile.color === 'black'
                        ? (tile.revealed ? DAVINCI_TILE.black.revealed : DAVINCI_TILE.black.opaque)
                        : (tile.revealed ? DAVINCI_TILE.white.revealed : DAVINCI_TILE.white.opaque);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleTileClick(p, idx)}
                          disabled={!isGuessable}
                          className={`
                            w-10 h-14 rounded-lg flex items-center justify-center text-sm font-black border-2
                            transition-all duration-150 shrink-0
                            ${colorClasses}
                            ${isPending || isSelectedByMe ? 'ring-2 ring-yellow-400 scale-110' : ''}
                            ${isTargeted ? (room.lastResult?.correct ? 'ring-4 ring-emerald-400 scale-110' : 'ring-4 ring-red-400 scale-110') : ''}
                            ${isGuessable ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-yellow-300 active:scale-95' : 'cursor-default'}
                          `}
                        >
                          {tile.revealed ? formatTileNumber(tile.number) : '?'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action area — 내 차례일 때만 표시 */}
      {canAct && (
        <div className="shrink-0 mt-3 pt-3 border-t border-stone-700">
          {room.turnState === 'draw' && (
            <div className="flex-1 py-3 rounded-xl bg-stone-700 text-stone-300 text-center font-bold animate-pulse">
              {(room.deck?.length ?? 0) > 0
                ? `${txt.drawTile}...`
                : txt.deckEmpty}
            </div>
          )}

          {room.turnState === 'placing' && placingPendingTile && placingMode && (
              <div className="bg-amber-950 border border-amber-700 rounded-2xl p-4">
                {/* 뽑은 타일 */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-amber-300 text-xs font-bold shrink-0">{txt.placingTile}:</span>
                  <div className={`w-10 h-14 rounded-lg flex items-center justify-center text-lg font-black border-2 shrink-0 ${placingPendingColorCls}`}>
                    {formatTileNumber(placingPendingTile.number)}
                  </div>
                </div>

                {/* forced: 위치 자동 결정 */}
                {placingMode.type === 'forced' && (
                  <p className="text-emerald-400 text-xs font-bold mb-3">{txt.placingForced}</p>
                )}

                {/* conflict: 같은 숫자 좌/우 선택 */}
                {placingConflictTile && placingConflictIndices && (
                  <>
                    <p className="text-stone-400 text-xs mb-2">{txt.placingConflict}</p>
                    <div className="flex items-center gap-1 justify-center mb-3">
                      <button onClick={() => setSelectedSlot(placingConflictIndices[0])} className={slotBtnCls(selectedSlot === placingConflictIndices[0])}>
                        {selectedSlot === placingConflictIndices[0] && <span className="text-yellow-400 text-xs font-bold">▼</span>}
                      </button>
                      <div className={`w-10 h-14 rounded-lg flex items-center justify-center text-base font-black border-2 shrink-0 ${placingConflictColorCls}`}>
                        {formatTileNumber(placingConflictTile.number)}
                      </div>
                      <button onClick={() => setSelectedSlot(placingConflictIndices[1])} className={slotBtnCls(selectedSlot === placingConflictIndices[1])}>
                        {selectedSlot === placingConflictIndices[1] && <span className="text-yellow-400 text-xs font-bold">▼</span>}
                      </button>
                    </div>
                  </>
                )}

                {/* free (조커): 모든 슬롯 선택 */}
                {placingMode.type === 'free' && (
                  <>
                    <p className="text-stone-400 text-xs mb-2">{txt.placingHint}</p>
                    <div className="flex items-center overflow-x-auto pb-2 gap-0.5">
                      <button onClick={() => setSelectedSlot(0)} className={slotBtnCls(selectedSlot === 0)}>
                        {selectedSlot === 0 && <span className="text-yellow-400 text-xs font-bold">▼</span>}
                      </button>
                      {myTiles.map((tile, idx) => {
                        const colorClasses = tile.color === 'black'
                          ? (tile.revealed ? DAVINCI_TILE.black.revealed : DAVINCI_TILE.black.unrevealed)
                          : (tile.revealed ? DAVINCI_TILE.white.revealed : DAVINCI_TILE.white.unrevealed);
                        return (
                          <div key={idx} className="flex items-center shrink-0">
                            <div className={`w-10 h-14 rounded-lg flex items-center justify-center text-base font-black border-2 relative ${colorClasses}`}>
                              {formatTileNumber(tile.number)}
                              {tile.revealed && (
                                <span className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center text-xs">✓</span>
                              )}
                            </div>
                            <button onClick={() => setSelectedSlot(idx + 1)} className={slotBtnCls(selectedSlot === idx + 1)}>
                              {selectedSlot === idx + 1 && <span className="text-yellow-400 text-xs font-bold">▼</span>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <button
                  onClick={handleConfirmPlacement}
                  disabled={selectedSlot === null}
                  className="w-full py-3 rounded-xl bg-yellow-500 text-stone-900 font-black hover:bg-yellow-400 disabled:opacity-40 active:scale-95 transition-all"
                >
                  {txt.confirmPlacement}
                </button>
              </div>
            )}
        </div>
      )}

      {room.phase === 'playing' && room.turnState === 'result' && room.lastResult && (
        <ResultPopup
          result={room.lastResult}
          guesserName={currentTurnPlayer ?? ''}
          targetTile={room.players[room.lastResult.targetId]?.tiles?.[room.lastResult.tileIndex]}
          hasWinner={!!room.winner}
          countdown={resultCountdown}
          canAct={canAct}
          drawnTile={room.drawnTileIndex != null && currentTurnPlayer ? room.players[currentTurnPlayer]?.tiles?.[room.drawnTileIndex] : null}
          txt={txt}
          onContinue={handleContinueGuessing}
          onEndTurn={handleEndTurn}
        />
      )}

      {/* Number picker modal */}
      {selectedTile && (
        <Modal
          titleId="player-number-picker"
          onClose={handleCancelGuess}
          maxWidth="max-w-sm"
        >
          <h3 id="player-number-picker" className="text-stone-800 font-bold mb-3 text-center">
            {selectedTile.targetId} — {txt.selectNumber}
          </h3>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, JOKER_NUMBER].map((n) => (
              <button
                key={n}
                onClick={() => setSelectedNumber(n)}
                className={`py-3 rounded-xl font-black text-lg transition-all active:scale-95 ${
                  selectedNumber === n
                    ? 'bg-yellow-500 text-stone-900 scale-105'
                    : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                }`}
              >
                {formatTileNumber(n)}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancelGuess}
              className="flex-1 py-2 rounded-xl bg-stone-200 text-stone-700 font-bold hover:bg-stone-300"
            >
              {txt.cancel}
            </button>
            <button
              onClick={handleSubmitGuess}
              disabled={selectedNumber === null}
              className="flex-1 py-2 rounded-xl bg-yellow-500 text-stone-900 font-black hover:bg-yellow-400 disabled:opacity-40 active:scale-95 transition-all"
            >
              {txt.guess}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

