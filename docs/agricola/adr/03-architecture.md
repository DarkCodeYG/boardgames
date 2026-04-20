# 아그리콜라 기술 아키텍처

> Phase 0 설계 문서 | 기준: boardgames 프로젝트 기존 패턴 준수

---

## 1. 디렉토리 구조

```
src/games/agricola/
├── lib/
│   ├── types.ts              # 모든 타입 정의 (단일 소스)
│   ├── constants.ts          # 상수 (라운드 수, 보드 크기 등)
│   ├── game-engine.ts        # 순수 게임 로직
│   ├── farm-engine.ts        # 농장 보드 전용 로직 (울타리/목장 계산)
│   ├── card-engine.ts        # 카드 효과 처리기
│   ├── scoring-engine.ts     # 점수 계산
│   ├── cards/
│   │   ├── index.ts          # 카드 DB 진입점
│   │   ├── occupations-e.ts  # E덱 직업 카드 48장
│   │   ├── improvements-e.ts # E덱 소시설 카드 48장
│   │   └── major-improvements.ts # 주요설비 10개
│   ├── action-spaces.ts      # 행동 공간 정의
│   ├── round-cards.ts        # 라운드 카드 14장
│   ├── firebase-room.ts      # Firebase CRUD + 리스너 (Phase 3)
│   └── i18n.ts               # 한/영/중 텍스트
├── store/
│   └── game-store.ts         # Zustand (roomCode, lang, localState)
├── components/
│   ├── FarmBoard.tsx         # 농장 보드 전체
│   ├── FarmCell.tsx          # 개별 셀 (방/밭/빈칸/외양간)
│   ├── FenceGrid.tsx         # 울타리 렌더링
│   ├── ActionBoard.tsx       # 공용 행동 공간 보드
│   ├── ActionSpace.tsx       # 개별 행동 공간
│   ├── ResourcePanel.tsx     # 자원 현황
│   ├── CardHand.tsx          # 손패 카드
│   ├── CardDetail.tsx        # 카드 상세 (모달)
│   ├── HarvestModal.tsx      # 수확 단계 UI
│   ├── ScoreBoard.tsx        # 최종 점수판
│   └── WorkerToken.tsx       # 가족 말 토큰
└── pages/
    ├── HomePage.tsx          # 설정, 룰 설명
    ├── GamePage.tsx          # 아이패드 메인 (호스트)
    └── PlayerPage.tsx        # 폰 개인 화면 (Phase 3)
```

---

## 2. 핵심 타입 시스템 (`types.ts`)

### 2-1. 기본 식별자 / 열거형

```typescript
export type PlayerId = string;

export type ResourceType =
  | 'wood' | 'clay' | 'stone' | 'reed'
  | 'grain' | 'vegetable'
  | 'food'
  | 'sheep' | 'boar' | 'cattle';

export type AnimalType = 'sheep' | 'boar' | 'cattle';
export type BuildingMaterial = 'wood' | 'clay' | 'stone';

export type CellType =
  | 'empty'
  | 'room_wood' | 'room_clay' | 'room_stone'
  | 'field'
  | 'stable';        // 외양간 (목장 용량 +1)

// 개정판 덱 체계: A/B = 기본판 내장, C/D/E = 확장팩
// 기본판은 A덱 48장(직업24+보조24) + B덱 48장(직업24+보조24) = 96장
export type CardDeck = 'A' | 'B' | 'C' | 'D' | 'E';
export type CardType = 'occupation' | 'minor_improvement';

export type TriggerType =
  | 'IMMEDIATE'           // 카드 플레이 즉시
  | 'PLACE_WORKER'        // 워커 배치 후
  | 'HARVEST_FIELD'       // 밭 수확 단계
  | 'HARVEST_FEED'        // 식량 공급 단계
  | 'HARVEST_BREED'       // 번식 단계
  | 'BUILD_ROOM'          // 방 건설 시
  | 'BUILD_FENCE'         // 울타리 건설 시
  | 'PLOW_FIELD'          // 밭 갈기 시
  | 'SOW'                 // 씨 뿌리기 시
  | 'BAKE_BREAD'          // 빵 굽기 시
  | 'GET_RESOURCE'        // 자원 획득 시 (조건부)
  | 'ROUND_START'         // 라운드 시작 시
  | 'GAME_END'            // 게임 종료 점수 계산 시
  | 'ANYTIME';            // 언제든 사용 가능 (액티브 카드)

export type GamePhase = 'lobby' | 'setup' | 'playing' | 'gameover';

export type RoundPhase =
  | 'start_round'   // 라운드 카드 공개
  | 'replenish'     // 자원 보충
  | 'work'          // 워커 배치 (플레이어 턴)
  | 'return_home';  // 워커 회수

export type HarvestPhase = 'field' | 'feeding' | 'breeding' | 'done';
```

### 2-2. 농장 보드

```typescript
// 농장 그리드: 3행 × 5열
export type FarmGrid = CellType[][];   // [row][col], 0-indexed

// 씨 뿌린 밭: 자원 종류와 수량
export interface SownField {
  row: number;
  col: number;
  resource: 'grain' | 'vegetable';
  count: number;   // 수확 시 1씩 감소
}

// 울타리: 셀과 셀 사이 선분
// horizontal[r][c] = true → r행 c열 셀의 위쪽(위-아래 경계선)
// vertical[r][c]   = true → r행 c열 셀의 오른쪽(좌-우 경계선)
export interface FenceGrid {
  horizontal: boolean[][];  // [4][5] (행+1 × 열)
  vertical: boolean[][];    // [3][4] (행 × 열+1)
}

// 울타리로 둘러싸인 목장 (farm-engine이 자동 계산)
export interface Pasture {
  cells: Array<[number, number]>;  // [row, col] 목록
  hasStable: boolean;
  capacity: number;     // 수용 동물 수 (2^셀수 × stable보너스)
  animals: AnimalStack | null;
}

// 동물 스택 (목장 또는 집 안)
export interface AnimalStack {
  type: AnimalType;
  count: number;
}

export interface FarmBoard {
  grid: FarmGrid;        // 3×5 셀 타입
  sownFields: SownField[];
  fences: FenceGrid;
  pastures: Pasture[];   // farm-engine이 fences로부터 자동 계산
  stables: Array<[number, number]>;  // 외양간 위치 목록
  animalsInHouse: AnimalStack[];     // 방 안 동물 (1마리까지)
}
```

### 2-3. 자원 창고

```typescript
export type Resources = Record<ResourceType, number>;

export function emptyResources(): Resources {
  return {
    wood: 0, clay: 0, stone: 0, reed: 0,
    grain: 0, vegetable: 0, food: 0,
    sheep: 0, boar: 0, cattle: 0,
  };
}
```

### 2-4. 카드

```typescript
export interface ResourceCost {
  wood?: number; clay?: number; stone?: number; reed?: number;
  food?: number; grain?: number; vegetable?: number;
}

export interface CardEffect {
  trigger: TriggerType;
  condition?: (state: GameState, player: PlayerState) => boolean;
  apply: (state: GameState, playerId: PlayerId) => GameState;
  timing?: 'before' | 'after' | 'instead';
  description?: string;   // 디버그용
}

export interface Card {
  id: string;               // "A086" (직업), "A002" (보조설비) — 실물 카드 ID 그대로
  type: CardType;
  deck: CardDeck;           // 'A' | 'B' | 'C' | 'D' | 'E'
  nameKo: string;
  nameEn: string;
  cost?: ResourceCost;
  effects: CardEffect[];
  victoryPoints?: number | ((state: GameState, playerId: PlayerId) => number);
  clarifications?: string[];
}
```

### 2-5. 행동 공간

```typescript
export interface ActionSpaceAccumulator {
  resource: ResourceType;
  amount: number;         // 매 라운드 쌓이는 양
}

export interface ActionSpace {
  id: string;             // "FARMLAND", "DAY_LABORER" 등
  nameKo: string;
  nameEn: string;
  type: 'permanent' | 'round_card';
  minPlayers?: number;    // 이 이상의 인원에서만 등장
  roundRevealed?: number; // round_card: 몇 번째 라운드에 공개되는지
  accumulates?: ActionSpaceAccumulator[];  // 매 라운드 자원 쌓임
  workerSlots: number;    // 보통 1, 일부 2
  effect: (state: GameState, playerId: PlayerId) => GameState;
}
```

### 2-6. 플레이어 상태

```typescript
export interface PlayerState {
  id: PlayerId;
  name: string;
  color: string;           // Tailwind 클래스 기반 색상 키
  farm: FarmBoard;
  hand: {
    occupations: Card[];
    minorImprovements: Card[];
  };
  playedCards: Card[];     // 발동된 카드
  resources: Resources;
  familySize: number;      // 1-5
  beggingTokens: number;   // 구걸 토큰 (-3점/개)
  workers: WorkerState[];  // 배치된 가족 말
  hasGrown: boolean;       // 이 라운드 가족 늘리기 행동 여부
}

export interface WorkerState {
  playerId: PlayerId;
  actionSpaceId: string | null;  // null = 집에 있음
}
```

### 2-7. 게임 상태 (Firebase 저장 단위)

```typescript
export interface RoundCardState {
  card: ActionSpace;
  accumulatedResources: Resources;  // 쌓인 자원
  workerId: PlayerId | null;        // 배치된 워커
}

export interface ActionSpaceState {
  space: ActionSpace;
  accumulatedResources: Resources;
  workerId: PlayerId | null;
}

export interface GameState {
  // 메타
  roomCode: string;
  phase: GamePhase;
  round: number;          // 1-14
  stage: number;          // 1-6
  roundPhase: RoundPhase;
  harvestPhase?: HarvestPhase;  // roundPhase가 harvest일 때
  currentPlayerIndex: number;
  firstPlayerIndex: number;
  playerOrder: PlayerId[];

  // 플레이어
  players: Record<PlayerId, PlayerState>;

  // 공용 보드
  actionSpaces: Record<string, ActionSpaceState>;
  revealedRoundCards: RoundCardState[];   // 지금까지 공개된 라운드 카드

  // 카드 덱 (셔플됨)
  occupationDeck: Card[];
  minorImprovementDeck: Card[];

  // 주요설비 (공용 - 가장 먼저 짓는 사람이 가져감)
  majorImprovements: MajorImprovement[];

  // 이벤트 로그
  log: GameLogEntry[];
}

export interface GameLogEntry {
  round: number;
  playerId: PlayerId;
  action: string;
  detail?: string;
  timestamp: number;
}
```

### 2-8. 주요설비 (Major Improvements)

```typescript
export interface MajorImprovement {
  id: string;
  nameKo: string;
  nameEn: string;
  cost: ResourceCost;
  effects: CardEffect[];
  victoryPoints: number;
  ownerId: PlayerId | null;   // null = 아직 미건설
}
```

### 2-9. 점수

```typescript
export interface ScoreBreakdown {
  farmlands: number;      // 밭 VP
  pastures: number;       // 목장/동물 VP
  grain: number;          // 밀 VP
  vegetables: number;     // 채소 VP
  sheep: number;          // 양 VP
  boar: number;           // 멧돼지 VP
  cattle: number;         // 소 VP
  emptySpaces: number;    // 빈 공간 패널티 (-1/칸)
  fencedStables: number;  // 울타리 친 외양간 VP
  rooms: number;          // 방 VP
  familyMembers: number;  // 가족 VP
  cardPoints: number;     // 직업/소시설/주요설비 VP
  begging: number;        // 구걸 토큰 (-3/개)
  total: number;
}
```

---

## 3. 엔진 파일 책임 분리

| 파일 | 책임 | 의존성 |
|------|------|--------|
| `types.ts` | 타입 정의만 | 없음 |
| `constants.ts` | 상수값 | types.ts |
| `farm-engine.ts` | 농장 보드 계산 (울타리→목장, 유효성) | types.ts |
| `game-engine.ts` | 게임 흐름 (워커 배치, 수확 등) | types.ts, farm-engine, card-engine |
| `card-engine.ts` | 카드 효과 발동, 트리거 매칭 | types.ts |
| `scoring-engine.ts` | 최종 점수 계산 | types.ts, farm-engine |
| `action-spaces.ts` | ActionSpace 객체 정의 | types.ts |
| `round-cards.ts` | RoundCard 객체 14개 | types.ts |
| `cards/` | 카드 데이터 | types.ts |

> **규칙:** 각 파일은 위 파일만 import 가능. 역방향 의존 금지.

---

## 4. 상태 관리 패턴

### Local 게임 (Phase 1-2)
```typescript
// game-store.ts
const useAgricolaStore = create<AgricolaStore>((set) => ({
  lang: 'ko',
  mode: 'local',    // 'local' | 'online'
  playerCount: 2,
  deck: 'E',
  setLang: (lang) => set({ lang }),
  setMode: (mode) => set({ mode }),
}));

// GamePage.tsx
const [gameState, setGameState] = useState<GameState | null>(null);
// 모든 액션: setGameState(applyAction(gameState, action))
```

### Online 게임 (Phase 3)
```typescript
// Firebase: agricola/{roomCode}/ 에 GameState 저장
// Component에서 Firebase 리스너로 실시간 구독
useEffect(() => subscribeAgricolaRoom(roomCode, setGameState), [roomCode]);
```

---

## 5. 색상 시스템 (colors.ts에 추가 예정)

```typescript
// src/lib/colors.ts에 추가
export const AGRICOLA = {
  PLAYER_COLORS: {
    red:    { bg: 'bg-red-500',    text: 'text-red-700',    border: 'border-red-500' },
    blue:   { bg: 'bg-blue-500',   text: 'text-blue-700',   border: 'border-blue-500' },
    green:  { bg: 'bg-green-600',  text: 'text-green-800',  border: 'border-green-600' },
    yellow: { bg: 'bg-yellow-400', text: 'text-yellow-700', border: 'border-yellow-400' },
  },
  CELL: {
    empty:      'bg-amber-100',
    room_wood:  'bg-amber-700',
    room_clay:  'bg-orange-600',
    room_stone: 'bg-gray-500',
    field:      'bg-yellow-200',
    stable:     'bg-amber-800',
  },
  RESOURCE: {
    wood:      'text-amber-800',
    clay:      'text-orange-600',
    stone:     'text-gray-500',
    reed:      'text-green-500',
    grain:     'text-yellow-600',
    vegetable: 'text-green-700',
    food:      'text-red-500',
    sheep:     'text-gray-200',
    boar:      'text-amber-900',
    cattle:    'text-gray-700',
  },
  FENCE:    'bg-amber-900',
  PASTURE:  'bg-green-100',
  CARD: {
    occupation:        'bg-yellow-50 border-yellow-300',
    minor_improvement: 'bg-white border-gray-200',
    major_improvement: 'bg-amber-50 border-amber-400',
  },
} as const;
```
