/**
 * 아그리콜라 농장 보드 엔진 QA 테스트
 * 실행: node scripts/agricola-test-farm.mjs
 *
 * farm-engine.ts의 핵심 로직을 JavaScript로 재구현하여 검증
 * Phase 1 구현 완료 후 실제 로직 검증.
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  fn();
}

// ── 상수 (src/games/agricola/lib/constants.ts와 일치해야 함) ────────

const FARM_ROWS = 3;
const FARM_COLS = 5;

function calcPastureCapacity(cellCount, stableCount) {
  return Math.pow(2, cellCount) * Math.pow(2, stableCount);
}

// ── 헬퍼: 초기 보드 생성 ─────────────────────────────────────────

function createInitialFarmBoard() {
  const grid = Array.from({ length: FARM_ROWS }, () =>
    new Array(FARM_COLS).fill('empty')
  );
  grid[0][0] = 'room_wood';

  return {
    grid,
    sownFields: [],
    fences: {
      horizontal: Array.from({ length: 4 }, () => new Array(5).fill(false)),
      vertical:   Array.from({ length: 3 }, () => new Array(4).fill(false)),
    },
    pastures: [],
    stables: [],
    animalsInHouse: [],
  };
}

// ── 헬퍼: 이동 가능 여부 ─────────────────────────────────────────

function canMove(fences, fromR, fromC, dir) {
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

// ── 헬퍼: 목장 BFS 계산 ─────────────────────────────────────────

function neighborOf(r, c, dir) {
  switch (dir) {
    case 'up':    return [r - 1, c];
    case 'down':  return [r + 1, c];
    case 'left':  return [r, c - 1];
    case 'right': return [r, c + 1];
  }
}

function floodFillPasture(grid, fences, visited, startR, startC) {
  const queue = [[startR, startC]];
  const result = [];
  visited[startR][startC] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const cell = grid[r][c];
    if (cell !== 'empty' && cell !== 'stable') continue;
    result.push([r, c]);

    for (const dir of ['up', 'down', 'left', 'right']) {
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

function calculatePastures(board) {
  const { grid, fences, stables } = board;
  const visited = Array.from({ length: FARM_ROWS }, () => new Array(FARM_COLS).fill(false));
  const pastures = [];

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

// ── 헬퍼: 유효성 검사 ────────────────────────────────────────────

function canBuildRoom(board, row, col) {
  if (board.grid[row][col] !== 'empty') return false;
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const r = row + dr, c = col + dc;
    if (r < 0 || r >= FARM_ROWS || c < 0 || c >= FARM_COLS) continue;
    const cell = board.grid[r][c];
    if (cell === 'room_wood' || cell === 'room_clay' || cell === 'room_stone') return true;
  }
  return false;
}

function canPlowField(board, row, col) {
  return board.grid[row][col] === 'empty';
}

function canSow(board, row, col) {
  if (board.grid[row][col] !== 'field') return false;
  return !board.sownFields.some(f => f.row === row && f.col === col);
}

function canPlaceAnimal(board, type, count) {
  const totalCapacity = board.pastures.reduce((sum, p) => {
    if (p.animals === null || p.animals.type === type) return sum + p.capacity;
    return sum;
  }, 0);
  const currentCount = board.pastures
    .filter(p => p.animals?.type === type)
    .reduce((sum, p) => sum + (p.animals?.count ?? 0), 0);
  const inHouse = board.animalsInHouse
    .filter(a => a.type === type)
    .reduce((sum, a) => sum + a.count, 0);
  return currentCount + inHouse + count <= totalCapacity + 1; // +1 집 안 1마리
}

// ── 헬퍼: 울타리로 목장 만들기 ─────────────────────────────────

/**
 * 특정 셀(r, c)을 4면 울타리로 완전히 닫는다
 */
function enclose1x1(board, r, c) {
  const b = JSON.parse(JSON.stringify(board));
  // 위 (horizontal[r][c] = true → 셀 (r,c)의 위쪽 경계)
  b.fences.horizontal[r][c] = true;
  // 아래 (horizontal[r+1][c])
  b.fences.horizontal[r + 1][c] = true;
  // 왼쪽 (vertical[r][c-1] 이지만 c=0이면 외벽)
  if (c > 0) b.fences.vertical[r][c - 1] = true;
  // 오른쪽 (vertical[r][c])
  if (c < FARM_COLS - 1) b.fences.vertical[r][c] = true;
  return b;
}

/**
 * 2×1 목장 (r,c)~(r,c+1) 수평으로 닫기
 */
function enclose1x2(board, r, c) {
  const b = JSON.parse(JSON.stringify(board));
  // 위 2개
  b.fences.horizontal[r][c] = true;
  b.fences.horizontal[r][c + 1] = true;
  // 아래 2개
  b.fences.horizontal[r + 1][c] = true;
  b.fences.horizontal[r + 1][c + 1] = true;
  // 왼쪽 외벽(c=0이면 자동) 또는 울타리
  if (c > 0) b.fences.vertical[r][c - 1] = true;
  // 중간 울타리 없음 (c~c+1은 연결됨)
  // 오른쪽
  if (c + 1 < FARM_COLS - 1) b.fences.vertical[r][c + 1] = true;
  return b;
}

// ── 테스트 ───────────────────────────────────────────────────────

describe('초기 보드 상태', () => {
  const board = createInitialFarmBoard();
  assert(board.grid[0][0] === 'room_wood', '(0,0)에 나무 방');
  assert(board.grid.flat().filter(c => c === 'empty').length === 14, '빈 칸 14개 (3×5-1)');
  assert(board.pastures.length === 0, '초기 목장 0개');
  assert(board.fences.horizontal.length === 4, '수평 울타리 배열 4행');
  assert(board.fences.horizontal[0].length === 5, '수평 울타리 행당 5열');
  assert(board.fences.vertical.length === 3, '수직 울타리 배열 3행');
  assert(board.fences.vertical[0].length === 4, '수직 울타리 행당 4열');
  assert(board.sownFields.length === 0, '초기 씨앗 없음');
  assert(board.stables.length === 0, '초기 외양간 없음');
});

describe('canMove — 외벽 체크', () => {
  const emptyFences = {
    horizontal: Array.from({ length: 4 }, () => new Array(5).fill(false)),
    vertical:   Array.from({ length: 3 }, () => new Array(4).fill(false)),
  };
  // 외벽: 위쪽 끝 행에서 위로
  assert(!canMove(emptyFences, 0, 0, 'up'), '(0,0) 위로 이동 불가 — 외벽');
  // 외벽: 아래쪽 끝 행에서 아래로
  assert(!canMove(emptyFences, 2, 0, 'down'), '(2,0) 아래로 이동 불가 — 외벽');
  // 외벽: 왼쪽 끝 열에서 왼쪽
  assert(!canMove(emptyFences, 0, 0, 'left'), '(0,0) 왼쪽 이동 불가 — 외벽');
  // 외벽: 오른쪽 끝 열에서 오른쪽
  assert(!canMove(emptyFences, 0, 4, 'right'), '(0,4) 오른쪽 이동 불가 — 외벽');
  // 내부는 가능
  assert(canMove(emptyFences, 1, 1, 'up'), '(1,1) 위로 이동 가능');
  assert(canMove(emptyFences, 1, 1, 'right'), '(1,1) 오른쪽 이동 가능');
});

describe('canMove — 울타리 차단', () => {
  const fences = {
    horizontal: Array.from({ length: 4 }, () => new Array(5).fill(false)),
    vertical:   Array.from({ length: 3 }, () => new Array(4).fill(false)),
  };
  // horizontal[1][2] = true → (0,2)↔(1,2) 사이에 울타리
  fences.horizontal[1][2] = true;
  assert(!canMove(fences, 0, 2, 'down'), '(0,2) 아래 울타리 차단');
  assert(!canMove(fences, 1, 2, 'up'), '(1,2) 위 울타리 차단 (반대편)');
  assert(canMove(fences, 0, 3, 'down'), '(0,3) 아래는 비어있어 이동 가능');

  const fences2 = {
    horizontal: Array.from({ length: 4 }, () => new Array(5).fill(false)),
    vertical:   Array.from({ length: 3 }, () => new Array(4).fill(false)),
  };
  // vertical[1][2] = true → (1,2)↔(1,3) 사이에 울타리
  fences2.vertical[1][2] = true;
  assert(!canMove(fences2, 1, 2, 'right'), '(1,2) 오른쪽 울타리 차단');
  assert(!canMove(fences2, 1, 3, 'left'), '(1,3) 왼쪽 울타리 차단 (반대편)');
});

describe('목장 계산 — 울타리 없음: 연결된 빈 공간', () => {
  const board = createInitialFarmBoard();
  // 울타리 없음 → 빈 셀 14개가 모두 연결됨 (목장 1개)
  const pastures = calculatePastures(board);
  assert(pastures.length === 1, '울타리 없음: 빈 공간 1개');
  assert(pastures[0].cells.length === 14, '울타리 없는 공간: 14칸 (3×5-1)');
  assert(pastures[0].capacity === calcPastureCapacity(14, 0), '용량 = 2^14');
});

describe('목장 계산 — 1×1 완전 닫힌 목장', () => {
  const board = createInitialFarmBoard();
  // (1,1) 칸을 4면 울타리로 완전 닫기
  // 위: horizontal[1][1], 아래: horizontal[2][1], 왼: vertical[1][0], 오: vertical[1][1]
  const b = JSON.parse(JSON.stringify(board));
  b.fences.horizontal[1][1] = true;
  b.fences.horizontal[2][1] = true;
  b.fences.vertical[1][0] = true;
  b.fences.vertical[1][1] = true;

  const pastures = calculatePastures(b);
  // (1,1)이 격리됨, 나머지 13칸은 연결됨
  const small = pastures.find(p => p.cells.length === 1);
  assert(small !== undefined, '1칸 목장 존재');
  assert(small?.cells[0][0] === 1 && small?.cells[0][1] === 1, '1×1 목장 위치 (1,1)');
  assert(small?.capacity === 2, '1×1 목장 용량 = 2 (2^1)');
  assert(small?.hasStable === false, '외양간 없음');
});

describe('목장 계산 — 외양간 포함', () => {
  const board = createInitialFarmBoard();
  // (1,1)을 닫고 외양간 추가
  const b = JSON.parse(JSON.stringify(board));
  b.fences.horizontal[1][1] = true;
  b.fences.horizontal[2][1] = true;
  b.fences.vertical[1][0] = true;
  b.fences.vertical[1][1] = true;
  b.stables = [[1, 1]];

  const pastures = calculatePastures(b);
  const stable = pastures.find(p => p.hasStable);
  assert(stable !== undefined, '외양간 있는 목장 감지');
  assert(stable?.capacity === 4, '1칸+외양간 용량 = 4 (2^1 × 2^1)');
});

describe('목장 계산 — 2칸 수평 목장', () => {
  const board = createInitialFarmBoard();
  // (2,2)~(2,3) 2칸 닫기
  // 위: horizontal[2][2], horizontal[2][3]
  // 아래: horizontal[3][2], horizontal[3][3] (외벽이므로 자동 차단)
  // 왼: vertical[2][1]
  // 오: vertical[2][3]
  const b = JSON.parse(JSON.stringify(board));
  b.fences.horizontal[2][2] = true;
  b.fences.horizontal[2][3] = true;
  // 아래는 외벽 (row=2 = FARM_ROWS-1, canMove down = false)
  b.fences.vertical[2][1] = true;
  b.fences.vertical[2][3] = true;

  const pastures = calculatePastures(b);
  const twoCell = pastures.find(p => p.cells.length === 2);
  assert(twoCell !== undefined, '2칸 목장 존재');
  assert(twoCell?.capacity === 4, '2칸 목장 용량 = 4 (2^2)');
});

describe('목장 계산 — 두 개의 분리된 목장', () => {
  const board = createInitialFarmBoard();
  const b = JSON.parse(JSON.stringify(board));

  // 첫 번째 목장: (1,3) 닫기
  b.fences.horizontal[1][3] = true;
  b.fences.horizontal[2][3] = true;
  b.fences.vertical[1][2] = true;
  b.fences.vertical[1][3] = true;

  // 두 번째 목장: (2,1) 닫기
  b.fences.horizontal[2][1] = true;
  // 아래는 외벽
  b.fences.vertical[2][0] = true;
  b.fences.vertical[2][1] = true;

  const pastures = calculatePastures(b);
  const enclosed = pastures.filter(p => p.cells.length === 1);
  assert(enclosed.length === 2, '두 개의 1칸 목장 분리');
});

describe('방 건설 유효성', () => {
  const board = createInitialFarmBoard();
  // 초기: (0,0)에 나무 방
  assert(canBuildRoom(board, 0, 1) === true, '(0,1)은 방 인접 빈칸 → 건설 가능');
  assert(canBuildRoom(board, 1, 0) === true, '(1,0)은 방 인접 빈칸 → 건설 가능');
  assert(canBuildRoom(board, 0, 0) === false, '(0,0)은 이미 방 → 불가');
  assert(canBuildRoom(board, 2, 4) === false, '(2,4)는 방과 비인접 → 불가');
  assert(canBuildRoom(board, 1, 1) === false, '(1,1)은 방과 비인접 → 불가');

  // 방 2개 이후: (0,1)에 방 추가
  const b2 = JSON.parse(JSON.stringify(board));
  b2.grid[0][1] = 'room_wood';
  assert(canBuildRoom(b2, 0, 2) === true, '(0,2)는 새 방 (0,1)에 인접 → 가능');
  assert(canBuildRoom(b2, 1, 1) === true, '(1,1)은 방 (0,1) 아래 → 가능');
});

describe('밭 갈기 유효성', () => {
  const board = createInitialFarmBoard();
  assert(canPlowField(board, 0, 1) === true, '빈칸(0,1)에 밭 갈기 가능');
  assert(canPlowField(board, 2, 4) === true, '빈칸(2,4)에 밭 갈기 가능');
  assert(canPlowField(board, 0, 0) === false, '방(0,0)에 밭 갈기 불가');

  const b = JSON.parse(JSON.stringify(board));
  b.grid[1][2] = 'field';
  assert(canPlowField(b, 1, 2) === false, '이미 밭인 칸 재갈기 불가');
  assert(canPlowField(b, 1, 3) === true, '인접 빈칸은 갈기 가능');
});

describe('씨 뿌리기 유효성', () => {
  const board = createInitialFarmBoard();
  // 빈 칸에는 씨 뿌리기 불가
  assert(canSow(board, 0, 1) === false, '빈 칸에 씨 뿌리기 불가');

  const b = JSON.parse(JSON.stringify(board));
  b.grid[0][1] = 'field';
  assert(canSow(b, 0, 1) === true, '밭(0,1)에 씨 뿌리기 가능 (씨앗 없음)');

  // 이미 씨 있는 밭
  b.sownFields.push({ row: 0, col: 1, crop: 'grain', count: 3 });
  assert(canSow(b, 0, 1) === false, '씨앗 있는 밭에 재뿌리기 불가');
  assert(canSow(b, 0, 2) === false, '빈 칸(0,2)에 씨 불가');

  b.grid[0][2] = 'field';
  assert(canSow(b, 0, 2) === true, '씨앗 없는 밭(0,2)에 뿌리기 가능');
});

describe('동물 배치 유효성 — 목장 없음', () => {
  const board = createInitialFarmBoard();
  // 목장/외양간 없음: 집 안 1마리만 가능
  assert(canPlaceAnimal(board, 'sheep', 1) === true, '목장 없음: 집 안 양 1마리 가능');
  assert(canPlaceAnimal(board, 'sheep', 2) === false, '목장 없음: 양 2마리 불가');
  assert(canPlaceAnimal(board, 'boar', 1) === true, '목장 없음: 집 안 멧돼지 1마리 가능');
});

describe('동물 배치 유효성 — 목장 있음', () => {
  const board = createInitialFarmBoard();
  // 1×1 목장 + 양 이미 있음
  const b = JSON.parse(JSON.stringify(board));
  b.fences.horizontal[1][1] = true;
  b.fences.horizontal[2][1] = true;
  b.fences.vertical[1][0] = true;
  b.fences.vertical[1][1] = true;
  b.pastures = [{
    cells: [[1, 1]],
    hasStable: false,
    capacity: 2,
    animals: { type: 'sheep', count: 1 },
  }];

  // 총 용량 2 (목장) + 1 (집) = 3
  assert(canPlaceAnimal(b, 'sheep', 1) === true, '목장 용량 2: 추가 1마리 가능');
  assert(canPlaceAnimal(b, 'sheep', 2) === true, '목장 용량 2: 추가 2마리 가능 (이미 1마리 + 2 = 3 ≤ 3)');
  assert(canPlaceAnimal(b, 'sheep', 3) === false, '목장 용량 2: 추가 3마리 불가 (이미 1마리 + 3 = 4 > 3)');
  // 다른 종류는 빈 목장 없으면 불가
  assert(canPlaceAnimal(b, 'boar', 1) === true, '멧돼지는 집 안 1마리 가능 (빈 목장 없어도)');
});

describe('목장 용량 계산', () => {
  assert(calcPastureCapacity(1, 0) === 2,  '1칸, 외양간0 = 2');
  assert(calcPastureCapacity(1, 1) === 4,  '1칸, 외양간1 = 4');
  assert(calcPastureCapacity(2, 0) === 4,  '2칸, 외양간0 = 4');
  assert(calcPastureCapacity(2, 1) === 8,  '2칸, 외양간1 = 8');
  assert(calcPastureCapacity(3, 0) === 8,  '3칸, 외양간0 = 8');
  assert(calcPastureCapacity(4, 0) === 16, '4칸, 외양간0 = 16');
  assert(calcPastureCapacity(4, 1) === 32, '4칸, 외양간1 = 32');
});

// ── 결과 ─────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`결과: ${passed + failed}개 테스트 | ✅ ${passed} 통과 | ❌ ${failed} 실패`);
if (failed > 0) process.exit(1);
