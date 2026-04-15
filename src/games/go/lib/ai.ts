import { placeStone, passMove, calculateScore, isLegalMove } from './game-engine';
import type { Board, GoState, Player } from './types';

export type Difficulty = 'easy' | 'medium' | 'hard';

const DIRS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

/**
 * 패스 판단 기준 점수 (이 이하면 유효한 수가 없다고 판단).
 * scoreMove의 pure noise 범위(0~3) + 최대 center bonus(4) = ~7.
 * 따냄 기회 최소 점수(25)보다 낮게 설정.
 */
const PASS_SCORE_THRESHOLD = 14;

// ─── 공통 유틸 ────────────────────────────────────────────

/** 기존 돌 주변 N칸 이내 빈 교차점 후보 */
function getCandidates(board: Board, size: number, radius = 2): [number, number][] {
  const flat = board.flat();
  const hasStones = flat.some(c => c !== null);

  if (!hasStones) {
    const center = Math.floor(size / 2);
    return [[center, center]];
  }

  const seen = new Set<number>();
  const result: [number, number][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c]) continue;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
          if (board[nr][nc] !== null) continue;
          const key = nr * size + nc;
          if (!seen.has(key)) { seen.add(key); result.push([nr, nc]); }
        }
      }
    }
  }
  return result;
}

/** 특정 위치 돌 그룹의 활로(기, 氣) 수 */
function groupLiberties(board: Board, startR: number, startC: number, size: number): number {
  const player = board[startR][startC];
  if (!player) return 0;

  const visited = new Set<number>();
  const stack: [number, number][] = [[startR, startC]];
  const libs = new Set<number>();

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = r * size + c;
    if (visited.has(key)) continue;
    visited.add(key);

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (board[nr][nc] === null) libs.add(nr * size + nc);
      else if (board[nr][nc] === player && !visited.has(nr * size + nc)) stack.push([nr, nc]);
    }
  }
  return libs.size;
}

/**
 * 후반전 여부 판단.
 * - 9x9: 35수 이상
 * - 13x13: 70수 이상
 * - 19x19: 120수 이상
 */
function isLateGame(state: GoState): boolean {
  const threshold = state.boardSize <= 9 ? 35 : state.boardSize <= 13 ? 70 : 120;
  return state.moveCount > threshold;
}

/**
 * 점수차로 역전 불가 여부 확인.
 * 남은 빈 칸의 절반을 모두 AI가 가져가도 이길 수 없으면 true.
 */
function isHopeless(state: GoState): boolean {
  const { board, boardSize, komi, currentPlayer } = state;
  const currentScore = calculateScore(board, boardSize, komi);
  const aiScore  = currentPlayer === 'white' ? currentScore.white : currentScore.black;
  const oppScore = currentPlayer === 'white' ? currentScore.black : currentScore.white;
  const remaining = board.flat().filter(c => c === null).length;
  // AI가 남은 빈 칸의 절반을 차지해도 이길 수 없으면 hopeless
  return oppScore > aiScore + remaining * 0.55;
}

// ─── Easy: 무작위 착수 ────────────────────────────────────

function getEasyMove(state: GoState): [number, number] | null {
  const candidates = getCandidates(state.board, state.boardSize, 3);
  const legal = candidates.filter(([r, c]) => isLegalMove(state, r, c));
  if (legal.length === 0) return null;

  // 후반전 + 역전 불가 → 25% 확률로 패스 (게임이 끝날 수 있게)
  if (isLateGame(state) && isHopeless(state) && Math.random() < 0.25) return null;

  return legal[Math.floor(Math.random() * legal.length)];
}

// ─── Medium: 휴리스틱 ─────────────────────────────────────

function scoreMove(state: GoState, r: number, c: number): number {
  const size = state.boardSize;
  const opponent: Player = state.currentPlayer === 'black' ? 'white' : 'black';

  let score = Math.random() * 3; // 소량의 노이즈

  // 인접 상대 그룹 압박 / 따냄
  const checkedOpp = new Set<number>();
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (state.board[nr][nc] !== opponent) continue;
    const key = nr * size + nc;
    if (checkedOpp.has(key)) continue;
    checkedOpp.add(key);
    const libs = groupLiberties(state.board, nr, nc, size);
    if (libs === 1) score += 120; // 상대 단수 → 따낼 수 있음
    else if (libs === 2) score += 25;
  }

  // 인접 자신 그룹 단수 구출
  const checkedOwn = new Set<number>();
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (state.board[nr][nc] !== state.currentPlayer) continue;
    const key = nr * size + nc;
    if (checkedOwn.has(key)) continue;
    checkedOwn.add(key);
    const libs = groupLiberties(state.board, nr, nc, size);
    if (libs === 1) score += 90; // 자신의 단수 구출
  }

  // 착수 시뮬레이션
  const next = placeStone(state, r, c);
  if (!next) return -9999;

  // 착수 후 자신 그룹 활로
  const libsAfter = groupLiberties(next.board, r, c, size);
  if (libsAfter === 1) score -= 80; // 착수 후 단수 — 나쁨
  if (libsAfter === 0) return -9999; // 자살수

  // 중앙 선호 (약하게)
  const center = Math.floor(size / 2);
  const dist = Math.abs(r - center) + Math.abs(c - center);
  score += Math.max(0, 4 - dist * 0.3);

  return score;
}

function getMediumMove(state: GoState): [number, number] | null {
  const candidates = getCandidates(state.board, state.boardSize, 2);
  const scored = candidates
    .map(([r, c]) => ({ r, c, score: scoreMove(state, r, c) }))
    .filter(m => m.score > -9999)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  // 후반전에서 유효한 수(따냄/구출)가 없으면 패스
  if (isLateGame(state) && scored[0].score < PASS_SCORE_THRESHOLD) return null;

  // 역전 불가능한 상황이면 즉시 패스
  if (isHopeless(state) && scored[0].score < PASS_SCORE_THRESHOLD * 2) return null;

  // 상위 3개 중 랜덤 (과결정 방지)
  const top = scored.slice(0, Math.min(3, scored.length));
  const pick = top[Math.floor(Math.random() * top.length)];
  return [pick.r, pick.c];
}

// ─── Hard: MCTS (몬테카를로 트리 탐색) ───────────────────

interface MCTSNode {
  state: GoState;
  move: [number, number] | null;
  parent: MCTSNode | null;
  children: MCTSNode[];
  wins: number;
  visits: number;
  untriedMoves: [number, number][];
}

const UCT_C = Math.SQRT2;

function uctScore(node: MCTSNode): number {
  if (node.visits === 0) return Infinity;
  const parentVisits = node.parent!.visits;
  return node.wins / node.visits + UCT_C * Math.sqrt(Math.log(parentVisits) / node.visits);
}

function selectChild(node: MCTSNode): MCTSNode {
  return node.children.reduce((best, c) => uctScore(c) > uctScore(best) ? c : best);
}

/** 무작위 롤아웃: 게임 종료까지 랜덤 진행 후 승자 반환 */
function simulate(state: GoState, _aiPlayer: Player): Player {
  let s = state;
  const maxMoves = Math.min(s.boardSize * s.boardSize, 80);
  let moves = 0;
  let passCnt = 0;

  while (!s.winner && moves < maxMoves) {
    const candidates = getCandidates(s.board, s.boardSize, 2);
    const sample = candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, 15)
      .filter(([r, c]) => isLegalMove(s, r, c));

    if (sample.length === 0) {
      s = passMove(s);
      passCnt++;
      if (passCnt >= 2) break;
    } else {
      passCnt = 0;
      const [r, c] = sample[Math.floor(Math.random() * sample.length)];
      s = placeStone(s, r, c) ?? passMove(s);
    }
    moves++;
  }

  if (s.winner) return s.winner;

  const score = calculateScore(s.board, s.boardSize, s.komi);
  return score.black > score.white ? 'black' : 'white';
}

function getHardMove(state: GoState, iterations: number): [number, number] | null {
  // 역전 불가 상황이면 즉시 패스
  if (isHopeless(state)) return null;

  const initialCandidates = getCandidates(state.board, state.boardSize, 2)
    .filter(([r, c]) => isLegalMove(state, r, c));

  if (initialCandidates.length === 0) return null;

  // 후반전에서 휴리스틱 점수로 먼저 패스 여부 확인 (MCTS 시작 전 조기 판단)
  if (isLateGame(state)) {
    const sample = initialCandidates.slice(0, Math.min(10, initialCandidates.length));
    const bestScore = Math.max(...sample.map(([r, c]) => scoreMove(state, r, c)));
    if (bestScore < PASS_SCORE_THRESHOLD) return null;
  }

  if (initialCandidates.length === 1) return initialCandidates[0];

  const root: MCTSNode = {
    state,
    move: null,
    parent: null,
    children: [],
    wins: 0,
    visits: 0,
    untriedMoves: [...initialCandidates].sort(() => Math.random() - 0.5),
  };

  for (let i = 0; i < iterations; i++) {
    let node = root;

    // Selection
    while (node.untriedMoves.length === 0 && node.children.length > 0) {
      node = selectChild(node);
    }

    // Expansion
    if (node.untriedMoves.length > 0) {
      const [r, c] = node.untriedMoves.pop()!;
      const newState = placeStone(node.state, r, c);
      if (!newState) continue;

      const childCandidates = getCandidates(newState.board, newState.boardSize, 2)
        .filter(([nr, nc]) => isLegalMove(newState, nr, nc))
        .sort(() => Math.random() - 0.5);

      const child: MCTSNode = {
        state: newState,
        move: [r, c],
        parent: node,
        children: [],
        wins: 0,
        visits: 0,
        untriedMoves: childCandidates,
      };
      node.children.push(child);
      node = child;
    }

    // Simulation
    const winner = simulate(node.state, state.currentPlayer);

    // Backpropagation
    let n: MCTSNode | null = node;
    while (n !== null) {
      n.visits++;
      if (winner === state.currentPlayer) n.wins++;
      n = n.parent;
    }
  }

  if (root.children.length === 0) {
    return initialCandidates[Math.floor(Math.random() * initialCandidates.length)];
  }

  // 방문 횟수가 가장 많은 수 선택
  return root.children.reduce((a, b) => a.visits > b.visits ? a : b).move;
}

// ─── 공개 인터페이스 ──────────────────────────────────────

/**
 * 난이도에 따른 AI 착수 좌표 반환.
 * null 반환 시 패스를 의미.
 */
export function getAIMove(state: GoState, difficulty: Difficulty): [number, number] | null {
  switch (difficulty) {
    case 'easy':   return getEasyMove(state);
    case 'medium': return getMediumMove(state);
    case 'hard': {
      const iters = state.boardSize === 9 ? 320 : state.boardSize === 13 ? 150 : 60;
      return getHardMove(state, iters);
    }
  }
}
