import type { Board, Difficulty, Player } from './types';
import { BOARD_SIZE, DIRS, checkWin } from './game-engine';

function isWinAt(board: Board, r: number, c: number): boolean {
  const p = board[r][c];
  return p != null && checkWin(board, r, c, p) !== null;
}

function getCandidates(board: Board): [number, number][] {
  const seen = new Uint8Array(BOARD_SIZE * BOARD_SIZE);
  const result: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
          if (board[nr][nc]) continue;
          const idx = nr * BOARD_SIZE + nc;
          if (!seen[idx]) { seen[idx] = 1; result.push([nr, nc]); }
        }
      }
    }
  }
  return result.length ? result : [[7, 7]];
}

// Board evaluation from aiPlayer's perspective
function evaluate(board: Board, aiPlayer: Player): number {
  const opp: Player = aiPlayer === 'black' ? 'white' : 'black';
  let score = 0;

  const scan = (cells: (Player | null)[]) => {
    for (let i = 0; i <= cells.length - 5; i++) {
      let ai = 0, op = 0;
      for (let j = 0; j < 5; j++) {
        if (cells[i + j] === aiPlayer) ai++;
        else if (cells[i + j] === opp) op++;
      }
      if (op === 0) score += ai === 4 ? 10000 : ai === 3 ? 500 : ai === 2 ? 50 : 5;
      if (ai === 0) score -= op === 4 ? 10000 : op === 3 ? 500 : op === 2 ? 50 : 5;
    }
  };

  const col = new Array<Player | null>(BOARD_SIZE);
  for (let i = 0; i < BOARD_SIZE; i++) {
    scan(board[i]);
    for (let r = 0; r < BOARD_SIZE; r++) col[r] = board[r][i];
    scan(col);
  }
  const d1: (Player | null)[] = [];
  const d2: (Player | null)[] = [];
  for (let s = -(BOARD_SIZE - 5); s <= BOARD_SIZE - 5; s++) {
    d1.length = 0; d2.length = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const c1 = r - s, c2 = BOARD_SIZE - 1 - r + s;
      if (c1 >= 0 && c1 < BOARD_SIZE) d1.push(board[r][c1]);
      if (c2 >= 0 && c2 < BOARD_SIZE) d2.push(board[r][c2]);
    }
    if (d1.length >= 5) scan(d1);
    if (d2.length >= 5) scan(d2);
  }
  return score;
}

// Local threat score at [r,c] for move ordering
function cellScore(board: Board, r: number, c: number, player: Player): number {
  const opp: Player = player === 'black' ? 'white' : 'black';
  board[r][c] = player;
  let s = 0;
  for (const [dr, dc] of DIRS) {
    let mine = 1, blocked = 0;
    for (let d = 1; d <= 4; d++) {
      const nr = r + dr * d, nc = c + dc * d;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blocked++; break; }
      if (board[nr][nc] === player) mine++;
      else { if (board[nr][nc] === opp) blocked++; break; }
    }
    for (let d = 1; d <= 4; d++) {
      const nr = r - dr * d, nc = c - dc * d;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blocked++; break; }
      if (board[nr][nc] === player) mine++;
      else { if (board[nr][nc] === opp) blocked++; break; }
    }
    if (blocked === 0) s += mine >= 4 ? 100000 : mine === 3 ? 10000 : mine === 2 ? 1000 : 100;
    else if (blocked === 1) s += mine >= 4 ? 50000 : mine === 3 ? 5000 : mine === 2 ? 500 : 50;
  }
  board[r][c] = null;
  return s;
}

function minimax(
  board: Board,
  lastR: number,
  lastC: number,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player,
): number {
  if (isWinAt(board, lastR, lastC)) {
    return board[lastR][lastC] === aiPlayer ? 100000 + depth : -(100000 + depth);
  }
  if (depth === 0) return evaluate(board, aiPlayer);

  const cur: Player = maximizing ? aiPlayer : (aiPlayer === 'black' ? 'white' : 'black');
  const sorted = getCandidates(board)
    .map(([r, c]) => ({ r, c, s: cellScore(board, r, c, cur) }))
    .sort((a, b) => maximizing ? b.s - a.s : a.s - b.s)
    .slice(0, 10);

  if (maximizing) {
    let best = -Infinity;
    for (const { r, c } of sorted) {
      board[r][c] = cur;
      const val = minimax(board, r, c, depth - 1, alpha, beta, false, aiPlayer);
      board[r][c] = null;
      if (val > best) best = val;
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const { r, c } of sorted) {
      board[r][c] = cur;
      const val = minimax(board, r, c, depth - 1, alpha, beta, true, aiPlayer);
      board[r][c] = null;
      if (val < best) best = val;
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function findWinMove(board: Board, player: Player, cands: [number, number][]): [number, number] | null {
  for (const [r, c] of cands) {
    board[r][c] = player;
    const win = isWinAt(board, r, c);
    board[r][c] = null;
    if (win) return [r, c];
  }
  return null;
}

export function getAIMove(boardIn: Board, aiPlayer: Player, difficulty: Difficulty): [number, number] {
  const board = boardIn.map(row => [...row]) as Board;
  const opp: Player = aiPlayer === 'black' ? 'white' : 'black';
  const cands = getCandidates(board);

  if (difficulty === 'easy') {
    return cands[Math.floor(Math.random() * cands.length)];
  }

  const win = findWinMove(board, aiPlayer, cands) ?? findWinMove(board, opp, cands);
  if (win) return win;

  if (difficulty === 'medium') {
    const scored = cands
      .map(([r, c]) => ({ r, c, s: cellScore(board, r, c, aiPlayer) + cellScore(board, r, c, opp) * 0.9 }))
      .sort((a, b) => b.s - a.s);
    const pick = Math.floor(Math.random() * Math.min(3, scored.length));
    return [scored[pick].r, scored[pick].c];
  }

  // Hard: minimax depth 3
  const roots = cands
    .map(([r, c]) => ({ r, c, s: cellScore(board, r, c, aiPlayer) + cellScore(board, r, c, opp) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 15);

  let bestScore = -Infinity;
  let bestMove: [number, number] = [roots[0].r, roots[0].c];

  for (const { r, c } of roots) {
    board[r][c] = aiPlayer;
    const score = minimax(board, r, c, 3, -Infinity, Infinity, false, aiPlayer);
    board[r][c] = null;
    if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
  }

  return bestMove;
}
