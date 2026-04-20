# 아그리콜라 농장 보드 설계

> Phase 0 설계 문서 | 가장 복잡한 비주얼 컴포넌트

---

## 1. 농장 보드 구조

### 물리적 구조
- **3행 × 5열** 격자 (row 0-2, col 0-4)
- 초기 상태: (0,0) 위치에 나무 방 1개, (0,1)에 농부 1명 (집 없음)

실제 아그리콜라 보드 초기 배치:
```
col:  0       1       2       3       4
row0: [방🏠]  [농부]  [  ]    [  ]    [  ]
row1: [  ]    [  ]    [  ]    [  ]    [  ]
row2: [  ]    [  ]    [  ]    [  ]    [  ]
```

> **주의:** 농부(가족 말)는 셀에 표시되지 않음. 농부는 공용 행동 공간 보드로 이동함.
> 방은 셀 타입으로 표현. 방에 농부 말이 있다는 것은 별도 상태.

---

## 2. 데이터 구조

### 2-1. 그리드

```typescript
// 3행 × 5열
type FarmGrid = CellType[][];
// grid[0][0] = 'room_wood'  (초기값)
// grid[0][1..4] = 'empty'
// grid[1..2][0..4] = 'empty'
```

### 2-2. 울타리 시스템

```
셀 경계 좌표계:

     v[0][0] v[0][1] v[0][2] v[0][3] v[0][4]   ← 수직 경계 없음(좌우 외벽)
  h[0][0] h[0][1] h[0][2] h[0][3] h[0][4]       ← 수평 경계 (위쪽 외벽)
  [c00]   [c01]   [c02]   [c03]   [c04]
  h[1][0] h[1][1] h[1][2] h[1][3] h[1][4]
  [c10]   [c11]   [c12]   [c13]   [c14]
  h[2][0] h[2][1] h[2][2] h[2][3] h[2][4]
  [c20]   [c21]   [c22]   [c23]   [c24]
  h[3][0] h[3][1] h[3][2] h[3][3] h[3][4]       ← 수평 경계 (아래쪽 외벽)
```

```typescript
interface FenceGrid {
  // horizontal[r][c]: r행 c열 셀의 위쪽 경계 (4행 × 5열)
  // r=0: 보드 상단 외벽 (항상 true)
  // r=3: 보드 하단 외벽 (항상 true)
  horizontal: boolean[][];  // [4][5]

  // vertical[r][c]: r행 c열 셀의 오른쪽 경계 (3행 × 4열)
  // 좌우 외벽은 별도 처리 (암묵적 경계)
  vertical: boolean[][];    // [3][4]
}
```

**울타리 배치 규칙:**
- 외벽(보드 가장자리)은 항상 울타리로 간주 (FenceGrid에 저장 안 함)
- 내부 울타리만 FenceGrid에 저장
- 울타리는 셀과 셀 사이에 배치 (연속 가능)

### 2-3. 목장 계산 알고리즘

```typescript
// farm-engine.ts
function calculatePastures(board: FarmBoard): Pasture[] {
  const { grid, fences } = board;
  const visited = Array.from({ length: 3 }, () => new Array(5).fill(false));
  const pastures: Pasture[] = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      if (!visited[r][c] && grid[r][c] === 'empty') {
        // BFS: 울타리로 막히지 않은 빈 셀 탐색
        const cells = floodFillPasture(grid, fences, visited, r, c);
        if (cells.length > 0) {
          const hasStable = cells.some(([cr, cc]) => grid[cr][cc] === 'stable');
          const baseCapacity = Math.pow(2, cells.length);
          pastures.push({
            cells,
            hasStable,
            capacity: hasStable ? baseCapacity * 2 : baseCapacity,
            animals: null,
          });
        }
      }
    }
  }
  return pastures;
}

function canMove(fences: FenceGrid, fromR: number, fromC: number, dir: 'up' | 'down' | 'left' | 'right'): boolean {
  switch (dir) {
    case 'up':
      if (fromR === 0) return false;  // 외벽
      return !fences.horizontal[fromR][fromC];
    case 'down':
      if (fromR === 2) return false;  // 외벽
      return !fences.horizontal[fromR + 1][fromC];
    case 'left':
      if (fromC === 0) return false;  // 외벽
      return !fences.vertical[fromR][fromC - 1];
    case 'right':
      if (fromC === 4) return false;  // 외벽
      return !fences.vertical[fromR][fromC];
  }
}
```

**목장 용량 계산:**
| 셀 수 | 기본 용량 | 외양간 있을 때 |
|------|---------|-------------|
| 1 | 2 | 4 |
| 2 | 4 | 8 |
| 3 | 8 | 16 |
| 4 | 16 | 32 |

> 외양간 1개당 목장 용량 2배 (단, 각 목장에 외양간 1개만 보너스 적용)

---

## 3. 렌더링 설계

### 3-1. CSS Grid 레이아웃

```tsx
// FarmBoard.tsx
<div className="grid grid-cols-5 grid-rows-3 gap-0 relative">
  {[0,1,2].map(r =>
    [0,1,2,3,4].map(c => (
      <FarmCell
        key={`${r}-${c}`}
        row={r} col={c}
        cellType={board.grid[r][c]}
        sownField={board.sownFields.find(f => f.row===r && f.col===c)}
        isPasture={...}
        pasture={...}
        onClick={() => onCellClick(r, c)}
      />
    ))
  )}
  <FenceGrid fences={board.fences} onFenceClick={onFenceClick} />
</div>
```

### 3-2. 셀 크기 기준
- 아이패드(세로): 셀 1개 = 56px × 56px
- 폰(가로): 셀 1개 = 44px × 44px
- 울타리 두께: 4px

### 3-3. FarmCell 시각화

```tsx
interface FarmCellProps {
  row: number;
  col: number;
  cellType: CellType;
  sownField?: SownField;
  pasture?: Pasture;
  isSelected?: boolean;
  onClick?: () => void;
}

// 셀 배경색 → AGRICOLA.CELL[cellType]
// 씨 뿌린 밭 → 밀/채소 아이콘 + 수량
// 목장 → AGRICOLA.PASTURE 배경 + 동물 아이콘
// 외양간 → 별도 아이콘 오버레이
```

### 3-4. 울타리 인터랙션

울타리 배치 모드 활성화 시:
- 셀과 셀 사이 경계선이 클릭 가능 영역으로 활성화
- hover: 반투명 울타리 미리보기
- click: 울타리 토글
- 유효성 검사: 울타리 예산 초과 방지

```tsx
// FenceGrid.tsx - absolute 포지셔닝으로 셀 위에 오버레이
<div className="absolute inset-0 pointer-events-none">
  {/* 수평 울타리: 셀 행과 행 사이 */}
  {horizontalFencePositions.map(pos => (
    <FenceSegment
      key={pos.key}
      orientation="horizontal"
      active={fences.horizontal[pos.r][pos.c]}
      onClick={() => onFenceClick('horizontal', pos.r, pos.c)}
    />
  ))}
  {/* 수직 울타리 */}
  ...
</div>
```

---

## 4. 농장 행동별 검증 함수

```typescript
// farm-engine.ts 공개 API

/** 방 건설 가능 여부 */
function canBuildRoom(board: FarmBoard, row: number, col: number): boolean {
  // 현재 빈 셀, 기존 방에 인접한 셀만 가능
}

/** 밭 갈기 가능 여부 */
function canPlowField(board: FarmBoard, row: number, col: number): boolean {
  // 빈 셀만 가능
}

/** 울타리 배치 후 유효성 */
function validateFences(fences: FenceGrid): boolean {
  // 고립된 울타리 금지 (연결된 목장 경계여야 함)
  // 방이나 밭을 포함한 목장 금지
}

/** 씨 뿌리기 가능 여부 */
function canSow(board: FarmBoard, row: number, col: number): boolean {
  // field 타입 셀, 아직 씨 없는 경우만
}

/** 동물 배치 가능 여부 */
function canPlaceAnimal(board: FarmBoard, type: AnimalType, count: number): boolean {
  // 목장 용량 + 집 안 1마리 + 외양간 1마리 확인
}

/** 전체 목장 재계산 (울타리 변경 후 호출) */
function recalculatePastures(board: FarmBoard): FarmBoard {
  return { ...board, pastures: calculatePastures(board) };
}
```

---

## 5. 초기 보드 상태

```typescript
export function createInitialFarmBoard(): FarmBoard {
  const grid: FarmGrid = Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, () => 'empty' as CellType)
  );
  grid[0][0] = 'room_wood';   // 초기 나무 방

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
```

---

## 6. 엣지 케이스 목록 (공식 룰 확인)

| 케이스 | 처리 방법 | 출처 |
|--------|----------|------|
| 목장 없이 동물 획득 | 집 안 보관 허용 (1마리) + 울타리 없는 외양간 1마리 | ✅ |
| 목장 용량 초과 + 취사 설비 있음 | 즉시 음식으로 변환 가능 | ✅ |
| 목장 용량 초과 + 취사 설비 없음 | 전부 반납 (공동 창고로) | ✅ |
| 방 확장 위치 | 기존 방에 **인접한** 빈 셀에만 건설 | ✅ |
| 밭 셀 + 울타리 | 밭 셀은 목장 내 포함 불가 | ✅ |
| 외양간만 (울타리 없음) | 동물 1마리 보관 가능. 이후 울타리로 두를 수 있음 | ✅ |
| 씨 다 수확된 빈 밭 | 다시 씨 뿌리기 가능 (field 타입 유지) | ✅ |
| **번식 - 자리 없을 때** | 새끼 못 낳음 (공간 생성 불가) | ✅ |
| **번식 - 새끼를 즉시 음식으로** | 번식 단계에서 새끼/부모 즉시 요리 **불가** | ✅ |
| 집 개조 - 일부만 | **불가**. 모든 방을 동시에 개조해야 함 | ✅ |
| 집 개조 - 나무→돌 한 번에 | **불가**. 나무→점토→돌 2단계 필수 | ✅ |
| 울타리 최소 구획 | 반드시 **닫힌** 형태여야 함 (나무 4개 최소) | ✅ |
| 가족 늘리기 신생아 식량 | 수확 라운드에서 신생아는 음식 **1개**만 소모 | ✅ |
| 울타리 구획 내 외양간 2개+ | 최대치가 외양간 수만큼 2배씩 (중첩 적용) | ✅ |
