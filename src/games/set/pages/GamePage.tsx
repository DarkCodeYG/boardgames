import { useEffect, useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../../codenames/store/game-store';
import { useSetStore } from '../store/game-store';
import { I18N } from '../lib/i18n';
import { isValidSet, findAnySet, isValidGeniusSet, findAnyGeniusSet } from '../lib/game-engine';
import {
  subscribeSetRoom,
  startSetGame,
  resolveSetCorrect,
  resolveSetWrong,
  resolveGyulCorrect,
  resolveGyulWrong,
  updateSetLang,
  deleteSetRoom,
  resetSetRoom,
} from '../lib/firebase-set';
import type { SetRoomState, Lang } from '../lib/types';
import SetCard from '../components/SetCard';
import LangToggle from '../../../components/LangToggle';
import Confetti from '../../../components/Confetti';
import { sfxClick, sfxToggle, sfxGameStart, sfxVictory, sfxTimerTick, sfxTimerUp, sfxPlayerJoin, sfxCardFlip } from '../../../lib/sound';

const SET_TIMEOUT_SECS = 10;

interface GamePageProps {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: GamePageProps) {
  const globalLang = useGameStore((s) => s.lang);
  const { roomCode, theme, lang: storeLang } = useSetStore();

  const [roomState, setRoomState] = useState<SetRoomState | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(SET_TIMEOUT_SECS);
  const [banner, setBanner] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const [newCardIds, setNewCardIds] = useState<Map<number, number>>(new Map());
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [hintCards, setHintCards] = useState<number[] | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [turnAnnounce, setTurnAnnounce] = useState<{ playerName: string; type: 'set' | 'gyul' } | null>(null);
  const hintIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processedTurnRef = useRef<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPlayerCountRef = useRef<number | null>(null);
  const lastResultTimestampRef = useRef<number | null>(null);
  const prevTableCardsRef = useRef<number[] | null>(null);
  const lastTurnAnnounceKeyRef = useRef<string | null>(null);
  const turnAnnounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lang = ((roomState?.lang ?? storeLang ?? globalLang) || 'ko') as Lang;
  const txt = I18N[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHintConfirm) setShowHintConfirm(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHintConfirm]);

  // Firebase subscription
  useEffect(() => {
    if (!roomCode) return;
    return subscribeSetRoom(roomCode, (state) => setRoomState(state));
  }, [roomCode]);

  // Player join sound
  useEffect(() => {
    if (roomState?.phase !== 'lobby') { prevPlayerCountRef.current = null; return; }
    const count = Object.keys(roomState.players || {}).length;
    if (prevPlayerCountRef.current !== null && count > prevPlayerCountRef.current) sfxPlayerJoin();
    prevPlayerCountRef.current = count;
  }, [roomState?.players, roomState?.phase]);

  // Banner for lastResult
  useEffect(() => {
    if (!roomState?.lastResult) return;
    const { type, playerName, timestamp } = roomState.lastResult;
    if (lastResultTimestampRef.current === timestamp) return;
    lastResultTimestampRef.current = timestamp;
    showBanner(txt.resultText(type, playerName));
    if (type === 'set_correct' || type === 'gyul_correct') sfxVictory();
    else sfxTimerUp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.lastResult]);

  // Card flip animation when new cards are added to table
  useEffect(() => {
    if (!roomState || roomState.phase !== 'playing') return;
    const current = JSON.parse(roomState.tableCards || '[]') as number[];
    const prev = prevTableCardsRef.current;
    if (prev !== null) {
      const added = current.filter((id) => !prev.includes(id));
      if (added.length > 0) {
        setNewCardIds(new Map(added.map((id, i) => [id, i])));
        added.forEach((_, i) => setTimeout(() => sfxCardFlip(), i * 120));
        const clearDelay = added.length * 120 + 500;
        const t = setTimeout(() => setNewCardIds(new Map()), clearDelay);
        prevTableCardsRef.current = current;
        return () => clearTimeout(t);
      }
    }
    prevTableCardsRef.current = current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.tableCards]);

  // 10s countdown for set turns
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

  // Reset selected cards when turn changes
  useEffect(() => {
    setSelectedCards([]);
    setResolving(false);
  }, [roomState?.currentTurn?.playerName, roomState?.currentTurn?.startedAt]);

  // Turn announcement overlay
  useEffect(() => {
    const turn = roomState?.currentTurn;
    if (!turn) return;
    const key = `${turn.playerName}-${turn.startedAt}`;
    if (lastTurnAnnounceKeyRef.current === key) return;
    lastTurnAnnounceKeyRef.current = key;
    if (turnAnnounceTimerRef.current) clearTimeout(turnAnnounceTimerRef.current);
    setTurnAnnounce({ playerName: turn.playerName, type: turn.type });
    turnAnnounceTimerRef.current = setTimeout(() => setTurnAnnounce(null), 2000);
    return () => { if (turnAnnounceTimerRef.current) clearTimeout(turnAnnounceTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.currentTurn?.playerName, roomState?.currentTurn?.startedAt]);

  // Auto-handle set timeout
  useEffect(() => {
    if (timeLeft !== 0 || !roomState?.currentTurn || roomState.currentTurn.type !== 'set' || resolving) return;
    const { playerName } = roomState.currentTurn;
    setResolving(true);
    resolveSetWrong(roomCode, roomState, playerName, 'set_timeout').catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Auto-handle gyul turns (1s delay for drama)
  useEffect(() => {
    const turn = roomState?.currentTurn;
    if (!turn || turn.type !== 'gyul' || !roomState || resolving) return;
    const turnKey = `${turn.playerName}-${turn.startedAt}`;
    if (processedTurnRef.current === turnKey) return;
    processedTurnRef.current = turnKey;

    setResolving(true);
    const captured = roomState;
    const capturedTurnPlayer = turn.playerName;

    const timeout = setTimeout(() => {
      const tableCards = JSON.parse(captured.tableCards) as number[];
      const isGenius = captured.theme === 'genius';
      const setExists = (isGenius ? findAnyGeniusSet(tableCards) : findAnySet(tableCards)) !== null;
      const resolve = setExists
        ? resolveGyulWrong(roomCode, captured, capturedTurnPlayer)
        : resolveGyulCorrect(roomCode, captured, capturedTurnPlayer);
      resolve.catch(console.error).finally(() => setResolving(false));
    }, 800);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.currentTurn?.playerName, roomState?.currentTurn?.startedAt]);

  const showBanner = useCallback((text: string) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBanner(text);
    bannerTimerRef.current = setTimeout(() => setBanner(null), 2500);
  }, []);

  const handleHintConfirm = () => {
    const cards = JSON.parse(roomState?.tableCards || '[]') as number[];
    const currentTheme = theme || roomState?.theme;
    const set = currentTheme === 'genius' ? findAnyGeniusSet(cards) : findAnySet(cards);
    setShowHintConfirm(false);
    if (!set) { showBanner(txt.hintNoSet); return; }

    setHintCards([...set]);
    setHintVisible(true);
    let blinks = 0;
    if (hintIntervalRef.current) clearInterval(hintIntervalRef.current);
    hintIntervalRef.current = setInterval(() => {
      blinks++;
      setHintVisible(blinks % 2 === 0);
      if (blinks >= 6) {
        clearInterval(hintIntervalRef.current!);
        setHintCards(null);
        setHintVisible(false);
      }
    }, 400);
  };

  const handleCardClick = (cardId: number) => {
    if (!roomState?.currentTurn || roomState.currentTurn.type !== 'set' || resolving) return;
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        sfxClick();
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= 3) {
        sfxClick();
        return prev;
      }
      sfxToggle();
      return [...prev, cardId];
    });
  };

  const handleConfirmSet = async () => {
    if (selectedCards.length !== 3 || !roomState?.currentTurn || resolving) return;
    const { playerName } = roomState.currentTurn;
    setResolving(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const valid = roomState.theme === 'genius'
      ? isValidGeniusSet(selectedCards[0], selectedCards[1], selectedCards[2])
      : isValidSet(selectedCards[0], selectedCards[1], selectedCards[2]);
    if (valid) {
      sfxGameStart();
      await resolveSetCorrect(roomCode, roomState, playerName, selectedCards);
    } else {
      sfxTimerUp();
      await resolveSetWrong(roomCode, roomState, playerName, 'set_wrong');
    }
    setResolving(false);
  };

  const handleStartGame = async () => {
    sfxGameStart();
    await startSetGame(roomCode);
  };

  const handleLangChange = async (l: Lang) => {
    await updateSetLang(roomCode, l);
  };

  const handleGoHome = () => {
    sfxClick();
    deleteSetRoom(roomCode).catch(() => {});
    onGoHome();
  };

  const handlePlayAgain = async () => {
    if (!roomState) return;
    sfxClick();
    await resetSetRoom(roomCode, roomState);
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

  const tableCards = JSON.parse(roomState.tableCards || '[]') as number[];
  const deckCards = JSON.parse(roomState.deckCards || '[]') as number[];
  const players = Object.entries(roomState.players || {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const sortedByScore = [...players].sort((a, b) => {
    const scoreA = (JSON.parse(a[1].collectedCards || '[]') as number[]).length + (a[1].bonusPoints ?? 0);
    const scoreB = (JSON.parse(b[1].collectedCards || '[]') as number[]).length + (b[1].bonusPoints ?? 0);
    return scoreB - scoreA;
  });

  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const qrUrl = `${origin}${pathname}?game=set&room=${roomCode}&lang=${lang}`;

  // ===== LOBBY =====
  if (roomState.phase === 'lobby') {
    const playerCount = players.length;
    const canStart = playerCount >= 2;

    return (
      <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex flex-col items-center">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleGoHome} className="text-stone-500 hover:text-stone-700 font-bold text-sm">
              ← {txt.goHome}
            </button>
            <LangToggle lang={lang} onChange={handleLangChange} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-stone-800">🃏 {txt.title}</h1>
            <p className="text-5xl font-black text-amber-600 mt-3 tracking-widest">{roomCode}</p>
            <p className="text-stone-500 text-sm mt-1">{txt.roomCode}</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center gap-3">
              <QRCodeSVG value={qrUrl} size={180} />
              <p className="text-xs text-stone-400 text-center">{txt.qrScanGuide}</p>
              <a href={qrUrl} target="_blank" rel="noopener noreferrer"
                className="w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-2 px-4 rounded-xl">
                🔗 {qrUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <p className="text-sm font-bold text-stone-600 mb-3">{txt.playersJoined(playerCount)}</p>
            {playerCount === 0 ? (
              <p className="text-stone-400 text-sm text-center py-2">{txt.scanQr}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map(([key, info]) => (
                  <span key={key} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                    {info.displayName}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStartGame}
            disabled={!canStart}
            className="w-full bg-stone-800 text-white text-2xl font-black py-5 rounded-2xl shadow-lg
                       hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-40"
          >
            🃏 {txt.startGame}
          </button>
          {!canStart && (
            <p className="text-center text-stone-400 text-sm mt-2">{txt.minPlayersHint}</p>
          )}
        </div>
      </div>
    );
  }

  // ===== PLAYING =====
  if (roomState.phase === 'playing') {
    const turn = roomState.currentTurn;
    const isSetTurn = turn?.type === 'set';
    const isGyulTurn = turn?.type === 'gyul';
    const timerColor = timeLeft <= 3 ? 'text-red-500' : timeLeft <= 6 ? 'text-amber-500' : 'text-stone-700';

    return (
      <div className="min-h-dvh bg-stone-100 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleGoHome} className="text-stone-400 hover:text-stone-600 font-bold text-sm">
              ← {txt.goHome}
            </button>
            <span className="font-black text-stone-800 text-lg">🃏 {txt.title}</span>
            <span className="font-black text-amber-600 text-lg tracking-wider">{roomCode}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${deckCards.length === 0 ? 'text-red-500 animate-pulse' : 'text-stone-500'}`}>
              {txt.deckRemaining(deckCards.length)}{deckCards.length === 0 ? ' 🔚' : ''}
            </span>
            <span className="text-stone-500 text-sm font-bold">{txt.tableCards(tableCards.length)}</span>
            <button
              onClick={() => { sfxClick(); setShowHintConfirm(true); }}
              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold text-sm rounded-lg transition-colors"
            >
              <span aria-hidden="true">💡</span> {txt.hintBtn}
            </button>
            <LangToggle lang={lang} onChange={handleLangChange} />
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex gap-3 p-3 min-h-0 overflow-hidden">
          {/* Card grid */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
            {/* Turn banner */}
            {(isSetTurn || isGyulTurn) && (
              <div className={`rounded-xl px-4 py-2 shrink-0
                ${isSetTurn ? 'bg-orange-100 border-2 border-orange-400' : 'bg-blue-100 border-2 border-blue-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-800 text-sm">
                    {txt.turnDeclared(turn!.playerName, turn!.type)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSetTurn && selectedCards.length > 0 && !resolving && (
                      <button
                        onClick={() => { sfxClick(); setSelectedCards([]); }}
                        className="text-xs text-stone-400 hover:text-red-500 font-bold px-2 py-0.5 rounded-lg hover:bg-white/60 transition-colors"
                      >
                        ✕ {txt.clearSelection}
                      </button>
                    )}
                    {isSetTurn && (
                      <span className={`text-2xl font-black tabular-nums ${timerColor}`}>{timeLeft}</span>
                    )}
                    {isGyulTurn && (
                      <span className="text-sm font-bold text-blue-600">{txt.checkingGyul}</span>
                    )}
                  </div>
                </div>
                {isSetTurn && (
                  <div className="w-full h-1.5 bg-orange-200 rounded-full mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-linear
                        ${timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 6 ? 'bg-amber-500' : 'bg-orange-500'}`}
                      style={{ width: `${(timeLeft / SET_TIMEOUT_SECS) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Selection hint */}
            {isSetTurn && !resolving && (
              <p className="shrink-0 text-xs text-stone-500 text-center">
                {txt.selectCards} ({selectedCards.length}/3)
              </p>
            )}

            {/* Cards */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div
                className="h-full grid grid-cols-3 sm:grid-cols-4 gap-2 p-2"
                style={{ perspective: '600px', gridAutoRows: '1fr' }}
              >
                {tableCards.map((cardId) => {
                  const delayIdx = newCardIds.get(cardId);
                  const isNew = delayIdx !== undefined;
                  const isHint = hintCards?.includes(cardId) && hintVisible;
                  return (
                    <div key={cardId}
                         className={`h-full min-h-0 ${isNew ? 'animate-flip-in' : ''} ${isHint ? 'ring-4 ring-yellow-400 rounded-xl scale-105 z-10 relative transition-all duration-150' : ''}`}
                         style={isNew ? { animationDelay: `${delayIdx * 120}ms` } : undefined}>
                      <SetCard
                        cardId={cardId}
                        theme={theme || roomState.theme}
                        selected={selectedCards.includes(cardId)}
                        onClick={isSetTurn && !resolving ? () => handleCardClick(cardId) : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: scores */}
          <div className="w-48 shrink-0 flex flex-col gap-2 overflow-hidden">
            <div className="bg-white rounded-xl p-3 shadow-sm flex-1 overflow-auto">
              <p className="text-xs font-black text-stone-500 uppercase mb-2">Score</p>
              {sortedByScore.map(([key, info]) => {
                const cards = (JSON.parse(info.collectedCards || '[]') as number[]).length;
                const bonus = info.bonusPoints ?? 0;
                return (
                  <div key={key} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0">
                    <span className="text-sm font-bold text-stone-700 truncate">{info.displayName}</span>
                    <div className="text-right shrink-0 ml-1">
                      <span className="text-sm font-black text-stone-800">{cards}</span>
                      {bonus > 0 && <span className="text-xs font-bold text-amber-600 ml-1">+{bonus}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* QR for reconnect */}
            <div className="bg-white rounded-xl p-2 shadow-sm text-center">
              <QRCodeSVG value={qrUrl} size={100} className="mx-auto mb-1" />
              <a href={qrUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs font-mono font-black text-blue-500 underline">{roomCode}</a>
            </div>
          </div>
        </div>

        {/* Confirm zone — always reserved so cards never go behind the button */}
        <div className="h-20 shrink-0 flex items-center justify-center px-6">
          {isSetTurn && selectedCards.length === 3 && !resolving && (
            <button
              onClick={handleConfirmSet}
              className="w-full max-w-sm bg-emerald-600 text-white font-black text-2xl py-4 rounded-3xl shadow-2xl
                         hover:bg-emerald-500 active:scale-95 transition-all border-4 border-white animate-pop-in"
            >
              ✓ {txt.confirm}
            </button>
          )}
        </div>

        {/* Hint confirm modal */}
        {showHintConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
               onClick={() => setShowHintConfirm(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="hint-confirm-title"
                 className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl text-center"
                 onClick={(e) => e.stopPropagation()}>
              <div className="text-4xl mb-3" aria-hidden="true">💡</div>
              <p id="hint-confirm-title" className="text-stone-700 font-bold text-lg mb-5">{txt.hintConfirm}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHintConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-bold hover:bg-stone-200"
                >
                  {txt.hintNo}
                </button>
                <button
                  onClick={handleHintConfirm}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-400"
                >
                  {txt.confirm}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Turn announcement overlay */}
        {turnAnnounce && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className={`flex flex-col items-center justify-center rounded-3xl px-16 py-10 shadow-2xl
              ${turnAnnounce.type === 'set' ? 'bg-orange-500' : 'bg-blue-600'}
              animate-turn-announce`}>
              <div className="text-white/80 text-2xl font-bold mb-2">
                {turnAnnounce.type === 'set' ? '🃏 SET!' : '결!'}
              </div>
              <div className="text-white font-black text-7xl leading-tight">
                {turnAnnounce.playerName}
              </div>
            </div>
          </div>
        )}

        {/* Result banner overlay */}
        {banner && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                          bg-stone-800 text-white font-black px-6 py-3 rounded-2xl shadow-xl text-lg
                          animate-in fade-in slide-in-from-bottom-4 duration-200">
            {banner}
          </div>
        )}
      </div>
    );
  }

  // ===== ENDED =====
  return (
    <>
    <Confetti />
    <div className="min-h-dvh bg-gradient-to-b from-stone-800 to-stone-900 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-4xl font-black text-white mb-2">{txt.gameOver}</h1>
        {sortedByScore[0] && (
          <p className="text-2xl font-bold text-amber-400 mb-6">
            {txt.finalRanking}
          </p>
        )}

        <div className="bg-white/10 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-4 gap-2 text-xs font-black text-white/50 uppercase mb-3">
            <span className="text-left">#</span>
            <span className="text-left">Player</span>
            <span className="text-right">{txt.cardsLabel}</span>
            <span className="text-right">{txt.bonusLabel}</span>
          </div>
          {sortedByScore.map(([key, info], idx) => {
            const cards = (JSON.parse(info.collectedCards || '[]') as number[]).length;
            const bonus = info.bonusPoints ?? 0;
            return (
              <div key={key} className={`grid grid-cols-4 gap-2 py-2 border-b border-white/10 last:border-0
                ${idx === 0 ? 'text-amber-400' : 'text-white'}`}>
                <span className="font-black text-left">{idx + 1}</span>
                <span className="font-bold text-left truncate">{info.displayName}</span>
                <span className="font-black text-right">{cards}</span>
                <span className="font-black text-right">{bonus > 0 ? `+${bonus}` : '0'}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl text-lg
                       hover:bg-amber-400 active:scale-95 transition-all"
          >
            {txt.playAgain}
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 bg-white/20 text-white font-black py-4 rounded-2xl text-lg
                       hover:bg-white/30 active:scale-95 transition-all"
          >
            {txt.goHome}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
