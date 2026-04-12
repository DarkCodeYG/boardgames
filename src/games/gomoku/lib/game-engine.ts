import type { Board, Cell, GomokuState, Player } from './types';

export const BOARD_SIZE = 15;

export const STAR_POINTS: [number, number][] = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11],
];

const STAR_SET = new Set(STAR_POINTS.map(([r, c]) => r * BOARD_SIZE + c));

export function isStarPoint(r: number, c: number): boolean {
  return STAR_SET.has(r * BOARD_SIZE + c);
}

export function createGame(): GomokuState {
  return {
    board: Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null)),
    currentPlayer: 'black',
    winner: null,
    winLine: null,
    moveCount: 0,
  };
}

export function placeStone(state: GomokuState, row: number, col: number): GomokuState {
  if (state.winner || state.board[row][col] !== null) return state;

  const board = state.board.map(r => [...r]);
  board[row][col] = state.currentPlayer;

  const winLine = checkWin(board, row, col, state.currentPlayer);

  return {
    board,
    currentPlayer: winLine
      ? state.currentPlayer
      : state.currentPlayer === 'black' ? 'white' : 'black',
    winner: winLine ? state.currentPlayer : null,
    winLine,
    moveCount: state.moveCount + 1,
  };
}

function checkWin(board: Board, row: number, col: number, player: Player): [number, number][] | null {
  const N = BOARD_SIZE;
  const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of DIRS) {
    const line: [number, number][] = [[row, col]];

    for (let i = 1; i < N; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= N || c < 0 || c >= N || board[r][c] !== player) break;
      line.push([r, c]);
    }
    for (let i = 1; i < N; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= N || c < 0 || c >= N || board[r][c] !== player) break;
      line.push([r, c]);
    }

    if (line.length >= 5) return line;
  }
  return null;
}
