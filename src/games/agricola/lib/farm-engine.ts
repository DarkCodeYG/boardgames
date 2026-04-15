/**
 * 아그리콜라 농장 보드 엔진
 * 울타리 기반 목장 계산, 배치 유효성 검사, 초기 보드 생성
 * 출처: docs/agricola/04-farm-board-design.md
 *
 * 규칙: 순수 함수만. 사이드 이펙트 없음. GameState 전체 대신 FarmBoard만 받음.
 * Phase 1 구현 대상.
 */

import type { FarmBoard, FarmGrid, FenceGrid, CellType, Pasture, AnimalType } from './types.js';
import { FARM_ROWS, FARM_COLS, calcPastureCapacity } from './constants.js';

// ── 초기 보드 생성 ────────────────────────────────────────────────

export function createInitialFarmBoard(): FarmBoard {
  const grid: FarmGrid = Array.from({ length: FARM_ROWS }, () =>
    Array.from({ length: FARM_COLS }, (): CellType => 'empty')
  );
  grid[0][0] = 'room_wood'; // 초기 나무 방

  return {
    grid,
    sownFields: [],
    fences: {
      horizontal: Array.from({ length: 4 }, () => new Array(5).fill(false) as boolean[]),
      vertical:   Array.from({ length: 3 }, () => new Array(4).fill(false) as boolean[]),
    },
    pastures: [],
    stables: [],
    animalsInHouse: [],
  };
}

// ── 이동 가능 여부 (BFS용) ────────────────────────────────────────

/**
 * 특정 셀에서 방향으로 이동할 수 있는지 확인 (울타리/외벽 체크)
 */
export function canMove(
  fences: FenceGrid,
  fromR: number,
  fromC: number,
  dir: 'up' | 'down' | 'left' | 'right'
): boolean {
  switch (dir) {
    case 'up':
      if (fromR === 0) return false;
      return !fences.horizontal[fromR][fromC];
    case 'down':
      if (fromR === FARM_ROWS - 1) return false;
      return !fences.horizontal[fromR + 1][fromC];
    case 'left':
      if (fromC === 0) return false;
      return !fences.vertical[fromR][fromC - 1];
    case 'right':
      if (fromC === FARM_COLS - 1) return false;
      return !fences.vertical[fromR][fromC];
  }
}

// ── 목장 계산 ─────────────────────────────────────────────────────

/**
 * 울타리 배치 기반으로 닫힌 목장 구획을 BFS로 계산
 * 빈 셀과 외양간 셀이 목장에 포함됨 (방/밭은 불가)
 */
export function calculatePastures(board: FarmBoard): Pasture[] {
  // Phase 1 TODO
  const { grid, fences, stables } = board;
  const visited = Array.from({ length: FARM_ROWS }, () => new Array(FARM_COLS).fill(false) as boolean[]);
  const pastures: Pasture[] = [];

  for (let r = 0; r < FARM_ROWS; r++) {
    for (let c = 0; c < FARM_COLS; c++) {
      const cell = grid[r][c];
      if (visited[r][c] || (cell !== 'empty' && cell !== 'stable')) continue;

      const cells = floodFillPasture(grid, fences, visited, r, c);
      if (cells.length === 0) continue;

      const stableCount = cells.filter(
        ([cr, cc]) => stables.some(([sr, sc]) => sr === cr && sc === cc)
      ).length;

      pastures.push({
        cells,
        hasStable: stableCount > 0,
        capacity: calcPastureCapacity(cells.length, stableCount),
        animals: null,
      });
    }
  }
  return pastures;
}

function floodFillPasture(
  grid: FarmGrid,
  fences: FenceGrid,
  visited: boolean[][],
  startR: number,
  startC: number
): Array<[number, number]> {
  const queue: Array<[number, number]> = [[startR, startC]];
  const result: Array<[number, number]> = [];
  visited[startR][startC] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = grid[r][c];
    if (cell !== 'empty' && cell !== 'stable') continue;
    result.push([r, c]);

    const dirs: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
    for (const dir of dirs) {
      const [nr, nc] = neighborOf(r, c, dir);
      if (nr < 0 || nr >= FARM_ROWS || nc < 0 || nc >= FARM_COLS) continue;
      if (visited[nr][nc]) continue;
      if (!canMove(fences, r, c, dir)) continue;
      visited[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }
  return result;
}

function neighborOf(r: number, c: number, dir: 'up' | 'down' | 'left' | 'right'): [number, number] {
  switch (dir) {
    case 'up':    return [r - 1, c];
    case 'down':  return [r + 1, c];
    case 'left':  return [r, c - 1];
    case 'right': return [r, c + 1];
  }
}

// ── 유효성 검사 ──────────────────────────────────────────────────

/** 방 건설 가능 여부: 빈 셀 + 기존 방에 인접 */
export function canBuildRoom(board: FarmBoard, row: number, col: number): boolean {
  if (board.grid[row][col] !== 'empty') return false;
  const dirs: Array<[number, number]> = [[-1,0],[1,0],[0,-1],[0,1]];
  return dirs.some(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    if (r < 0 || r >= FARM_ROWS || c < 0 || c >= FARM_COLS) return false;
    const cell = board.grid[r][c];
    return cell === 'room_wood' || cell === 'room_clay' || cell === 'room_stone';
  });
}

/** 밭 갈기 가능 여부: 빈 셀만 */
export function canPlowField(board: FarmBoard, row: number, col: number): boolean {
  return board.grid[row][col] === 'empty';
}

/** 씨 뿌리기 가능 여부: field 셀 + 아직 씨 없음 */
export function canSow(board: FarmBoard, row: number, col: number): boolean {
  if (board.grid[row][col] !== 'field') return false;
  return !board.sownFields.some((f) => f.row === row && f.col === col);
}

/** 동물 배치 가능 여부: 목장 용량 확인 */
export function canPlaceAnimal(board: FarmBoard, type: AnimalType, count: number): boolean {
  const totalCapacity = board.pastures.reduce((sum, p) => {
    if (p.animals === null || p.animals.type === type) return sum + p.capacity;
    return sum;
  }, 0);
  const currentCount = board.pastures
    .filter((p) => p.animals?.type === type)
    .reduce((sum, p) => sum + (p.animals?.count ?? 0), 0);
  const inHouse = board.animalsInHouse
    .filter((a) => a.type === type)
    .reduce((sum, a) => sum + a.count, 0);
  return currentCount + inHouse + count <= totalCapacity + 1; // +1 집 안 1마리
}

/** 울타리 변경 후 목장 재계산 */
export function recalculatePastures(board: FarmBoard): FarmBoard {
  return { ...board, pastures: calculatePastures(board) };
}

/** 방 수 계산 */
export function countRooms(board: FarmBoard): number {
  return board.grid.flat().filter(
    (c) => c === 'room_wood' || c === 'room_clay' || c === 'room_stone'
  ).length;
}

/** 방 재질 */
export function getRoomMaterial(board: FarmBoard): 'wood' | 'clay' | 'stone' | null {
  for (const row of board.grid) {
    for (const cell of row) {
      if (cell === 'room_wood') return 'wood';
      if (cell === 'room_clay') return 'clay';
      if (cell === 'room_stone') return 'stone';
    }
  }
  return null;
}

/** 밭 수 계산 */
export function countFields(board: FarmBoard): number {
  return board.grid.flat().filter((c) => c === 'field').length;
}

/** 빈 셀 수 계산 */
export function countEmptySpaces(board: FarmBoard): number {
  return board.grid.flat().filter((c) => c === 'empty').length;
}
