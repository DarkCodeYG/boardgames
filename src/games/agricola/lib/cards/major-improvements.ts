/**
 * 주요설비 (Major Improvements) 10개 — 공용 보드에 배치
 * Phase 1 구현 대상 (기본 효과만, 카드 연동은 Phase 2)
 */

import type { MajorImprovement, GameState, PlayerId } from '../types.js';
import { addResources } from '../game-engine.js';

// 취사 설비(화덕/취사장): 곡식 → 음식 변환 (빵 굽기 행동 시 곡식 1개당)
function bakingEffect(
  wheatToFood: number,
): (state: GameState, playerId: PlayerId) => GameState {
  return (state, playerId) =>
    addResources(state, playerId, { food: wheatToFood });
}

/**
 * 취사 설비 ANYTIME 동물→음식 변환 효과
 * 화로/화덕 모두 동일 비율: 양·멧돼지 2식, 소 3식, 채소 2식
 * 실제 호출은 GamePage에서 동물 종류를 선택한 뒤 직접 처리하므로
 * 이 apply는 placeholder — 변환 비율은 ANIMAL_TO_FOOD_RATES에서 참조.
 */
export const ANIMAL_TO_FOOD_RATES: Record<string, number> = {
  sheep: 2,
  boar: 2,
  cattle: 3,
  vegetable: 2,
};

export function getMajorImprovements(): MajorImprovement[] {
  return [
    {
      id: 'MAJ_FIREPLACE_2',
      nameKo: '화로 (흙 2)',
      nameEn: 'Fireplace (2 clay)',
      cost: { clay: 2 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(2), // 밀 1 → 음식 2
          description: '곡식 1개를 음식 2개로 변환',
        },
        {
          trigger: 'ANYTIME',
          apply: (state: GameState, _playerId: PlayerId) => state, // 동물 선택 UI에서 직접 처리
          description: '언제든지: 양·멧돼지→2식, 소→3식, 채소→2식',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_FIREPLACE_3',
      nameKo: '화로 (흙 3)',
      nameEn: 'Fireplace (3 clay)',
      cost: { clay: 3 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(2),
          description: '곡식 1개를 음식 2개로 변환',
        },
        {
          trigger: 'ANYTIME',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '언제든지: 양·멧돼지→2식, 소→3식, 채소→2식',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_COOKING_HEARTH_4',
      nameKo: '화덕 (흙 4)',
      nameEn: 'Cooking Hearth (4 clay)',
      cost: { clay: 4 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(3), // 밀 1 → 음식 3
          description: '곡식 1개를 음식 3개로 변환',
        },
        {
          trigger: 'ANYTIME',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '언제든지: 양·멧돼지→2식, 소→3식, 채소→2식',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_COOKING_HEARTH_5',
      nameKo: '화덕 (흙 5)',
      nameEn: 'Cooking Hearth (5 clay)',
      cost: { clay: 5 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(3),
          description: '곡식 1개를 음식 3개로 변환',
        },
        {
          trigger: 'ANYTIME',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '언제든지: 양·멧돼지→2식, 소→3식, 채소→2식',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_WELL',
      nameKo: '우물',
      nameEn: 'Well',
      cost: { wood: 1, stone: 3 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => {
            // 건설 즉시 음식 1 + 다음 4 라운드 시작 시 음식 1씩 (총 5 음식)
            const player = state.players[playerId];
            if (!player) return state;
            const withFood = addResources(state, playerId, { food: 1 });
            return {
              ...withFood,
              players: {
                ...withFood.players,
                [playerId]: {
                  ...withFood.players[playerId]!,
                  wellFoodRemaining: 4,
                },
              },
            };
          },
          description: '즉시 음식 1 + 다음 4 라운드 시작 시마다 음식 1',
        },
      ],
      victoryPoints: 4,
      ownerId: null,
    },
    {
      id: 'MAJ_CLAY_OVEN',
      nameKo: '흙가마',
      nameEn: 'Clay Oven',
      cost: { clay: 3, stone: 1 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(5), // 밀 1 → 음식 5
          description: '곡식 1개를 음식 5개로 변환 (1회)',
        },
      ],
      victoryPoints: 2,
      ownerId: null,
    },
    {
      id: 'MAJ_STONE_OVEN',
      nameKo: '돌가마',
      nameEn: 'Stone Oven',
      cost: { clay: 1, stone: 3 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(4), // 밀 1 → 음식 4 (2회)
          description: '곡식 1개를 음식 4개로 변환 (2회)',
        },
      ],
      victoryPoints: 3,
      ownerId: null,
    },
    {
      id: 'MAJ_JOINERY',
      nameKo: '가구 제작소',
      nameEn: 'Joinery',
      cost: { wood: 2, stone: 2 },
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '수확 시 나무 자원으로 음식 획득 가능',
        },
      ],
      victoryPoints: 2,
      ownerId: null,
    },
    {
      id: 'MAJ_POTTERY',
      nameKo: '그릇 제작소',
      nameEn: 'Pottery',
      cost: { clay: 2, stone: 2 },
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '수확 시 점토 자원으로 음식 획득 가능',
        },
      ],
      victoryPoints: 2,
      ownerId: null,
    },
    {
      id: 'MAJ_BASKETMAKERS_WORKSHOP',
      nameKo: '바구니 제작소',
      nameEn: "Basketmaker's Workshop",
      cost: { reed: 2, stone: 2 },
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '수확 시 갈대 자원으로 음식 획득 가능',
        },
      ],
      victoryPoints: 2,
      ownerId: null,
    },
  ];
}
