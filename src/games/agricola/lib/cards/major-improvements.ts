/**
 * 대시설 (Major Improvements) 10개 — 공용 보드에 배치
 * Phase 1 구현 대상 (기본 효과만, 카드 연동은 Phase 2)
 */

import type { MajorImprovement, GameState, PlayerId } from '../types.js';
import { addResources } from '../game-engine.js';

// 취사 설비(화덕/취사장): 밀 → 음식 변환
function bakingEffect(
  wheatToFood: number,
): (state: GameState, playerId: PlayerId) => GameState {
  return (state, playerId) =>
    // Phase 1 TODO: 빵 굽기 UI와 연동 (밀 몇 개를 구울지 선택)
    addResources(state, playerId, { food: wheatToFood });
}

export function getMajorImprovements(): MajorImprovement[] {
  return [
    {
      id: 'MAJ_FIREPLACE_2',
      nameKo: '화덕 (점토 2)',
      nameEn: 'Fireplace (2 clay)',
      cost: { clay: 2 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(2), // 밀 1 → 음식 2
          description: '밀 1개를 음식 2개로 변환',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_FIREPLACE_3',
      nameKo: '화덕 (점토 3)',
      nameEn: 'Fireplace (3 clay)',
      cost: { clay: 3 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(2),
          description: '밀 1개를 음식 2개로 변환',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_COOKING_HEARTH_4',
      nameKo: '취사장 (점토 4)',
      nameEn: 'Cooking Hearth (4 clay)',
      cost: { clay: 4 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(3), // 밀 1 → 음식 3
          description: '밀 1개를 음식 3개로 변환',
        },
        {
          trigger: 'ANYTIME',
          apply: (state: GameState, _playerId: PlayerId) =>
            // Phase 1 TODO: 동물 → 음식 변환
            state,
          description: '언제든지 동물을 음식으로 변환 가능',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_COOKING_HEARTH_5',
      nameKo: '취사장 (점토 5)',
      nameEn: 'Cooking Hearth (5 clay)',
      cost: { clay: 5 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(3),
          description: '밀 1개를 음식 3개로 변환',
        },
        {
          trigger: 'ANYTIME',
          apply: (state: GameState, _playerId: PlayerId) => state,
          description: '언제든지 동물을 음식으로 변환 가능',
        },
      ],
      victoryPoints: 1,
      ownerId: null,
    },
    {
      id: 'MAJ_WELL',
      nameKo: '우물',
      nameEn: 'Well',
      cost: { reed: 1, stone: 3 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => {
            // 건설 라운드부터 5라운드 후까지 매 라운드 시작 시 음식 1개
            // Phase 1 TODO: 미래 라운드 공간에 음식 배치 로직
            return addResources(state, playerId, { food: 0 }); // placeholder
          },
          description: '이후 5개 라운드 공간에 음식 1씩 배치',
        },
      ],
      victoryPoints: 4,
      ownerId: null,
    },
    {
      id: 'MAJ_CLAY_OVEN',
      nameKo: '점토 오븐',
      nameEn: 'Clay Oven',
      cost: { clay: 3, stone: 1 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(5), // 밀 1 → 음식 5
          description: '밀 1개를 음식 5개로 변환 (1회)',
        },
      ],
      victoryPoints: 2,
      ownerId: null,
    },
    {
      id: 'MAJ_STONE_OVEN',
      nameKo: '돌 오븐',
      nameEn: 'Stone Oven',
      cost: { clay: 1, stone: 3 },
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: bakingEffect(4), // 밀 1 → 음식 4 (2회)
          description: '밀 1개를 음식 4개로 변환 (2회)',
        },
      ],
      victoryPoints: 3,
      ownerId: null,
    },
    {
      id: 'MAJ_JOINERY',
      nameKo: '목공소',
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
      nameKo: '도예소',
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
      nameKo: '바구니 공방',
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
