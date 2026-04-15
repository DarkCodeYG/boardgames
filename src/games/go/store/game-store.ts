import { create } from 'zustand';
import {
  createGame,
  placeStone as enginePlace,
  passMove as enginePass,
  resignGame,
  timeoutGame,
} from '../lib/game-engine';
import type { BoardSize, Difficulty, GameMode, GoState } from '../lib/types';

const DEFAULT_SIZE: BoardSize = 19;
const DEFAULT_KOMI = 6.5;

interface GoStore extends GoState {
  /** 매 수(pass 포함) 후의 GoState 스냅샷 — 기보 재생에 사용 */
  history: GoState[];
  /** 기보 리뷰 모드 여부 */
  isReviewMode: boolean;
  /** 현재 리뷰 중인 history 인덱스 */
  reviewIndex: number;
  /** 게임 종료 결과 패널(바텀시트) 표시 여부 */
  showResult: boolean;

  // ─── 설정 (게임 시작 전 홈에서 선택) ────────────────────
  mode: GameMode;
  difficulty: Difficulty;
  /** 턴 제한시간 사용 여부 (false면 타이머 없음) */
  timerEnabled: boolean;

  // ─── 게임 액션 ───────────────────────────────────────────
  placeStone: (row: number, col: number) => void;
  pass: () => void;
  resign: () => void;
  timeout: () => void;
  resetGame: () => void;
  setBoardSize: (size: BoardSize) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setTimerEnabled: (enabled: boolean) => void;

  // ─── 기보 리뷰 액션 ──────────────────────────────────────
  enterReview: () => void;
  showResultPanel: () => void;
  hideResultPanel: () => void;
  reviewGoTo: (index: number) => void;
  reviewNext: () => void;
  reviewPrev: () => void;
}

const initial = createGame(DEFAULT_SIZE, DEFAULT_KOMI);

export const useGoStore = create<GoStore>((set) => ({
  ...initial,
  history: [initial],
  isReviewMode: false,
  reviewIndex: 0,
  showResult: false,
  mode: 'pvp',
  difficulty: 'medium',
  timerEnabled: true,

  placeStone: (row, col) =>
    set((state) => {
      const newState = enginePlace(state, row, col);
      if (!newState) return state;
      return {
        ...state,
        ...newState,
        history: [...state.history, newState],
      };
    }),

  pass: () =>
    set((state) => {
      const newState = enginePass(state);
      return {
        ...state,
        ...newState,
        history: [...state.history, newState],
        showResult: !!newState.winner,
      };
    }),

  resign: () =>
    set((state) => {
      const newState = resignGame(state);
      return {
        ...state,
        ...newState,
        history: [...state.history, newState],
        showResult: true,
      };
    }),

  timeout: () =>
    set((state) => {
      const newState = timeoutGame(state);
      return {
        ...state,
        ...newState,
        history: [...state.history, newState],
        showResult: true,
      };
    }),

  resetGame: () =>
    set((state) => {
      const fresh = createGame(state.boardSize, DEFAULT_KOMI);
      return {
        ...state,
        ...fresh,
        history: [fresh],
        isReviewMode: false,
        reviewIndex: 0,
        showResult: false,
      };
    }),

  setBoardSize: (size) =>
    set((state) => {
      const fresh = createGame(size, DEFAULT_KOMI);
      return {
        ...state,
        ...fresh,
        history: [fresh],
        isReviewMode: false,
        reviewIndex: 0,
        showResult: false,
      };
    }),

  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setTimerEnabled: (timerEnabled) => set({ timerEnabled }),

  enterReview: () =>
    set((state) => ({
      isReviewMode: true,
      reviewIndex: state.history.length - 1,
      showResult: false,
    })),

  showResultPanel: () => set({ showResult: true }),
  hideResultPanel: () => set({ showResult: false }),

  reviewGoTo: (index) =>
    set((state) => ({
      reviewIndex: Math.max(0, Math.min(index, state.history.length - 1)),
    })),

  reviewNext: () =>
    set((state) => ({
      reviewIndex: Math.min(state.reviewIndex + 1, state.history.length - 1),
    })),

  reviewPrev: () =>
    set((state) => ({
      reviewIndex: Math.max(state.reviewIndex - 1, 0),
    })),
}));
