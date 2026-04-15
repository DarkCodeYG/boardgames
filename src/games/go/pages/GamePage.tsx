import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { useGoStore } from '../store/game-store';
import { STAR_POINTS } from '../lib/game-engine';
import { getAIMove } from '../lib/ai';
import type { Player } from '../lib/types';
import { TEXTS } from '../lib/i18n';
import {
  sfxStonePlace, sfxVictory, sfxClick, sfxModalOpen,
  sfxTimerTick, sfxTimerUp,
} from '../../../lib/sound';
import {
  STATE_COLORS,
  GO_STONE_BLACK,
  GO_STONE_WHITE,
  GO_BOARD_BG,
} from '../../../lib/colors';
import Modal from '../../../components/Modal';

const TURN_TIME = 60;

const stoneClass = (p: Player) =>
  p === 'black' ? GO_STONE_BLACK : GO_STONE_WHITE;

interface Props {
  onGoHome: () => void;
}

export default function GoGame({ onGoHome }: Props) {
  const { lang } = useGameStore();
  const {
    board, boardSize, currentPlayer, winner, winReason, score, komi,
    captures, lastMove, moveCount, consecutivePasses,
    history, isReviewMode, reviewIndex, showResult,
    mode, timerEnabled,
    placeStone, pass, resign, timeout: timeoutAction, resetGame,
    enterReview, showResultPanel, hideResultPanel,
    reviewGoTo, reviewNext, reviewPrev,
  } = useGoStore();
  const txt = TEXTS[lang];

  // ─── 셀 크기 계산 (마운트 시 한 번만) ───────────────────
  const [CELL] = useState(() => {
    const maxCell = boardSize === 19 ? 34 : boardSize === 13 ? 44 : 58;
    const availW = window.innerWidth - 20;
    const availH = window.innerHeight - 230;
    return Math.min(Math.floor(Math.min(availW, availH) / boardSize), maxCell);
  });
  const BOARD_PX = boardSize * CELL;
  const HALF = CELL / 2;

  const starPoints = STAR_POINTS[boardSize];
  const starSet = useMemo(
    () => new Set(starPoints.map(([r, c]) => `${r},${c}`)),
    [starPoints],
  );

  // AI 턴 여부
  const isAITurn = mode === 'pve' && !winner && currentPlayer === 'white' && !isReviewMode;

  // ─── 기보 리뷰: 표시할 상태 결정 ───────────────────────
  const displayState = isReviewMode ? history[reviewIndex] : { board, lastMove, captures, currentPlayer, moveCount };
  const displayBoard    = displayState.board;
  const displayLastMove = displayState.lastMove;
  const displayCaptures = displayState.captures;
  const displayMoveNum  = isReviewMode ? reviewIndex : moveCount;

  // ─── 타이머 ──────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const isTimeoutRef = useRef(false);

  // ─── 자동재생 ────────────────────────────────────────────
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // ─── 기권 확인 모달 ──────────────────────────────────────
  const [showResignModal, setShowResignModal] = useState(false);

  // 게임 페이지 진입 시 항상 새 게임으로 초기화
  useEffect(() => {
    isTimeoutRef.current = false;
    resetGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 매 수마다 타이머 리셋 (타이머 off, 리뷰 모드, AI 턴, 게임 종료 제외)
  useEffect(() => {
    if (!timerEnabled || winner || isReviewMode || isAITurn) return;
    setTimeLeft(TURN_TIME);
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [moveCount, winner, isReviewMode, isAITurn, timerEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // 타이머 소진 처리
  useEffect(() => {
    if (!timerEnabled || winner || isReviewMode || isAITurn) return;
    if (timeLeft === 0) {
      isTimeoutRef.current = true;
      sfxTimerUp();
      timeoutAction();
    } else if (timeLeft <= 10) {
      sfxTimerTick();
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // 게임 종료 시 승리 효과음 + 결과 패널
  useEffect(() => {
    if (!winner) return;
    if (!isTimeoutRef.current) {
      sfxVictory();
      sfxModalOpen();
    }
  }, [winner]);

  // AI 착수 (PvE 모드, 백 차례)
  useEffect(() => {
    if (!isAITurn) return;
    const liveState = useGoStore.getState();
    const t = setTimeout(() => {
      const move = getAIMove(liveState, liveState.difficulty);
      if (move) {
        sfxStonePlace();
        useGoStore.getState().placeStone(move[0], move[1]);
      } else {
        // 둘 곳 없으면 패스
        sfxClick();
        useGoStore.getState().pass();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [currentPlayer, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  // 자동재생
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      const s = useGoStore.getState();
      if (s.reviewIndex >= s.history.length - 1) {
        setIsAutoPlaying(false);
        return;
      }
      s.reviewNext();
    }, 800);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // 끝에 도달하면 자동재생 중단
  useEffect(() => {
    if (isAutoPlaying && reviewIndex >= history.length - 1) {
      setIsAutoPlaying(false);
    }
  }, [reviewIndex, isAutoPlaying, history.length]);

  // ─── 핸들러 ──────────────────────────────────────────────
  const handlePlace = (r: number, c: number) => {
    if (winner || isReviewMode || isAITurn || displayBoard[r][c]) return;
    sfxStonePlace();
    placeStone(r, c);
  };

  const handlePass = () => {
    if (winner || isReviewMode || isAITurn) return;
    sfxClick();
    pass();
  };

  const handleResignConfirm = () => {
    setShowResignModal(false);
    sfxClick();
    resign();
  };

  const handleReset = () => {
    sfxClick();
    isTimeoutRef.current = false;
    setIsAutoPlaying(false);
    resetGame();
  };

  const handleBack = () => { sfxClick(); onGoHome(); };

  const handleEnterReview = () => {
    sfxClick();
    setIsAutoPlaying(false);
    enterReview();
  };

  const handleToggleResult = () => {
    sfxClick();
    if (showResult) hideResultPanel(); else showResultPanel();
  };

  const timerRatio = timeLeft / TURN_TIME;
  const timerLow   = timeLeft <= 10;

  // 승리 이유 텍스트
  const winReasonText =
    winReason === 'resign'  ? txt.winByResign  :
    winReason === 'timeout' ? txt.winByTimeout :
    txt.winByScore;

  const scoreMargin = score ? Math.abs(score.black - score.white) : 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col relative">

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        {isReviewMode ? (
          <>
            <button
              onClick={handleToggleResult}
              className="text-amber-600 hover:text-amber-800 font-bold text-sm transition-colors duration-150"
            >
              {txt.reviewExit}
            </button>
            <div className="text-center">
              <h1 className="text-lg font-black text-amber-900">{txt.title}</h1>
              <p className="text-xs text-amber-500">
                {displayMoveNum}{txt.reviewMove} / {txt.reviewTotal} {history.length - 1}{txt.reviewMove}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-amber-400 hover:text-amber-600 text-sm font-medium transition-colors duration-150"
            >
              {txt.reset}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="text-amber-600 hover:text-amber-800 font-bold transition-colors duration-150"
            >
              ← {txt.back}
            </button>
            <h1 className="text-xl font-black text-amber-900">{txt.title}</h1>
            <button
              onClick={handleReset}
              className="text-amber-400 hover:text-amber-600 text-sm font-medium transition-colors duration-150"
            >
              {txt.reset}
            </button>
          </>
        )}
      </header>

      {/* ── 상태 표시 (게임 중) ───────────────────────────── */}
      {!isReviewMode && (
        <div className="flex flex-col items-center mt-3 mb-1 gap-2">
          <div className="flex items-center gap-2">
            {/* 패스 버튼 */}
            {!winner && (
              <button
                onClick={handlePass}
                disabled={isAITurn}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full text-sm font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-30"
              >
                {txt.pass}
              </button>
            )}

            {/* 플레이어 / AI 인디케이터 */}
            <div className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 shadow-md">
              {isAITurn ? (
                <span className="font-bold text-amber-500 animate-pulse text-sm">{txt.aiThinking}</span>
              ) : (
                <>
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 ${stoneClass(currentPlayer)}`}
                    aria-hidden="true"
                  />
                  <span className="font-bold text-amber-800 text-sm">
                    {currentPlayer === 'black' ? txt.blackTurn : txt.whiteTurn}
                  </span>
                  {timerEnabled && !winner && (
                    <span className={`font-mono font-bold text-base w-7 text-right transition-colors duration-300 ${
                      timerLow ? 'text-red-500' : 'text-amber-400'
                    }`}>
                      {timeLeft}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* 기권 버튼 */}
            {!winner && (
              <button
                onClick={() => { sfxClick(); setShowResignModal(true); }}
                disabled={isAITurn}
                className="px-3 py-1.5 bg-amber-100 hover:bg-red-100 text-amber-600 hover:text-red-600 rounded-full text-sm font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-30"
              >
                {txt.resign}
              </button>
            )}
          </div>

          {/* 타이머 바 */}
          {timerEnabled && (
            <div className={`w-48 h-1.5 rounded-full overflow-hidden ${!winner && !isAITurn ? 'bg-amber-200' : 'invisible'}`}>
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${
                  timerLow ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${timerRatio * 100}%` }}
              />
            </div>
          )}

          {/* 따낸 돌 + 연속 패스 */}
          <div className="flex items-center gap-4 text-xs text-amber-600">
            <span>
              {txt.capturedLabel}:{' '}
              <span className="font-bold text-stone-800">⚫ {displayCaptures.black}</span>
              {' / '}
              <span className="font-bold text-stone-500">⚪ {displayCaptures.white}</span>
            </span>
            {consecutivePasses > 0 && (
              <span className="text-amber-400">{txt.consecutivePasses(consecutivePasses)}</span>
            )}
          </div>
        </div>
      )}

      {/* ── 바둑판 ───────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-2 py-1">
        <div className={`${GO_BOARD_BG} p-2 rounded-xl shadow-lg`}>
          <div className="relative" style={{ width: BOARD_PX, height: BOARD_PX }}>

            {/* SVG 격자 */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={BOARD_PX}
              height={BOARD_PX}
            >
              <g stroke="rgba(101,67,33,0.6)" strokeWidth="0.8" fill="none">
                {Array.from({ length: boardSize }, (_, i) => {
                  const pos = i * CELL + HALF;
                  return (
                    <g key={i}>
                      <line x1={HALF} y1={pos} x2={BOARD_PX - HALF} y2={pos} />
                      <line x1={pos} y1={HALF} x2={pos} y2={BOARD_PX - HALF} />
                    </g>
                  );
                })}
              </g>
              {/* 화점 */}
              {starPoints.map(([r, c]) => (
                <circle
                  key={`${r},${c}`}
                  cx={c * CELL + HALF}
                  cy={r * CELL + HALF}
                  r={CELL > 28 ? 3.5 : 2.5}
                  fill="rgba(101,67,33,0.75)"
                />
              ))}
            </svg>

            {/* 교차점 버튼 격자 */}
            <div
              className="absolute inset-0"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${boardSize}, ${CELL}px)` }}
            >
              {displayBoard.map((row, r) =>
                row.map((cell, c) => {
                  const isLastMove = displayLastMove?.[0] === r && displayLastMove?.[1] === c;
                  const isStar     = starSet.has(`${r},${c}`);
                  const canPlay    = !cell && !winner && !isReviewMode && !isAITurn;

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handlePlace(r, c)}
                      disabled={!!cell || !!winner || isReviewMode || isAITurn}
                      className="group relative flex items-center justify-center focus:outline-none"
                      style={{ width: CELL, height: CELL }}
                      aria-label={`${r + 1}행 ${c + 1}열`}
                    >
                      {/* 화점 강조 */}
                      {!cell && isStar && (
                        <div
                          className="absolute rounded-full bg-amber-800/40 pointer-events-none"
                          style={{ width: CELL > 28 ? 6 : 5, height: CELL > 28 ? 6 : 5 }}
                          aria-hidden="true"
                        />
                      )}

                      {/* 호버 미리보기 */}
                      {canPlay && (
                        <div
                          className={`rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-100 pointer-events-none ${stoneClass(currentPlayer)}`}
                          style={{ width: CELL * 0.86, height: CELL * 0.86 }}
                          aria-hidden="true"
                        />
                      )}

                      {/* 돌 */}
                      {cell && (
                        <div
                          className={`relative rounded-full pointer-events-none ${stoneClass(cell)}`}
                          style={{ width: CELL * 0.88, height: CELL * 0.88 }}
                          aria-hidden="true"
                        >
                          {/* 마지막 착점 마커 */}
                          {isLastMove && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {isReviewMode ? (
                                <span
                                  className={`font-black leading-none select-none ${
                                    cell === 'black' ? 'text-white' : 'text-stone-700'
                                  }`}
                                  style={{ fontSize: Math.max(8, CELL * 0.38) }}
                                >
                                  {displayMoveNum > 99 ? '…' : displayMoveNum}
                                </span>
                              ) : (
                                <div
                                  className="rounded-full bg-red-500"
                                  style={{ width: CELL * 0.28, height: CELL * 0.28 }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── 리뷰 컨트롤 바 ───────────────────────────────── */}
      {isReviewMode && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-amber-100 px-4 py-3 shadow-lg">
          {/* 따낸 돌 (리뷰 시점 기준) */}
          <div className="flex justify-center text-xs text-amber-600 mb-2">
            <span>
              {txt.capturedLabel}:{' '}
              <span className="font-bold text-stone-800">⚫ {displayCaptures.black}</span>
              {' / '}
              <span className="font-bold text-stone-500">⚪ {displayCaptures.white}</span>
            </span>
          </div>

          {/* 슬라이더 + 이전/다음 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { sfxClick(); reviewGoTo(0); }}
              className="text-amber-600 hover:text-amber-800 font-bold text-base transition-colors duration-150 w-8 text-center"
              aria-label="처음으로"
            >
              ◀◀
            </button>
            <button
              onClick={() => { sfxClick(); reviewPrev(); }}
              className="text-amber-600 hover:text-amber-800 font-bold text-base transition-colors duration-150 w-8 text-center"
              aria-label="이전 수"
            >
              ◀
            </button>
            <input
              type="range"
              min={0}
              max={history.length - 1}
              value={reviewIndex}
              onChange={(e) => reviewGoTo(Number(e.target.value))}
              className="flex-1 accent-amber-700 h-2 cursor-pointer"
              aria-label="기보 탐색"
            />
            <button
              onClick={() => { sfxClick(); reviewNext(); }}
              className="text-amber-600 hover:text-amber-800 font-bold text-base transition-colors duration-150 w-8 text-center"
              aria-label="다음 수"
            >
              ▶
            </button>
            <button
              onClick={() => { sfxClick(); reviewGoTo(history.length - 1); }}
              className="text-amber-600 hover:text-amber-800 font-bold text-base transition-colors duration-150 w-8 text-center"
              aria-label="끝으로"
            >
              ▶▶
            </button>
          </div>

          {/* 자동재생 */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setIsAutoPlaying(p => !p)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 ${
                isAutoPlaying
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              <span aria-hidden="true">{isAutoPlaying ? '⏸' : '▶'}</span>
              {isAutoPlaying ? txt.reviewPause : txt.reviewAutoPlay}
            </button>
          </div>
        </div>
      )}

      {/* ── 기권 확인 모달 ───────────────────────────────── */}
      {showResignModal && (
        <Modal titleId="resign-title" onClose={() => setShowResignModal(false)}>
          <p id="resign-title" className="text-stone-700 font-bold text-lg mb-5">
            {txt.resignConfirm}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowResignModal(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-150 active:scale-95 ${STATE_COLORS.secondary}`}
            >
              {txt.cancel}
            </button>
            <button
              onClick={handleResignConfirm}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-150 active:scale-95 ${STATE_COLORS.danger}`}
            >
              {txt.resignOk}
            </button>
          </div>
        </Modal>
      )}

      {/* ── 게임 종료 결과 바텀시트 ─────────────────────── */}
      {winner && showResult && (
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5" aria-hidden="true" />
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl" aria-hidden="true">
                {winner === 'black' ? '⚫' : '⚪'}
              </div>
              <h2 className="text-2xl font-black text-stone-800">
                {winner === 'black' ? txt.blackWins : txt.whiteWins}
              </h2>
              <p className="text-sm text-amber-600 font-medium">{winReasonText}</p>

              {/* 점수 (집계산 시) */}
              {score && (
                <div className="w-full max-w-xs bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded-full bg-gradient-to-br from-stone-700 to-stone-900" aria-hidden="true" />
                      {txt.blackScore}
                    </span>
                    <span className="text-stone-800">{score.black}점</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded-full bg-white border-2 border-stone-300" aria-hidden="true" />
                      {txt.whiteScore}
                      <span className="text-xs font-normal text-amber-500">(+{komi} {txt.komiLabel})</span>
                    </span>
                    <span className="text-stone-800">{score.white}점</span>
                  </div>
                  <div className="border-t border-amber-200 pt-2 text-center text-sm text-amber-700 font-bold">
                    {txt.winMargin(scoreMargin)}
                  </div>
                </div>
              )}

              <div className="flex gap-3 w-full max-w-xs mt-1">
                <button
                  onClick={handleEnterReview}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  {txt.reviewGame}
                </button>
                <button
                  onClick={handleReset}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 ${STATE_COLORS.primary}`}
                >
                  {txt.playAgain}
                </button>
              </div>
              <button
                onClick={handleBack}
                className={`w-full max-w-xs py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 ${STATE_COLORS.secondary}`}
              >
                {txt.goHome}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 중: 결과 미니 배지 */}
      {winner && !showResult && isReviewMode && (
        <button
          onClick={handleToggleResult}
          className="absolute top-14 right-4 z-40 bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all duration-150"
        >
          {winner === 'black' ? txt.blackWins : txt.whiteWins}
        </button>
      )}
    </div>
  );
}
