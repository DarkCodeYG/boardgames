import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { useGomokuStore } from '../store/game-store';
import { BOARD_SIZE, STAR_POINTS } from '../lib/game-engine';
import { getAIMove } from '../lib/ai';
import type { Player } from '../lib/types';
import { TEXTS } from '../lib/i18n';
import {
  sfxStonePlace, sfxVictory, sfxClick, sfxModalOpen,
  sfxTimerTick, sfxTimerUp,
} from '../../../lib/sound';
import {
  STATE_COLORS,
  GOMOKU_STONE_BLACK,
  GOMOKU_STONE_WHITE,
  GOMOKU_WIN_RING,
  GOMOKU_BOARD_BG,
} from '../../../lib/colors';

const CELL = 36;
const BOARD_PX = BOARD_SIZE * CELL;
const HALF = CELL / 2;
const TURN_TIME = 60;

const stoneClass = (p: Player) =>
  p === 'black' ? GOMOKU_STONE_BLACK : GOMOKU_STONE_WHITE;

interface Props {
  onGoHome: () => void;
}

export default function GomokuGame({ onGoHome }: Props) {
  const { lang } = useGameStore();
  const {
    board, currentPlayer, winner, winLine, moveCount,
    placeStone, resetGame, forfeit, undo,
    mode, difficulty,
    undoCount,
  } = useGomokuStore();
  const txt = TEXTS[lang];

  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [isTimeout, setIsTimeout] = useState(false);
  const isTimeoutRef = useRef(false);

  const isAITurn = mode === 'pve' && !winner && currentPlayer === 'white';

  // 게임 페이지 진입 시 항상 새 게임으로 초기화
  useEffect(() => {
    isTimeoutRef.current = false;
    setIsTimeout(false);
    resetGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const winSet = useMemo(
    () => winLine ? new Set(winLine.map(([r, c]) => `${r},${c}`)) : null,
    [winLine],
  );

  // 매 턴 타이머 리셋 + 카운트다운 (AI 턴 제외)
  useEffect(() => {
    if (winner || isAITurn) return;
    setTimeLeft(TURN_TIME);
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [moveCount, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  // 시간 초과 판정 + 틱 소리 (AI 턴 제외)
  useEffect(() => {
    if (winner || isAITurn) return;
    if (timeLeft === 0) {
      isTimeoutRef.current = true;
      setIsTimeout(true);
      sfxTimerUp();
      forfeit();
    } else if (timeLeft <= 10) {
      sfxTimerTick();
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // 승리 소리 (일반 승리만)
  useEffect(() => {
    if (winner && !isTimeoutRef.current) {
      sfxVictory();
      sfxModalOpen();
    }
  }, [winner]);

  // AI 착수
  useEffect(() => {
    if (!isAITurn) return;
    const t = setTimeout(() => {
      const [r, c] = getAIMove(board, 'white', difficulty);
      sfxStonePlace();
      placeStone(r, c);
    }, 500);
    return () => clearTimeout(t);
  }, [currentPlayer, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlace = (r: number, c: number) => {
    if (winner || board[r][c] || isAITurn) return;
    sfxStonePlace();
    placeStone(r, c);
  };

  const handleReset = () => {
    sfxClick();
    isTimeoutRef.current = false;
    setIsTimeout(false);
    resetGame();
  };

  const handleUndo = () => { sfxClick(); undo(); };

  const handleBack = () => { sfxClick(); onGoHome(); };

  const timerRatio = timeLeft / TURN_TIME;
  const timerLow = timeLeft <= 10;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <button
          onClick={handleBack}
          className="text-stone-500 hover:text-stone-700 font-bold transition-colors duration-150"
        >
          ← {txt.back}
        </button>
        <h1 className="text-xl font-black text-stone-800">{txt.title}</h1>
        <div className="flex items-center gap-3">
          {undoCount > 0 && !winner && (
            <button
              onClick={handleUndo}
              disabled={isAITurn}
              className="text-stone-400 hover:text-stone-600 text-sm font-medium transition-colors duration-150 disabled:opacity-30"
            >
              ↩ {undoCount}
            </button>
          )}
          <button
            onClick={handleReset}
            className="text-stone-400 hover:text-stone-600 text-sm font-medium transition-colors duration-150"
          >
            {txt.reset}
          </button>
        </div>
      </header>

      {/* 현재 플레이어 + 타이머 */}
      <div className="flex flex-col items-center mt-4 mb-2 gap-2">
        <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md">
          {isAITurn ? (
            <span className="font-bold text-lg text-stone-400 animate-pulse">{txt.aiThinking}</span>
          ) : (
            <>
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 ${stoneClass(currentPlayer)}`}
                aria-hidden="true"
              />
              <span className="font-bold text-stone-700">
                {currentPlayer === 'black' ? txt.blackTurn : txt.whiteTurn}
              </span>
              {!winner && (
                <span className={`font-mono font-bold text-lg w-8 text-right transition-colors duration-300 ${
                  timerLow ? 'text-red-500' : 'text-stone-400'
                }`}>
                  {timeLeft}
                </span>
              )}
            </>
          )}
        </div>

        {/* 타이머 바 — 항상 렌더링하여 레이아웃 이동 방지 */}
        <div className={`w-48 h-1.5 rounded-full overflow-hidden ${!winner && !isAITurn ? 'bg-stone-200' : 'invisible'}`}>
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${
              timerLow ? 'bg-red-500' : 'bg-stone-400'
            }`}
            style={{ width: `${timerRatio * 100}%` }}
          />
        </div>
      </div>

      {/* 보드 */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className={`${GOMOKU_BOARD_BG} p-3 rounded-xl shadow-lg`}>
          <div className="relative" style={{ width: BOARD_PX, height: BOARD_PX }}>

            {/* SVG 격자 */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={BOARD_PX}
              height={BOARD_PX}
            >
              <g stroke="rgba(92,73,56,0.55)" strokeWidth="1" fill="none">
                {Array.from({ length: BOARD_SIZE }, (_, i) => {
                  const pos = i * CELL + HALF;
                  return (
                    <g key={i}>
                      <line x1={HALF} y1={pos} x2={BOARD_PX - HALF} y2={pos} />
                      <line x1={pos} y1={HALF} x2={pos} y2={BOARD_PX - HALF} />
                    </g>
                  );
                })}
              </g>
              {STAR_POINTS.map(([r, c]) => (
                <circle
                  key={`${r},${c}`}
                  cx={c * CELL + HALF}
                  cy={r * CELL + HALF}
                  r={4}
                  fill="rgba(92,73,56,0.7)"
                />
              ))}
            </svg>

            {/* 클릭 격자 */}
            <div
              className="absolute inset-0"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL}px)` }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isWin = winSet?.has(`${r},${c}`) ?? false;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handlePlace(r, c)}
                      disabled={!!cell || !!winner || isAITurn}
                      className="group relative flex items-center justify-center focus:outline-none"
                      style={{ width: CELL, height: CELL }}
                      aria-label={`${r + 1}행 ${c + 1}열`}
                    >
                      {/* 호버 미리보기 */}
                      {!cell && !winner && !isAITurn && (
                        <div
                          className={`rounded-full opacity-0 group-hover:opacity-35 transition-opacity duration-150 pointer-events-none ${stoneClass(currentPlayer)}`}
                          style={{ width: CELL * 0.82, height: CELL * 0.82 }}
                          aria-hidden="true"
                        />
                      )}
                      {/* 돌 */}
                      {cell && (
                        <div
                          className={`rounded-full pointer-events-none transition-transform duration-150 ${stoneClass(cell)} ${isWin ? GOMOKU_WIN_RING : ''}`}
                          style={{ width: CELL * 0.82, height: CELL * 0.82 }}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 승리 오버레이 — 반투명 바텀시트 */}
      {winner && (
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5" aria-hidden="true" />
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl" aria-hidden="true">
                {winner === 'black' ? '⚫' : '⚪'}
              </div>
              <h2 className="text-2xl font-black text-stone-800">
                {winner === 'black' ? txt.blackWins : txt.whiteWins}
              </h2>
              {isTimeout && (
                <p className="text-stone-500 text-sm">{txt.timeout}</p>
              )}
              <div className="flex gap-3 w-full max-w-xs mt-2">
                <button
                  onClick={handleReset}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-150 active:scale-95 ${STATE_COLORS.primary}`}
                >
                  {txt.playAgain}
                </button>
                <button
                  onClick={handleBack}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all duration-150 active:scale-95 ${STATE_COLORS.secondary}`}
                >
                  {txt.goHome}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
