import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../../codenames/store/game-store';
import { useDavinciStore } from '../store/game-store';
import { I18N } from '../lib/i18n';
import { formatTileNumber, generateSeed, JOKER_NUMBER } from '../lib/game-engine';
import {
  subscribeDavinciRoom,
  startDavinciGame,
  drawTile,
  skipDraw,
  submitGuess,
  setPendingGuess,
  clearPendingGuess,
  continueGuessing,
  endTurn,
  deleteDavinciRoom,
  resetDavinciRoom,
} from '../lib/firebase-room';
import type { RoomState } from '../lib/types';
import Modal from '../../../components/Modal';
import ResultPopup from '../components/ResultPopup';
import { DAVINCI_TILE } from '../../../lib/colors';
import {
  sfxClick,
  sfxCardFlip,
  sfxCorrect,
  sfxWrong,
  sfxGameStart,
  sfxPlayerJoin,
  sfxVictory,
  sfxTurnEnd,
  sfxModalClose,
  sfxTimerTick,
} from '../../../lib/sound';

const GUESS_TIMEOUT = 30;

interface Props {
  onGoHome: () => void;
}

export default function DavinciGame({ onGoHome }: Props) {
  const globalLang = useGameStore((s) => s.lang);
  const { roomCode, lang: storeLang } = useDavinciStore();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ targetId: string; tileIndex: number } | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [guessTimer, setGuessTimer] = useState(GUESS_TIMEOUT);
  const [resultCountdown, setResultCountdown] = useState(10);
  const prevPlayerCountRef = useRef<number>(0);
  const prevPhaseRef = useRef<string>('');
  const prevTurnStateRef = useRef<string>('');

  const lang = ((room?.lang ?? storeLang ?? globalLang) || 'ko') as 'ko' | 'en' | 'zh';
  const txt = I18N[lang];

  const qrUrl = `${window.location.origin}${window.location.pathname}?game=davinci&room=${roomCode}&lang=${lang}`;

  useEffect(() => {
    if (!roomCode) return;
    return subscribeDavinciRoom(roomCode, (state) => {
      setRoom(state);

      if (state?.phase === 'lobby') {
        const count = Object.keys(state.players ?? {}).length;
        if (count > prevPlayerCountRef.current) sfxPlayerJoin();
        prevPlayerCountRef.current = count;
      }

      if (state?.turnState !== prevTurnStateRef.current) {
        if (state?.turnState === 'result') {
          if (state.lastResult?.correct) sfxCorrect(); else sfxWrong();
        }
        prevTurnStateRef.current = state?.turnState ?? '';
      }

      if (state?.phase !== prevPhaseRef.current) {
        if (state?.phase === 'gameover') sfxVictory();
        prevPhaseRef.current = state?.phase ?? '';
      }
    });
  }, [roomCode]);

  // Guess phase countdown (display only — auto-end triggered by player's phone)
  useEffect(() => {
    if (room?.turnState !== 'guess' || !room.guessStartedAt) {
      setGuessTimer(GUESS_TIMEOUT);
      return;
    }
    const startedAt = room.guessStartedAt;
    const tick = () => {
      const remaining = Math.max(0, GUESS_TIMEOUT - (Date.now() - startedAt) / 1000);
      const secs = Math.ceil(remaining);
      setGuessTimer(secs);
      if (secs <= 5 && secs > 0) sfxTimerTick();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room?.turnState, room?.guessStartedAt]);

  // Result phase 10-second countdown
  useEffect(() => {
    setResultCountdown(10);
    if (room?.turnState !== 'result') return;
    const id = setInterval(() => setResultCountdown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [room?.turnState]);

  const currentPlayerName = room ? room.playerOrder?.[room.currentTurnIndex] : null;
  const playerOrder = room?.playerOrder ?? [];

  async function handleStartGame() {
    if (Object.keys(room?.players ?? {}).length < 2) return;
    sfxGameStart();
    await startDavinciGame(roomCode, generateSeed());
  }

  async function handleDrawTile() {
    sfxCardFlip();
    await drawTile(roomCode);
  }

  async function handleSkipDraw() {
    sfxClick();
    await skipDraw(roomCode);
  }

  async function handleTileClick(targetId: string, tileIndex: number) {
    if (room?.turnState !== 'guess') return;
    if (room.pendingGuess) return;
    const tile = room.players[targetId]?.tiles?.[tileIndex];
    if (!tile || tile.revealed || targetId === currentPlayerName) return;
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

  async function handleContinueGuessing() {
    sfxClick();
    await continueGuessing(roomCode);
  }

  async function handleEndTurn() {
    sfxTurnEnd();
    await endTurn(roomCode);
  }

  async function handleReset() {
    sfxClick();
    await resetDavinciRoom(roomCode);
  }

  async function handleGoHome() {
    await deleteDavinciRoom(roomCode);
    onGoHome();
  }

  if (!room) {
    return (
      <div className="min-h-dvh bg-stone-900 flex items-center justify-center text-stone-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-stone-900 text-white flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={handleGoHome}
          className="text-stone-400 hover:text-white transition-colors text-sm"
        >
          ← {txt.home}
        </button>
        <h1 className="text-lg font-black">{txt.title}</h1>
        <span className="font-mono font-bold text-stone-300 text-sm">{roomCode}</span>
      </div>

      {/* ── LOBBY ── */}
      {room.phase === 'lobby' && (
        <div className="flex flex-col items-center flex-1 justify-center">
          <div className="bg-white rounded-2xl p-5 mb-4 flex flex-col items-center gap-3">
            <QRCodeSVG value={qrUrl} size={180} />
            <p className="text-xs text-stone-400 text-center">{txt.scanQr}</p>
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-2 px-4 rounded-xl transition-colors"
            >
              🔗 {qrUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
          <p className="font-mono text-4xl font-black mb-4">{roomCode}</p>

          <div className="w-full max-w-xs mb-6">
            <p className="text-stone-400 text-xs mb-2">
              {txt.playerCount}: {Object.keys(room.players ?? {}).length}
            </p>
            <div className="space-y-1">
              {Object.keys(room.players ?? {}).map((name) => (
                <div key={name} className="bg-stone-800 rounded-xl px-4 py-2 text-sm font-bold">
                  {name}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={Object.keys(room.players ?? {}).length < 2}
            className="w-full max-w-xs py-4 rounded-2xl bg-emerald-600 text-white text-xl font-bold
                       hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-40"
          >
            {txt.startGame}
          </button>
          {Object.keys(room.players ?? {}).length < 2 && (
            <p className="text-stone-500 text-xs mt-2">{txt.minPlayers}</p>
          )}
        </div>
      )}

      {/* ── PLAYING ── */}
      {room.phase === 'playing' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Status */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="text-sm">
              <span className="text-stone-400">{txt.currentTurn}: </span>
              <span className="font-bold text-emerald-400">{currentPlayerName}</span>
            </div>
            <div className="text-sm text-stone-400">
              {txt.deckRemaining}:{' '}
              <span className={`font-bold ${(room.deck?.length ?? 0) === 0 ? 'text-amber-400' : 'text-white'}`}>
                {room.deck?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Turn state hint + countdown */}
          {room.turnState === 'guess' && (
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-amber-300 text-sm font-bold">{txt.selectTarget}</span>
              <span
                className={`font-black text-2xl tabular-nums transition-colors duration-300 ${
                  guessTimer <= 10 ? 'text-red-400' : 'text-white'
                }`}
              >
                {guessTimer}
              </span>
            </div>
          )}

          {/* Players tiles */}
          <div className="flex-1 overflow-y-auto space-y-3 px-1 pt-1 pb-2">
            {playerOrder.map((name) => {
              const player = room.players[name];
              const isCurrentTurn = name === currentPlayerName;
              const isEliminated = player?.eliminated;

              return (
                <div
                  key={name}
                  className={`rounded-2xl p-3 transition-all duration-300 ${
                    isEliminated
                      ? 'opacity-40 bg-stone-800'
                      : isCurrentTurn
                        ? 'bg-stone-700 ring-2 ring-emerald-400'
                        : 'bg-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm">{name}</span>
                    {isCurrentTurn && (
                      <span className="text-emerald-400 text-xs font-bold">▶ {txt.currentTurn}</span>
                    )}
                    {isEliminated && (
                      <span className="text-red-400 text-xs font-bold">✕ {txt.eliminated}</span>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {(player?.tiles ?? []).map((tile, idx) => {
                      const isPending =
                        room.pendingGuess?.targetId === name && room.pendingGuess?.tileIndex === idx;
                      const isDrawnTile = isCurrentTurn && room.drawnTileIndex === idx;
                      const isGuessable =
                        room.turnState === 'guess' &&
                        !isCurrentTurn &&
                        !tile.revealed &&
                        !isEliminated;

                      const colorClasses = tile.color === 'black'
                        ? (tile.revealed ? DAVINCI_TILE.black.revealed : DAVINCI_TILE.black.unrevealed)
                        : (tile.revealed ? DAVINCI_TILE.white.revealed : DAVINCI_TILE.white.unrevealed);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleTileClick(name, idx)}
                          disabled={!isGuessable}
                          className={`
                            w-14 h-20 rounded-xl text-xl font-black border-2 transition-all duration-150
                            flex items-center justify-center shrink-0
                            ${colorClasses}
                            ${isPending ? 'ring-2 ring-yellow-400 scale-110' : ''}
                            ${isDrawnTile ? 'ring-2 ring-blue-400' : ''}
                            ${isGuessable ? 'hover:scale-110 cursor-pointer hover:ring-2 hover:ring-yellow-300 active:scale-95' : 'cursor-default'}
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

          {/* Action area */}
          <div className="shrink-0 mt-3 pt-3 border-t border-stone-700">
            {room.turnState === 'draw' && (
              <div className="flex gap-2">
                {(room.deck?.length ?? 0) > 0 ? (
                  <button
                    onClick={handleDrawTile}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 active:scale-95 transition-all"
                  >
                    {txt.drawTile} ({room.deck?.length ?? 0})
                  </button>
                ) : (
                  <button
                    onClick={handleSkipDraw}
                    className="flex-1 py-3 rounded-xl bg-stone-600 text-white font-bold hover:bg-stone-500 active:scale-95 transition-all"
                  >
                    {txt.skipDraw} ({txt.deckEmpty})
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── GAMEOVER ── */}
      {room.phase === 'gameover' && (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="text-6xl mb-4" aria-hidden="true">🏆</div>
          <h2 className="text-4xl font-black text-yellow-400 mb-1">{room.winner}</h2>
          <p className="text-stone-400 mb-8">{txt.winnerIs}</p>

          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 active:scale-95 transition-all"
            >
              {txt.playAgain}
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 py-3 rounded-xl bg-stone-600 text-white font-bold hover:bg-stone-500 active:scale-95 transition-all"
            >
              {txt.home}
            </button>
          </div>
        </div>
      )}

      {room.phase === 'playing' && room.turnState === 'result' && room.lastResult && (
        <ResultPopup
          result={room.lastResult}
          guesserName={currentPlayerName ?? ''}
          targetTile={room.players[room.lastResult.targetId]?.tiles?.[room.lastResult.tileIndex]}
          hasWinner={!!room.winner}
          countdown={resultCountdown}
          canAct
          drawnTile={room.drawnTileIndex != null && currentPlayerName ? room.players[currentPlayerName]?.tiles?.[room.drawnTileIndex] : null}
          txt={txt}
          onContinue={handleContinueGuessing}
          onEndTurn={handleEndTurn}
        />
      )}

      {/* ── NUMBER PICKER MODAL ── */}
      {selectedTile && (
        <Modal
          titleId="davinci-number-picker"
          onClose={handleCancelGuess}
          maxWidth="max-w-sm"
        >
          <h3 id="davinci-number-picker" className="text-stone-800 font-bold mb-3 text-center">
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
