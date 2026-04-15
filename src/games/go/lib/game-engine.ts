import type { Board, BoardSize, Cell, GoState, Player } from './types';

const DIRS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

/** 각 판 크기의 화점(별) 위치 (0-indexed) */
export const STAR_POINTS: Record<BoardSize, [number, number][]> = {
  9:  [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]],
  13: [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]],
  19: [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]],
};

export function createGame(boardSize: BoardSize, komi = 6.5): GoState {
  return {
    board: Array.from({ length: boardSize }, () => Array<Cell>(boardSize).fill(null)),
    boardSize,
    currentPlayer: 'black',
    moveCount: 0,
    captures: { black: 0, white: 0 },
    lastMove: null,
    winner: null,
    winReason: null,
    score: null,
    consecutivePasses: 0,
    prevBoard: null,
    komi,
  };
}

/** BFS로 연결된 같은 색 돌 그룹을 반환 */
function getGroup(board: Board, startR: number, startC: number, size: number): [number, number][] {
  const player = board[startR][startC];
  if (!player) return [];

  const visited = new Set<number>();
  const group: [number, number][] = [];
  const stack: [number, number][] = [[startR, startC]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = r * size + c;
    if (visited.has(key)) continue;
    visited.add(key);
    group.push([r, c]);

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          !visited.has(nr * size + nc) && board[nr][nc] === player) {
        stack.push([nr, nc]);
      }
    }
  }
  return group;
}

/** 그룹의 기(氣) 개수 반환 */
function getLiberties(board: Board, group: [number, number][], size: number): number {
  const libs = new Set<number>();
  for (const [r, c] of group) {
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === null) {
        libs.add(nr * size + nc);
      }
    }
  }
  return libs.size;
}

function boardsEqual(a: Board, b: Board, size: number): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * 착수 가능 여부 확인 (착수금지, 자살수, 코 규칙)
 * UI에서 호버 미리보기 비활성화에 사용
 */
export function isLegalMove(state: GoState, row: number, col: number): boolean {
  if (state.board[row][col] !== null || state.winner) return false;

  const size = state.boardSize;
  const opponent: Player = state.currentPlayer === 'black' ? 'white' : 'black';

  // 복사본에서 시뮬레이션
  const testBoard: Board = state.board.map(r => [...r]);
  testBoard[row][col] = state.currentPlayer;

  // 인접 상대 그룹 따냄 시뮬레이션
  const checked = new Set<number>();
  let captured = false;

  for (const [dr, dc] of DIRS) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (testBoard[nr][nc] !== opponent) continue;
    const key = nr * size + nc;
    if (checked.has(key)) continue;

    const group = getGroup(testBoard, nr, nc, size);
    group.forEach(([r, c]) => checked.add(r * size + c));

    if (getLiberties(testBoard, group, size) === 0) {
      captured = true;
      for (const [gr, gc] of group) testBoard[gr][gc] = null;
    }
  }

  // 자살수 금지
  const ownGroup = getGroup(testBoard, row, col, size);
  if (getLiberties(testBoard, ownGroup, size) === 0) return false;

  // 코(패) 규칙: 따냄이 발생했을 때만 체크
  if (captured && state.prevBoard && boardsEqual(testBoard, state.prevBoard, size)) return false;

  return true;
}

/**
 * 착수 처리. 불법이면 null 반환, 성공하면 새 GoState 반환.
 */
export function placeStone(state: GoState, row: number, col: number): GoState | null {
  if (!isLegalMove(state, row, col)) return null;

  const size = state.boardSize;
  const opponent: Player = state.currentPlayer === 'black' ? 'white' : 'black';

  let newBoard: Board = state.board.map(r => [...r]);
  newBoard[row][col] = state.currentPlayer;

  let capturedCount = 0;
  const checked = new Set<number>();

  for (const [dr, dc] of DIRS) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (newBoard[nr][nc] !== opponent) continue;
    const key = nr * size + nc;
    if (checked.has(key)) continue;

    const group = getGroup(newBoard, nr, nc, size);
    group.forEach(([r, c]) => checked.add(r * size + c));

    if (getLiberties(newBoard, group, size) === 0) {
      capturedCount += group.length;
      for (const [gr, gc] of group) newBoard[gr][gc] = null;
    }
  }

  const captures = { ...state.captures };
  if (state.currentPlayer === 'black') captures.black += capturedCount;
  else captures.white += capturedCount;

  return {
    ...state,
    board: newBoard,
    currentPlayer: opponent,
    moveCount: state.moveCount + 1,
    captures,
    lastMove: [row, col],
    prevBoard: state.board,
    consecutivePasses: 0,
  };
}

/** 패스 처리. 2회 연속 패스 시 집계산 후 게임 종료. */
export function passMove(state: GoState): GoState {
  if (state.winner) return state;

  const opponent: Player = state.currentPlayer === 'black' ? 'white' : 'black';
  const newPasses = state.consecutivePasses + 1;

  if (newPasses >= 2) {
    const score = calculateScore(state.board, state.boardSize, state.komi);
    const winner: Player = score.black > score.white ? 'black' : 'white';
    return {
      ...state,
      currentPlayer: opponent,
      moveCount: state.moveCount + 1,
      consecutivePasses: newPasses,
      lastMove: null,
      prevBoard: null,
      winner,
      winReason: 'score',
      score,
    };
  }

  return {
    ...state,
    currentPlayer: opponent,
    moveCount: state.moveCount + 1,
    consecutivePasses: newPasses,
    lastMove: null,
    prevBoard: null,
  };
}

/** 기권 처리 */
export function resignGame(state: GoState): GoState {
  const winner: Player = state.currentPlayer === 'black' ? 'white' : 'black';
  return { ...state, winner, winReason: 'resign' };
}

/** 시간 초과 처리 */
export function timeoutGame(state: GoState): GoState {
  const winner: Player = state.currentPlayer === 'black' ? 'white' : 'black';
  return { ...state, winner, winReason: 'timeout' };
}

/**
 * 집계산 (Chinese counting):
 * 보드 위 돌 수 + 자신의 영역(빈칸) 합산
 * 백에게 코미 추가
 */
export function calculateScore(
  board: Board,
  boardSize: number,
  komi: number,
): { black: number; white: number } {
  let blackStones = 0;
  let whiteStones = 0;

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 'black') blackStones++;
      else if (board[r][c] === 'white') whiteStones++;
    }
  }

  const { black: bt, white: wt } = calculateTerritory(board, boardSize);

  return {
    black: blackStones + bt,
    white: whiteStones + wt + komi,
  };
}

/** 빈칸 flood-fill로 영역 계산 */
function calculateTerritory(
  board: Board,
  boardSize: number,
): { black: number; white: number } {
  const visited = new Set<number>();
  let black = 0;
  let white = 0;

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] !== null || visited.has(r * boardSize + c)) continue;

      const region: number[] = [];
      const queue: number[] = [r * boardSize + c];
      let touchBlack = false;
      let touchWhite = false;

      while (queue.length > 0) {
        const key = queue.shift()!;
        if (visited.has(key)) continue;
        visited.add(key);
        region.push(key);

        const cr = Math.floor(key / boardSize);
        const cc = key % boardSize;

        for (const [dr, dc] of DIRS) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
          if (board[nr][nc] === 'black') touchBlack = true;
          else if (board[nr][nc] === 'white') touchWhite = true;
          else if (!visited.has(nr * boardSize + nc)) queue.push(nr * boardSize + nc);
        }
      }

      if (touchBlack && !touchWhite) black += region.length;
      else if (touchWhite && !touchBlack) white += region.length;
    }
  }

  return { black, white };
}
