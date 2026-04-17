/**
 * 행동 공간 정의 — 영구 행동 공간 10개
 * Phase 1 구현 대상.
 * 출처: docs/agricola/05-action-spaces.md
 */

import type { ActionSpace, GameState, PlayerId } from './types.js';
import { addResources } from './game-engine.js';
import { COST_FENCE_PER_SEGMENT } from './constants.js';

// ── 누적 자원 획득 헬퍼 ──────────────────────────────────────────

function takeAccumulated(state: GameState, playerId: PlayerId, spaceId: string): GameState {
  const spaceState = state.actionSpaces[spaceId];
  if (!spaceState) return state;
  const gained = spaceState.accumulatedResources;
  const newState = addResources(state, playerId, gained);
  return {
    ...newState,
    actionSpaces: {
      ...newState.actionSpaces,
      [spaceId]: { ...spaceState, accumulatedResources: { ...gained, ...Object.fromEntries(Object.keys(gained).map((k) => [k, 0])) } },
    },
  };
}

// ── 영구 행동 공간 10개 ──────────────────────────────────────────

const permanentSpaces: ActionSpace[] = [
  {
    id: 'FOREST',
    nameKo: '숲',
    nameEn: 'Forest',
    type: 'permanent',
    workerSlots: 1,
    accumulates: [{ resource: 'wood', amount: 3 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'FOREST'),
  },
  {
    id: 'CLAY_PIT',
    nameKo: '흙 채굴장',
    nameEn: 'Clay Pit',
    type: 'permanent',
    workerSlots: 1,
    accumulates: [{ resource: 'clay', amount: 1 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'CLAY_PIT'),
  },
  {
    id: 'REED_BANK',
    nameKo: '갈대밭',
    nameEn: 'Reed Bank',
    type: 'permanent',
    workerSlots: 1,
    accumulates: [{ resource: 'reed', amount: 1 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'REED_BANK'),
  },
  {
    id: 'FISHING',
    nameKo: '낚시',
    nameEn: 'Fishing',
    type: 'permanent',
    workerSlots: 1,
    accumulates: [{ resource: 'food', amount: 1 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'FISHING'),
  },
  {
    id: 'GRAIN_SEEDS',
    nameKo: '곡식 종자',
    nameEn: 'Grain Seeds',
    type: 'permanent',
    workerSlots: 1,
    // 비누적: 매 라운드 밀 1개 고정
    effect: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { grain: 1 }),
  },
  {
    id: 'FARMLAND',
    nameKo: '농지',
    nameEn: 'Farmland',
    type: 'permanent',
    workerSlots: 1,
    // 밭 1칸 갈기 → UI가 셀 선택 후 plowField() 호출
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_plow' as const }),
  },
  {
    id: 'LESSONS',
    nameKo: '교습',
    nameEn: 'Lessons',
    type: 'permanent',
    workerSlots: 1,
    // 직업 카드 1장 플레이 (첫 번째 무료, 이후 음식 1)
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_play_occupation' as const }),
  },
  {
    id: 'DAY_LABORER',
    nameKo: '날품팔이',
    nameEn: 'Day Laborer',
    type: 'permanent',
    workerSlots: 1,
    effect: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { food: 2 }),
  },
  {
    id: 'FARM_EXPANSION',
    nameKo: '방 만들기·외양간 짓기',
    nameEn: 'Farm Expansion',
    type: 'permanent',
    workerSlots: 1,
    // 방 건설 and/or 외양간 건설 → UI 처리
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_build_room' as const }),
  },
  {
    id: 'MEETING_PLACE',
    nameKo: '회합 장소',
    nameEn: 'Meeting Place',
    type: 'permanent',
    workerSlots: 1,
    // 선플레이어 토큰 획득 (의무) + 소시설 1장 무료 플레이 가능 (선택)
    effect: (state: GameState, playerId: PlayerId) => ({
      ...state,
      startingPlayerToken: playerId,
      firstPlayerIndex: state.playerOrder.indexOf(playerId),
      roundPhase: 'pending_play_minor_imp' as const,
    }),
  },
];

// ── 인원별 추가 행동 공간 ─────────────────────────────────────────

const ext4Spaces: ActionSpace[] = [
  {
    id: 'EXT4_COPSE',
    nameKo: '덤불',
    nameEn: 'Copse',
    type: 'permanent',
    minPlayers: 4,
    workerSlots: 1,
    accumulates: [{ resource: 'wood', amount: 1 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'EXT4_COPSE'),
  },
  {
    id: 'EXT4_GROVE',
    nameKo: '수풀',
    nameEn: 'Grove',
    type: 'permanent',
    minPlayers: 4,
    workerSlots: 1,
    accumulates: [{ resource: 'wood', amount: 2 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'EXT4_GROVE'),
  },
  {
    id: 'EXT4_HOLLOW',
    nameKo: '깊은 흙 채굴장',
    nameEn: 'Hollow',
    type: 'permanent',
    minPlayers: 4,
    workerSlots: 1,
    accumulates: [{ resource: 'clay', amount: 2 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'EXT4_HOLLOW'),
  },
  {
    id: 'EXT4_RES_MKT',
    nameKo: '자원 시장',
    nameEn: 'Resource Market',
    type: 'permanent',
    minPlayers: 4,
    workerSlots: 1,
    effect: (state: GameState, playerId: PlayerId) =>
      addResources(state, playerId, { reed: 1, stone: 1, food: 1 }),
  },
  {
    id: 'EXT4_LESSONS_A',
    nameKo: '교습 A',
    nameEn: 'Lessons',
    type: 'permanent',
    minPlayers: 4,
    workerSlots: 1,
    // 직업 카드 1장 플레이 (음식 2개 비용, 첫 2장은 1개씩)
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_play_occupation' as const }),
  },
  {
    id: 'EXT4_TRAVEL',
    nameKo: '유랑극단',
    nameEn: 'Traveling Players',
    type: 'permanent',
    minPlayers: 4,
    workerSlots: 1,
    accumulates: [{ resource: 'food', amount: 1 }],
    // Phase 1 TODO: 이번 라운드 워커 추가 가능 효과
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'EXT4_TRAVEL'),
  },
];

const ext3Spaces: ActionSpace[] = [
  {
    id: 'EXT3_LESSONS',
    nameKo: '교습',
    nameEn: 'Lessons',
    type: 'permanent',
    minPlayers: 3,
    workerSlots: 1,
    // 직업 카드 1장 플레이 (음식 1개 비용)
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_play_occupation' as const }),
  },
];

const v34Spaces: ActionSpace[] = [
  {
    id: 'V34_ANIMAL_MKT',
    nameKo: '가축 시장',
    nameEn: 'Animal Market',
    type: 'permanent',
    minPlayers: 3,
    workerSlots: 1,
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_animal_select' as const }),
  },
  {
    id: 'V34_MODEST_WISH',
    nameKo: '소박한 가족 늘리기',
    nameEn: 'Modest Wish for Children',
    type: 'permanent',
    minPlayers: 3,
    workerSlots: 1,
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_family_growth' as const }),
  },
];

// 2인 타일 (4개 공간 중 1개 선택 사용 — 사용 시 전체 봉쇄)
const v2Spaces: ActionSpace[] = [
  {
    id: 'V2_COPSE',
    nameKo: '덤불',
    nameEn: 'Copse',
    type: 'permanent',
    minPlayers: 2,
    workerSlots: 1,
    accumulates: [{ resource: 'wood', amount: 1 }],
    effect: (state: GameState, playerId: PlayerId) => takeAccumulated(state, playerId, 'V2_COPSE'),
  },
  {
    id: 'V2_RES_MKT',
    nameKo: '자원 시장',
    nameEn: 'Resource Market',
    type: 'permanent',
    minPlayers: 2,
    workerSlots: 1,
    effect: (state: GameState, playerId: PlayerId) =>
      addResources(state, playerId, { stone: 1, food: 1 }),
  },
  {
    id: 'V2_ANIMAL_MKT',
    nameKo: '가축 시장',
    nameEn: 'Animal Market',
    type: 'permanent',
    minPlayers: 2,
    workerSlots: 1,
    // 양+음식1 OR 멧돼지 OR 소-음식1 선택 → UI가 처리
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_animal_select' as const }),
  },
  {
    id: 'V2_MODEST_WISH',
    nameKo: '소박한 가족 늘리기',
    nameEn: 'Modest Wish for Children',
    type: 'permanent',
    minPlayers: 2,
    workerSlots: 1,
    // 5라운드 이후, 빈 방 필요 → pending_family_growth와 동일하나 라운드 조건 추가
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_family_growth' as const }),
  },
];

// ── 공개 API ─────────────────────────────────────────────────────

export function getPermanentActionSpaces(playerCount: 2 | 3 | 4): ActionSpace[] {
  const base = [...permanentSpaces];
  if (playerCount === 2) return [...base, ...v2Spaces];
  if (playerCount === 3) return [...base, ...ext3Spaces, ...v34Spaces];
  return [...base, ...ext4Spaces, ...v34Spaces];
}

// COST_FENCE_PER_SEGMENT 사용 방지 lint 에러 억제
export { COST_FENCE_PER_SEGMENT };
