/**
 * 아그리콜라 2016 개정판 — 전체 타입 시스템
 * 출처: docs/agricola/03-architecture.md
 * 이 파일이 유일한 타입 소스. 다른 파일에서 타입을 재정의하지 않는다.
 */

// ── 기본 식별자 / 열거형 ──────────────────────────────────────────

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
  | 'stable';

// 개정판 덱 체계: A/B = 기본판 내장, C/D/E = 확장팩
export type CardDeck = 'A' | 'B' | 'C' | 'D' | 'E';
export type CardType = 'occupation' | 'minor_improvement';

export type TriggerType =
  | 'IMMEDIATE'       // 카드 플레이 즉시
  | 'PLACE_WORKER'    // 가족 말 배치 후
  | 'HARVEST_FIELD'   // 밭 수확 단계
  | 'HARVEST_FEED'    // 식량 공급 단계
  | 'HARVEST_BREED'   // 번식 단계
  | 'BUILD_ROOM'      // 방 건설 시
  | 'RENOVATE'        // 집 개량 시
  | 'BUILD_FENCE'     // 울타리 건설 시
  | 'BUILD_STABLE'    // 외양간 건설 시
  | 'PLOW_FIELD'      // 밭 갈기 시
  | 'SOW'             // 씨 뿌리기 시
  | 'BAKE_BREAD'      // 빵 굽기 시
  | 'GET_RESOURCE'    // 자원 획득 시
  | 'ROUND_START'     // 라운드 시작 시
  | 'GAME_END'        // 게임 종료 점수 계산 시
  | 'PASSIVE'         // 항상 적용되는 수동 효과
  | 'ANYTIME';        // 언제든 사용 가능 (액티브 효과)

export type GamePhase = 'lobby' | 'setup' | 'playing' | 'harvest' | 'gameover';

export type RoundPhase =
  | 'start_round'    // 라운드 카드 공개
  | 'replenish'      // 자원 보충
  | 'work'           // 가족 말 배치 (플레이어 턴)
  | 'return_home'    // 가족 말 회수
  | 'pending_plow'       // 밭 갈기 선택 대기
  | 'pending_sow'        // 씨 뿌리기 선택 대기
  | 'pending_plow_sow'   // 밭 갈기 + 씨 뿌리기 대기 (RC_CULTIVATION)
  | 'pending_fence'      // 울타리 건설 대기
  | 'pending_renovate'   // 집 개량 대기
  | 'pending_renovate_fence'  // 집 개량 + 울타리 대기 (RC_FARM_RENO)
  | 'pending_family_growth'         // 가족 증가 대기 (방 필요 — RC_BASIC_WISH)
  | 'pending_family_growth_urgent'  // 가족 증가 대기 (방 불필요 — RC_URGENT_WISH)
  | 'pending_build_room'            // 방 건설 대기 (FARM_EXPANSION)
  | 'pending_build_stable'          // 외양간 건설 대기 (FARM_EXPANSION)
  | 'pending_animal_select'         // 가축 시장 동물 종 선택 대기
  | 'pending_animal_choice'         // 동물 배치 선택 대기
  | 'pending_major_imp'             // 주요 설비 건설 선택 대기 (RC_MAJOR_IMP + MEETING_PLACE)
  | 'pending_play_occupation'       // 직업 카드 선택 대기 (LESSONS)
  | 'pending_play_minor_imp';       // 소시설 카드 선택 대기 (MEETING_PLACE, 선택 사항)

export type HarvestPhase = 'field' | 'feeding' | 'breeding' | 'done';

export type Lang = 'ko' | 'en' | 'zh';

// ── 농장 보드 ──────────────────────────────────────────────────────

/** 농장 그리드: 3행 × 5열. [row][col], 0-indexed */
export type FarmGrid = CellType[][];

/** 씨 뿌린 밭 */
export interface SownField {
  row: number;
  col: number;
  resource: 'grain' | 'vegetable';
  count: number; // 수확 시 1씩 감소
}

/**
 * 울타리 좌표계
 * horizontal[r][c] = true → r행 c열 셀의 위쪽 경계선 (4행×5열)
 *   r=0: 보드 상단 외벽 (명시 배치 필요)
 *   r=3: 보드 하단 외벽 (명시 배치 필요)
 * vertical[r][c] = true → c열의 왼쪽 경계선 (3행×6열)
 *   c=0: 왼쪽 외벽 (명시 배치 필요)
 *   c=1..4: 열 사이 내부 울타리
 *   c=5: 오른쪽 외벽 (명시 배치 필요)
 */
export interface FenceGrid {
  horizontal: boolean[][]; // [4][5]
  vertical: boolean[][];   // [3][6]
}

/** 울타리로 둘러싸인 목장 (farm-engine이 자동 계산) */
export interface Pasture {
  cells: Array<[number, number]>; // [row, col]
  hasStable: boolean;
  capacity: number; // 2^셀수 × (외양간 있으면 ×2)
  animals: AnimalStack | null;
}

/** 동물 스택 */
export interface AnimalStack {
  type: AnimalType;
  count: number;
}

export interface FarmBoard {
  grid: FarmGrid;           // 3×5
  sownFields: SownField[];
  fences: FenceGrid;
  pastures: Pasture[];      // farm-engine이 fences 기반으로 자동 계산
  stables: Array<[number, number]>; // 외양간 위치
  animalsInHouse: AnimalStack[];    // 집 안 동물 (최대 1마리 기본)
}

// ── 자원 ────────────────────────────────────────────────────────────

export type Resources = Record<ResourceType, number>;

export function emptyResources(): Resources {
  return {
    wood: 0, clay: 0, stone: 0, reed: 0,
    grain: 0, vegetable: 0, food: 0,
    sheep: 0, boar: 0, cattle: 0,
  };
}

// ── 카드 ────────────────────────────────────────────────────────────

export interface ResourceCost {
  wood?: number;
  clay?: number;
  stone?: number;
  reed?: number;
  food?: number;
  grain?: number;
  vegetable?: number;
  sheep?: number;
  boar?: number;
  cattle?: number;
}

export interface CardEffect {
  trigger: TriggerType;
  /** 트리거 조건 — 없으면 항상 발동 */
  condition?: (state: GameState, player: PlayerState, actionId?: string) => boolean;
  /** 효과 적용: 순수 함수, 새 GameState 반환 */
  apply: (state: GameState, playerId: PlayerId) => GameState;
  timing?: 'before' | 'after' | 'instead';
  /** 디버그용 설명 */
  description?: string;
}

export interface Card {
  /** 실물 카드 ID 그대로: "A086", "B019" 등 */
  id: string;
  type: CardType;
  deck: CardDeck;
  nameKo: string;
  nameEn: string;
  cost?: ResourceCost;
  /** 직업 카드 플레이 비용 (기본: 첫 번째 무료, 이후 음식 1) */
  playingCost?: ResourceCost;
  effects: CardEffect[];
  victoryPoints?: number | ((state: GameState, playerId: PlayerId) => number);
  prerequisites?: string;
  clarifications?: string[];
}

// ── 행동 공간 ─────────────────────────────────────────────────────

export interface ActionSpaceAccumulator {
  resource: ResourceType;
  amount: number; // 매 라운드 쌓이는 양
}

export interface ActionSpace {
  id: string;            // "FARMLAND", "DAY_LABORER" 등
  nameKo: string;
  nameEn: string;
  type: 'permanent' | 'round_card';
  /** 이 인원 이상일 때만 사용 가능 */
  minPlayers?: number;
  /** round_card: 몇 번째 라운드에 공개되는지 */
  roundRevealed?: number;
  /** 누적 공간: 매 라운드 자원이 쌓임 */
  accumulates?: ActionSpaceAccumulator[];
  workerSlots: number;   // 보통 1
  effect: (state: GameState, playerId: PlayerId) => GameState;
}

// ── 플레이어 ─────────────────────────────────────────────────────

export interface PlayerState {
  id: PlayerId;
  name: string;
  /** 플레이어 색상 키 (colors.ts AGRICOLA.PLAYER_COLORS 참조) */
  color: 'red' | 'blue' | 'green' | 'yellow';
  farm: FarmBoard;
  hand: {
    occupations: Card[];
    minorImprovements: Card[];
  };
  playedCards: Card[];     // 플레이된 카드 (발동 순서 유지)
  resources: Resources;
  familySize: number;      // 1-5
  beggingTokens: number;   // -3점/개
  workers: WorkerState[];
  hasGrown: boolean;       // 이 라운드에 가족 늘리기 행동 여부
  /** 총 플레이한 직업 카드 수 (교습 비용 계산용) */
  occupationsPlayed: number;
  /** 우물 건설 후 다음 라운드 시작 시 받을 음식 잔여 횟수 (최대 4) */
  wellFoodRemaining?: number;
}

export interface WorkerState {
  playerId: PlayerId;
  actionSpaceId: string | null; // null = 집에 있음
}

// ── 게임 상태 (Firebase 저장 단위) ────────────────────────────────

export interface ActionSpaceState {
  space: ActionSpace;
  accumulatedResources: Resources;
  workerId: PlayerId | null;
}

export interface RoundCardState extends ActionSpaceState {
  stageRevealed: number;
}

export interface GameState {
  // 메타
  roomCode: string;
  phase: GamePhase;
  round: number;          // 1-14
  stage: number;          // 1-6
  roundPhase: RoundPhase;
  harvestPhase?: HarvestPhase;
  /** 수확 중 현재 처리 대상 플레이어 인덱스. 비수확 중엔 null */
  harvestPlayerIndex?: number | null;
  currentPlayerIndex: number;
  firstPlayerIndex: number;
  playerOrder: PlayerId[];

  // 플레이어
  players: Record<PlayerId, PlayerState>;

  // 공용 보드
  /** 영구 행동 공간 10개 */
  actionSpaces: Record<string, ActionSpaceState>;
  /** 현재까지 공개된 라운드 카드 */
  revealedRoundCards: RoundCardState[];
  /** 아직 공개되지 않은 라운드 카드 (스테이지별 순서) */
  pendingRoundCards: ActionSpace[][];

  // 카드 덱 (셔플됨)
  occupationDeck: Card[];
  minorImprovementDeck: Card[];

  // 주요설비 (공용 보드)
  majorImprovements: MajorImprovement[];

  // 선플레이어 토큰
  startingPlayerToken: PlayerId;

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

// ── 주요설비 ────────────────────────────────────────────────────────

export interface MajorImprovement {
  id: string;
  nameKo: string;
  nameEn: string;
  cost: ResourceCost;
  effects: CardEffect[];
  victoryPoints: number;
  ownerId: PlayerId | null; // null = 미건설
}

// ── 점수 ────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  farmlands: number;      // 밭 VP
  pastures: number;       // 목장 구획 VP
  grain: number;          // 밀 VP
  vegetables: number;     // 채소 VP
  sheep: number;          // 양 VP
  boar: number;           // 멧돼지 VP
  cattle: number;         // 소 VP
  emptySpaces: number;    // 빈 공간 패널티 (-1/칸)
  fencedStables: number;  // 울타리 친 외양간 VP (+1/개)
  rooms: number;          // 방 VP (점토1/방, 돌2/방)
  familyMembers: number;  // 가족 VP (3점/명)
  cardPoints: number;     // 직업/소시설/주요설비 VP 합산
  begging: number;        // 구걸 토큰 (-3/개)
  total: number;
}

// ── Zustand 스토어 타입 ───────────────────────────────────────────

export interface AgricolaStoreState {
  lang: Lang;
  mode: 'local' | 'online';
  playerCount: 2 | 3 | 4;
  deck: 'AB'; // 기본판 A+B덱
  gameState: GameState | null;
  setLang: (lang: Lang) => void;
  setMode: (mode: 'local' | 'online') => void;
  setPlayerCount: (count: 2 | 3 | 4) => void;
  setGameState: (state: GameState | null) => void;
}

// ── 게임 설정 ──────────────────────────────────────────────────────

export interface CreateGameConfig {
  playerCount: 2 | 3 | 4;
  playerNames: string[];
  playerColors?: Array<'red' | 'blue' | 'green' | 'yellow'>;
  /** 명시적 플레이어 ID (Phase B 온라인: Firebase pid 사용). 미지정 시 'player_{i}' */
  playerIds?: string[];
  seed?: number;
  deck: 'AB';
}

// ── Phase B: 온라인 (호스트/클라이언트) ──────────────────────────────

/** 로비 중 참가자 정보 (게임 시작 전) */
export interface LobbyPlayer {
  pid: PlayerId;              // Firebase push key
  name: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  ready: boolean;
  joinedAt: number;           // serverTimestamp
  connected: boolean;         // onDisconnect 기반
}

/** 방 메타데이터 */
export interface RoomMeta {
  game: 'agricola';
  createdAt: number;
  phase: 'lobby' | 'playing' | 'ended';
  hostSessionId: string;      // 호스트 고유 세션 식별자
  hostConnected: boolean;
  desiredPlayerCount: 2 | 3 | 4;
  lang: Lang;
}

/** 손패 격리 영역 (privateHands/{pid}) */
export interface PrivateHand {
  occupations: Card[];
  minorImprovements: Card[];
}

/** 클라이언트 → 호스트 액션 요청 종류 */
export type ActionKind =
  | 'place_worker'          // 행동 공간에 가족 말 배치
  | 'pending_confirm'       // pending_* 확정 버튼
  | 'cell_click'            // 농장 셀 클릭 (plow/sow/build/renovate 대상)
  | 'family_member_click'   // 가족 구성원 선택 (배치할 가족 말)
  | 'fence_click'           // 울타리 세그먼트 토글
  | 'place_animal'          // 동물 배치 (pasture index 또는 'house')
  | 'remove_animal'         // 동물 교체용 제거
  | 'cancel_replace'        // 교체 취소 (새 동물 버림)
  | 'overflow_replace'      // 오버플로우 → 교체 진입
  | 'overflow_cook'         // 오버플로우 → 요리
  | 'overflow_discard'      // 오버플로우 → 버림
  | 'cook_animal'           // 언제든 요리
  | 'play_card'             // 직업/소시설 플레이
  | 'bake_bread'            // 빵 굽기 (수확 중)
  | 'build_major'           // 주요설비 건설 선택
  | 'animal_select'         // 가축 시장 종 선택
  | 'end_round'             // 라운드 종료 (호스트 전용)
  | 'harvest_confirm';      // 수확 1인 확정 (호스트 전용)

/** 액션 큐 아이템 */
export interface ActionQueueItem {
  id?: string;              // push key (RTDB 에서 자동)
  playerId: PlayerId;
  kind: ActionKind;
  payload: Record<string, unknown>;
  status: 'pending' | 'applied' | 'rejected';
  reason?: string;          // rejected 시 사유
  createdAt: number;
  appliedAt?: number;
}

/** 방 전체 스냅샷 (subscribeRoom 이 받는 구조) */
export interface RoomSnapshot {
  meta: RoomMeta;
  lobby: Record<PlayerId, LobbyPlayer>;
  gameState: GameState | null;
  privateHands?: Record<PlayerId, PrivateHand>;
  actions?: Record<string, ActionQueueItem>;
}
