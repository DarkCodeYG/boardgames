/**
 * 아그리콜라 2016 개정판 — 게임 상수
 * 출처: docs/agricola/05-action-spaces.md, 06-scoring.md
 * 모든 "마법 숫자"는 여기에 정의. 엔진 파일에서 직접 숫자 쓰지 않는다.
 */

// ── 기본 구조 ─────────────────────────────────────────────────────

export const FARM_ROWS = 3;
export const FARM_COLS = 5;
export const MAX_ROUNDS = 14;
export const MAX_STAGES = 6;
export const MAX_FAMILY_SIZE = 5;
export const INITIAL_FAMILY_SIZE = 2;
export const INITIAL_ROOMS = 2; // 나무 방 2칸에서 시작 (단, 초기 보드는 방1 + 빈칸1 배치)
export const BEGGING_FOOD_PER_PERSON = 2; // 수확 시 가족 1인당 필요 음식
export const BEGGING_PENALTY = -3; // 구걸 토큰 1개당 VP

// ── 라운드 / 스테이지 매핑 ───────────────────────────────────────

/** 스테이지별 라운드 목록 */
export const STAGE_ROUNDS: Record<number, readonly number[]> = {
  1: [1, 2, 3, 4],
  2: [5, 6, 7],
  3: [8, 9],
  4: [10, 11],
  5: [12, 13],
  6: [14],
} as const;

/** 수확이 일어나는 라운드 (스테이지 마지막 라운드) */
export const HARVEST_ROUNDS: readonly number[] = [4, 7, 9, 11, 13, 14] as const;

/** 라운드 → 스테이지 역방향 매핑 */
export const ROUND_TO_STAGE: Record<number, number> = Object.fromEntries(
  Object.entries(STAGE_ROUNDS).flatMap(([stage, rounds]) =>
    rounds.map((r) => [r, Number(stage)])
  )
);

// ── 행동 공간 ID ────────────────────────────────────────────────

/** 영구 행동 공간 10개 ID (출처: Unofficial Compendium v4.1) */
export const PERMANENT_ACTION_SPACE_IDS = [
  'FOREST',         // 큰 숲: 누적 +3 나무
  'CLAY_PIT',       // 점토 구덩이: 누적 +1 점토
  'REED_BANK',      // 갈대 호수: 누적 +1 갈대
  'FISHING',        // 낚시: 누적 +1 음식
  'GRAIN_SEEDS',    // 곡식 씨앗: 밀 1개 (비누적)
  'FARMLAND',       // 경작지: 밭 1칸 갈기
  'LESSONS',        // 교습: 직업 1장 (첫 번째 무료, 이후 음식1)
  'DAY_LABORER',    // 날품팔이: 음식 2개
  'FARM_EXPANSION', // 농장 확장: 방 건설 and/or 외양간 건설
  'MEETING_PLACE',  // 만남의 장소: 선플레이어 토큰 획득 (의무)
] as const;

export type PermanentActionSpaceId = typeof PERMANENT_ACTION_SPACE_IDS[number];

/** 라운드 카드 ID (스테이지 순서) */
export const ROUND_CARD_IDS_BY_STAGE: Record<number, readonly string[]> = {
  1: ['RC_MAJOR_IMP', 'RC_FENCING', 'RC_GRAIN_UTIL', 'RC_SHEEP_MKT'],
  2: ['RC_BASIC_WISH', 'RC_HOUSE_RENO', 'RC_WEST_QUARRY'],
  3: ['RC_VEG_SEEDS', 'RC_PIG_MKT'],
  4: ['RC_CATTLE_MKT', 'RC_EAST_QUARRY'],
  5: ['RC_URGENT_WISH', 'RC_CULTIVATION'],
  6: ['RC_FARM_RENO'],
} as const;

/** 인원별 추가 행동 공간 */
export const PLAYER_COUNT_EXTENSION_IDS: Record<number, readonly string[]> = {
  2: ['V2_COPSE', 'V2_RES_MKT', 'V2_ANIMAL_MKT', 'V2_MODEST_WISH'],
  3: ['EXT3_LESSONS', 'V34_ANIMAL_MKT', 'V34_MODEST_WISH'],
  4: ['EXT4_COPSE', 'EXT4_GROVE', 'EXT4_HOLLOW', 'EXT4_RES_MKT', 'EXT4_LESSONS_A', 'EXT4_TRAVEL',
      'V34_ANIMAL_MKT', 'V34_MODEST_WISH'],
} as const;

// ── 점수 테이블 ──────────────────────────────────────────────────

/** 밭 점수: index = 밭 수 (5 이상은 index 5 사용) */
export const SCORE_TABLE_FIELDS: readonly number[] = [-1, 1, 2, 3, 4, 4] as const;

/** 목장 구획 점수: index = 구획 수 (4 이상은 index 4 사용) */
export const SCORE_TABLE_PASTURES: readonly number[] = [-1, 1, 2, 3, 4] as const;

/** 밀 점수 구간: [최대수량, VP] 형식 */
export const SCORE_GRAIN = (count: number): number => {
  if (count === 0) return -1;
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 7) return 3;
  return 4;
};

/** 채소 점수: index = 수량 (4 이상은 index 4 사용) */
export const SCORE_TABLE_VEGETABLES: readonly number[] = [-1, 1, 2, 3, 4] as const;

/** 양 점수 구간 */
export const SCORE_SHEEP = (count: number): number => {
  if (count === 0) return -1;
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 7) return 3;
  return 4;
};

/** 멧돼지 점수 구간 */
export const SCORE_BOAR = (count: number): number => {
  if (count === 0) return -1;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
};

/** 소 점수 구간 */
export const SCORE_CATTLE = (count: number): number => {
  if (count === 0) return -1;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
};

/** 빈 공간 패널티: 빈 셀 1개당 -1 */
export const SCORE_EMPTY_SPACE = -1;

/** 울타리 친 외양간: 1개당 +1 */
export const SCORE_FENCED_STABLE = 1;

/** 방 VP: 나무=0, 점토=1, 돌=2 */
export const SCORE_ROOM: Record<string, number> = {
  room_wood:  0,
  room_clay:  1,
  room_stone: 2,
} as const;

/** 가족 VP: 1인당 3점 */
export const SCORE_FAMILY_PER_PERSON = 3;

// ── 건설 비용 ───────────────────────────────────────────────────

/** 나무 방 건설 비용 */
export const COST_WOOD_ROOM = { wood: 5, reed: 2 } as const;

/** 외양간 건설 비용 */
export const COST_STABLE = { wood: 2 } as const;

/** 집 개량 비용 (방 1개당 × 방 수 + 갈대 1개 전체) */
export const COST_RENOVATION_PER_ROOM = {
  wood_to_clay: { clay: 1 },
  clay_to_stone: { stone: 1 },
} as const;
export const COST_RENOVATION_REED = 1; // 갈대 1개 (전체, 방 수 무관)

/** 울타리 건설 비용 */
export const COST_FENCE_PER_SEGMENT = { wood: 1 } as const;

/** 총 울타리 목재 최대치 (15세대 기준 일반적 한도) */
export const MAX_FENCE_SEGMENTS = 15;

// ── 대시설 ID ───────────────────────────────────────────────────

export const MAJOR_IMPROVEMENT_IDS = [
  'MAJ_FIREPLACE_2',
  'MAJ_FIREPLACE_3',
  'MAJ_COOKING_HEARTH_4',
  'MAJ_COOKING_HEARTH_5',
  'MAJ_WELL',
  'MAJ_CLAY_OVEN',
  'MAJ_STONE_OVEN',
  'MAJ_JOINERY',
  'MAJ_POTTERY',
  'MAJ_BASKETMAKERS_WORKSHOP',
] as const;

// ── 기본판 카드 ID 목록 ─────────────────────────────────────────

/** A덱 직업 카드 24장 */
export const DECK_A_OCCUPATION_IDS = [
  'A086', 'A087', 'A088', 'A090', 'A092', 'A098', 'A102', 'A108',
  'A110', 'A111', 'A112', 'A114', 'A116', 'A119', 'A120', 'A123',
  'A125', 'A133', 'A138', 'A143', 'A147', 'A155', 'A160', 'A165',
] as const;

/** B덱 직업 카드 (23장 확인, B096 미확인) */
export const DECK_B_OCCUPATION_IDS = [
  'B087', 'B089', 'B091', 'B095', 'B097', 'B098', 'B099', 'B102',
  'B104', 'B107', 'B108', 'B109', 'B114', 'B118', 'B121', 'B123',
  'B136', 'B142', 'B145', 'B156', 'B163', 'B164', 'B166',
] as const;

/** A덱 소시설 카드 24장 */
export const DECK_A_IMPROVEMENT_IDS = [
  'A002', 'A005', 'A009', 'A012', 'A016', 'A019', 'A024', 'A026',
  'A032', 'A033', 'A038', 'A044', 'A050', 'A053', 'A055', 'A056',
  'A063', 'A067', 'A069', 'A071', 'A075', 'A078', 'A080', 'A083',
] as const;

/** B덱 소시설 카드 24장 */
export const DECK_B_IMPROVEMENT_IDS = [
  'B002', 'B008', 'B010', 'B013', 'B016', 'B019', 'B024', 'B025',
  'B033', 'B036', 'B039', 'B045', 'B047', 'B050', 'B056', 'B057',
  'B061', 'B062', 'B066', 'B068', 'B074', 'B077', 'B080', 'B084',
] as const;

// ── 목장 용량 계산 ──────────────────────────────────────────────

/**
 * 목장 수용 동물 수 계산
 * 룰: 울타리 구역 안 칸 1개당 동물 2마리 수용. 외양간 1개당 해당 목장 용량 ×2.
 * @param cellCount - 목장 내 셀 수
 * @param stableCount - 목장 내 외양간 수 (각각 ×2 배수 적용)
 */
export function calcPastureCapacity(cellCount: number, stableCount: number): number {
  const base = cellCount * 2; // 1칸 = 2마리
  return base * Math.pow(2, stableCount); // 외양간 1개당 ×2
}

// ── 인원별 초기 카드 배분 수 ────────────────────────────────────

/** 게임 시작 시 손패 카드 수 */
export const INITIAL_HAND_SIZE: Record<number, { occupations: number; improvements: number }> = {
  1: { occupations: 7, improvements: 7 },
  2: { occupations: 7, improvements: 7 },
  3: { occupations: 7, improvements: 7 },
  4: { occupations: 7, improvements: 7 },
} as const;
