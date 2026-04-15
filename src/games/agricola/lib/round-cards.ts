/**
 * 라운드 카드 14장 정의
 * Phase 1 구현 대상.
 * 출처: docs/agricola/05-action-spaces.md
 */

import type { ActionSpace, GameState, PlayerId } from './types.js';
import { addResources } from './game-engine.js';

// ── 라운드 카드 정의 ─────────────────────────────────────────────

function makeAccumCard(id: string, nameKo: string, nameEn: string, resource: 'sheep' | 'boar' | 'cattle' | 'stone'): ActionSpace {
  return {
    id,
    nameKo,
    nameEn,
    type: 'round_card',
    workerSlots: 1,
    accumulates: [{ resource, amount: 1 }],
    effect: (state: GameState, playerId: PlayerId) => {
      const spaceState =
        state.actionSpaces[id] ??
        state.revealedRoundCards.find((rc) => rc.space.id === id);
      if (!spaceState) return state;
      const gained = spaceState.accumulatedResources;
      return addResources(state, playerId, gained);
    },
  };
}

const roundCards: ActionSpace[] = [
  // ── 스테이지 1 ────────────────────────────────────────────────
  {
    id: 'RC_MAJOR_IMP',
    nameKo: '대시설',
    nameEn: 'Major Improvement',
    type: 'round_card',
    roundRevealed: undefined, // 스테이지 1 임의 순서
    workerSlots: 1,
    // Phase 2: 대시설/소시설 선택 플레이. Phase 1: pass
    effect: (state: GameState, _playerId: PlayerId) => state,
  },
  {
    id: 'RC_FENCING',
    nameKo: '울타리 건설',
    nameEn: 'Fencing',
    type: 'round_card',
    workerSlots: 1,
    // UI가 울타리 선택 후 buildFences() 호출
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_fence' as const }),
  },
  {
    id: 'RC_GRAIN_UTIL',
    nameKo: '농업 활용',
    nameEn: 'Grain Utilization',
    type: 'round_card',
    workerSlots: 1,
    // 씨뿌리기 and/or 빵 굽기 — UI 처리
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_sow' as const }),
  },
  makeAccumCard('RC_SHEEP_MKT', '양 시장', 'Sheep Market', 'sheep'),

  // ── 스테이지 2 ────────────────────────────────────────────────
  {
    id: 'RC_BASIC_WISH',
    nameKo: '가족 소원 (기본)',
    nameEn: 'Basic Wish for Children',
    type: 'round_card',
    workerSlots: 1,
    // 가족 증가 (방 필요) — UI가 growFamily(state, id, true) 호출
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_family_growth' as const }),
  },
  {
    id: 'RC_HOUSE_RENO',
    nameKo: '집 개량',
    nameEn: 'House Redevelopment',
    type: 'round_card',
    workerSlots: 1,
    // 집 개량 1회 — UI가 renovateHouse() 호출
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_renovate' as const }),
  },
  makeAccumCard('RC_WEST_QUARRY', '서쪽 채석장', 'Western Quarry', 'stone'),

  // ── 스테이지 3 ────────────────────────────────────────────────
  {
    id: 'RC_VEG_SEEDS',
    nameKo: '채소 씨앗',
    nameEn: 'Vegetable Seeds',
    type: 'round_card',
    workerSlots: 1,
    effect: (state: GameState, playerId: PlayerId) =>
      addResources(state, playerId, { vegetable: 1 }),
  },
  makeAccumCard('RC_PIG_MKT', '돼지 시장', 'Pig Market', 'boar'),

  // ── 스테이지 4 ────────────────────────────────────────────────
  makeAccumCard('RC_CATTLE_MKT', '소 시장', 'Cattle Market', 'cattle'),
  makeAccumCard('RC_EAST_QUARRY', '동쪽 채석장', 'Eastern Quarry', 'stone'),

  // ── 스테이지 5 ────────────────────────────────────────────────
  {
    id: 'RC_URGENT_WISH',
    nameKo: '급한 가족 늘리기',
    nameEn: 'Urgent Wish for Children',
    type: 'round_card',
    workerSlots: 1,
    // 가족 증가 (방 없어도 가능) — growFamily(state, id, false)
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_family_growth' as const }),
  },
  {
    id: 'RC_CULTIVATION',
    nameKo: '밭 농사',
    nameEn: 'Cultivation',
    type: 'round_card',
    workerSlots: 1,
    // 밭 갈기 + 씨 뿌리기 — UI 처리
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_plow_sow' as const }),
  },

  // ── 스테이지 6 ────────────────────────────────────────────────
  {
    id: 'RC_FARM_RENO',
    nameKo: '농장 개조',
    nameEn: 'Farm Redevelopment',
    type: 'round_card',
    workerSlots: 1,
    // 집 개조 + 울타리 — UI 처리
    effect: (state: GameState, _playerId: PlayerId) => ({ ...state, roundPhase: 'pending_renovate_fence' as const }),
  },
];

// ── 스테이지별 카드 매핑 ─────────────────────────────────────────

const stageCardIds: Record<number, string[]> = {
  1: ['RC_MAJOR_IMP', 'RC_FENCING', 'RC_GRAIN_UTIL', 'RC_SHEEP_MKT'],
  2: ['RC_BASIC_WISH', 'RC_HOUSE_RENO', 'RC_WEST_QUARRY'],
  3: ['RC_VEG_SEEDS', 'RC_PIG_MKT'],
  4: ['RC_CATTLE_MKT', 'RC_EAST_QUARRY'],
  5: ['RC_URGENT_WISH', 'RC_CULTIVATION'],
  6: ['RC_FARM_RENO'],
};

export function getRoundCardsByStage(stage: number): ActionSpace[] {
  const ids = stageCardIds[stage] ?? [];
  return ids.map((id) => roundCards.find((c) => c.id === id)!).filter(Boolean);
}

export function getAllRoundCards(): ActionSpace[] {
  return roundCards;
}
