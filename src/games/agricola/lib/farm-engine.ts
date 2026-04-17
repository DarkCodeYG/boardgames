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
  // 초기 나무 방 2칸: 아그리콜라 룰 — [0][0], [1][0] (1열 상단·하단)
  grid[0][0] = 'room_wood';
  grid[1][0] = 'room_wood';

  return {
    grid,
    sownFields: [],
    fences: {
      horizontal: Array.from({ length: 4 }, () => new Array(5).fill(false) as boolean[]),
      vertical:   Array.from({ length: 3 }, () => new Array(6).fill(false) as boolean[]),
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
      if (fromC === 0) return false; // 보드 밖으로 이동 불가
      return !fences.vertical[fromR][fromC]; // v[r][c] = c열 왼쪽 경계
    case 'right':
      if (fromC === FARM_COLS - 1) return false; // 보드 밖으로 이동 불가
      return !fences.vertical[fromR][fromC + 1]; // v[r][c+1] = (c+1)열 왼쪽 = c열 오른쪽
  }
}

// ── 목장 완전 울타리 검증 ────────────────────────────────────────────

/**
 * 주어진 셀 목록(하나의 목장)이 완전히 울타리로 둘러싸여 있는지 확인.
 * 보드 경계도 명시 울타리가 필요하다 (보드 외벽은 자동 벽이 아님).
 *
 * 새 좌표계:
 *   horizontal[r][c] = c열 r행 셀의 위쪽 울타리 (r=0: 보드 상단 외벽)
 *   vertical[r][c]   = c열의 왼쪽 울타리 (c=0: 보드 왼쪽 외벽, c=5: 오른쪽 외벽)
 */
export function isPastureFullyFenced(
  cells: Array<[number, number]>,
  fences: FenceGrid,
): boolean {
  const inPasture = new Set(cells.map(([r, c]) => `${r},${c}`));
  for (const [r, c] of cells) {
    // 위쪽: 목장 내 셀이거나 수평 울타리가 있어야 함
    if (!inPasture.has(`${r - 1},${c}`) && !fences.horizontal[r]?.[c]) return false;
    // 아래쪽: 목장 내 셀이거나 수평 울타리가 있어야 함
    if (!inPasture.has(`${r + 1},${c}`) && !fences.horizontal[r + 1]?.[c]) return false;
    // 왼쪽: 목장 내 셀이거나 수직 울타리(c열 왼쪽)가 있어야 함
    if (!inPasture.has(`${r},${c - 1}`) && !fences.vertical[r]?.[c]) return false;
    // 오른쪽: 목장 내 셀이거나 수직 울타리(c+1열 왼쪽)가 있어야 함
    if (!inPasture.has(`${r},${c + 1}`) && !fences.vertical[r]?.[c + 1]) return false;
  }
  return true;
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

/**
 * 목장 재계산 시 기존 동물 데이터 보존
 * 울타리가 바뀌어 목장 범위가 달라져도 셀이 겹치는 목장에 동물 데이터를 이어붙인다.
 */
function preserveAnimalData(oldPastures: Pasture[], newPastures: Pasture[]): Pasture[] {
  return newPastures.map((newP) => {
    const oldP = oldPastures.find(
      (op) =>
        op.animals !== null &&
        op.cells.some(([r, c]) => newP.cells.some(([nr, nc]) => nr === r && nc === c)),
    );
    if (oldP?.animals) {
      const count = Math.min(oldP.animals.count, newP.capacity);
      return count > 0 ? { ...newP, animals: { type: oldP.animals.type, count } } : newP;
    }
    return newP;
  });
}

/** 울타리 변경 후 목장 재계산 (기존 동물 배치 보존) */
export function recalculatePastures(board: FarmBoard): FarmBoard {
  const newPastures = calculatePastures(board);
  return { ...board, pastures: preserveAnimalData(board.pastures, newPastures) };
}

/**
 * 동물을 목장(index) 또는 집('house')에 배치
 * getAnimalFromMarket / 플레이어 선택 시 호출
 */
export function placeAnimalInFarm(
  board: FarmBoard,
  animalType: AnimalType,
  destination: number | 'house',
): FarmBoard {
  if (destination === 'house') {
    const houseTotal = board.animalsInHouse.reduce((s, a) => s + a.count, 0);
    if (houseTotal >= 1) throw new Error('집 안은 동물 1마리만 배치 가능합니다');
    const existing = board.animalsInHouse.find((a) => a.type === animalType);
    const newHouse = existing
      ? board.animalsInHouse.map((a) =>
          a.type === animalType ? { ...a, count: a.count + 1 } : a,
        )
      : [...board.animalsInHouse, { type: animalType, count: 1 }];
    return { ...board, animalsInHouse: newHouse };
  }

  const pasture = board.pastures[destination];
  if (!pasture) throw new Error('목장을 찾을 수 없습니다');
  if (pasture.animals && pasture.animals.type !== animalType) {
    throw new Error('이 목장에는 다른 종류의 동물이 있습니다');
  }
  const currentCount = pasture.animals?.count ?? 0;
  if (currentCount >= pasture.capacity) throw new Error('목장 용량이 부족합니다');

  const newPastures = board.pastures.map((p, i) =>
    i === destination
      ? { ...p, animals: { type: animalType, count: currentCount + 1 } }
      : p,
  );
  return { ...board, pastures: newPastures };
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
