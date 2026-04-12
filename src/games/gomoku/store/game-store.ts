import { create } from 'zustand';
import { createGame, placeStone as enginePlaceStone } from '../lib/game-engine';
import type { Difficulty, GameMode, GomokuState } from '../lib/types';

const MAX_UNDO = 3;

interface GomokuStore extends GomokuState {
  placeStone: (row: number, col: number) => void;
  resetGame: () => void;
  forfeit: () => void;
  undo: () => void;
  mode: GameMode;
  difficulty: Difficulty;
  undoCount: number;
  history: GomokuState[];
  setMode: (mode: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
}

export const useGomokuStore = create<GomokuStore>((set) => ({
  ...createGame(),
  mode: 'pvp',
  difficulty: 'medium',
  undoCount: MAX_UNDO,
  history: [],
  placeStone: (row, col) => set((state) => {
    const newGameState = enginePlaceStone(state, row, col);
    // PvE: 인간(black) 착수 시만 스냅샷 저장 → undo 시 AI 응수까지 함께 취소
    // PvP: 매 착수마다 스냅샷 저장
    const shouldRecord = state.mode === 'pvp' || state.currentPlayer === 'black';
    if (!shouldRecord) return newGameState;
    const snapshot: GomokuState = {
      board: state.board,
      currentPlayer: state.currentPlayer,
      winner: state.winner,
      winLine: state.winLine,
      moveCount: state.moveCount,
    };
    return { ...newGameState, history: [...state.history, snapshot].slice(-MAX_UNDO) };
  }),
  resetGame: () => set((state) => ({
    ...createGame(),
    mode: state.mode,
    difficulty: state.difficulty,
    undoCount: MAX_UNDO,
    history: [],
  })),
  forfeit: () => set((state) => ({
    winner: state.currentPlayer === 'black' ? 'white' : 'black',
    winLine: null,
  })),
  undo: () => set((state) => {
    if (state.undoCount <= 0 || state.winner || state.history.length === 0) return state;
    const prev = state.history[state.history.length - 1];
    return {
      ...prev,
      history: state.history.slice(0, -1),
      undoCount: state.undoCount - 1,
    };
  }),
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
}));
