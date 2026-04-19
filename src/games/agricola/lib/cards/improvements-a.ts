/**
 * A덱 소시설 카드 24장
 * Phase 2: 효과 description + 단순 IMMEDIATE 구현. 복잡 효과는 stub.
 * 출처: Agricola Unofficial Compendium v4.1 / Agricola General Compendium v11.2
 */

import type { Card, GameState, PlayerId } from '../types.js';
import { addResources } from '../game-engine.js';

export function getImprovementsA(): Card[] {
  return [
    {
      id: 'A002', deck: 'A', type: 'minor_improvement',
      nameKo: '이동 경작', nameEn: 'Shifting Cultivation',
      cost: { food: 2 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s, // TODO: plowField 연동 (밭 위치 선택 필요)
          description: '즉시 밭 1개 갈기 (빈 셀 클릭 필요)',
        },
      ],
    },
    {
      id: 'A005', deck: 'A', type: 'minor_improvement',
      nameKo: '점토 제방', nameEn: 'Clay Embankment',
      cost: { food: 1 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => {
            const player = state.players[playerId];
            if (!player) return state;
            const bonus = Math.floor((player.resources.clay ?? 0) / 2);
            return addResources(state, playerId, { clay: bonus });
          },
          description: '즉시: 보유 흙 2개당 흙 1개 획득',
        },
      ],
    },
    {
      id: 'A009', deck: 'A', type: 'minor_improvement',
      nameKo: '어린 동물 시장', nameEn: 'Young Animal Market',
      cost: { sheep: 1 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { cattle: 1 }),
          description: '즉시 소 1마리 획득 (양 1 → 소 1 교환)',
        },
      ],
    },
    {
      id: 'A012', deck: 'A', type: 'minor_improvement',
      nameKo: '구유', nameEn: 'Drinking Trough',
      cost: { clay: 1 },
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '내 목장(외양간 유무 무관) 각각 동물 2마리 추가 수용 가능',
        },
      ],
    },
    {
      id: 'A016', deck: 'A', type: 'minor_improvement',
      nameKo: '다진 점토', nameEn: 'Rammed Clay',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { clay: 1 }),
          description: '즉시 흙 1개 획득',
        },
        {
          trigger: 'BUILD_FENCE',
          apply: (s: GameState) => s,
          description: '울타리 건설 시 나무 대신 흙 사용 가능 (같은 액션에서 혼용 가능)',
        },
      ],
    },
    {
      id: 'A019', deck: 'A', type: 'minor_improvement',
      nameKo: '손쟁기', nameEn: 'Handplow',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 현재 라운드+5에 해당하는 라운드 공간에 밭 타일 1개 배치. 그 라운드 시작 시 밭 갈기.',
        },
      ],
    },
    {
      id: 'A024', deck: 'A', type: 'minor_improvement',
      nameKo: '타작판', nameEn: 'Threshing Board',
      cost: { wood: 1 }, prerequisites: '직업 카드 2장 이상',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '경작지 또는 밭 농사 공간 사용 시, 빵 굽기 1회 추가 가능',
        },
      ],
    },
    {
      id: 'A026', deck: 'A', type: 'minor_improvement',
      nameKo: '잠자리 구석', nameEn: 'Sleeping Corner',
      cost: { wood: 1 }, prerequisites: '곡식밭 2개 이상',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '가족 늘리기 공간에 다른 플레이어 일꾼이 있어도 사용 가능',
        },
      ],
    },
    {
      id: 'A032', deck: 'A', type: 'minor_improvement',
      nameKo: '여물통', nameEn: 'Manger',
      cost: { wood: 2 },
      effects: [
        {
          trigger: 'GAME_END',
          apply: (s: GameState) => s,
          description: '게임 종료 시 목장 6/7/8/10칸 이상 → 보너스 1/2/3/4점',
        },
      ],
    },
    {
      id: 'A033', deck: 'A', type: 'minor_improvement',
      nameKo: '광활한 땅', nameEn: 'Big Country',
      prerequisites: '농장 모든 칸 사용',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => {
            const remaining = Math.max(0, 14 - (state.round - 1));
            return addResources(state, playerId, { food: remaining * 2 });
          },
          description: '즉시: 남은 라운드 수당 보너스 1점 + 음식 2개',
        },
      ],
    },
    {
      id: 'A038', deck: 'A', type: 'minor_improvement',
      nameKo: '양털 담요', nameEn: 'Wool Blankets',
      prerequisites: '양 5마리 이상',
      effects: [
        {
          trigger: 'GAME_END',
          apply: (s: GameState) => s,
          description: '게임 종료 시: 나무집 3점 / 흙집 2점 / 돌집 0점 보너스',
        },
      ],
    },
    {
      id: 'A044', deck: 'A', type: 'minor_improvement',
      nameKo: '연못 오두막', nameEn: 'Pond Hut',
      cost: { wood: 1 }, prerequisites: '직업 카드 정확히 2장',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 다음 3개 라운드 공간에 음식 1씩 배치. 해당 라운드 시작 시 획득.',
        },
      ],
    },
    {
      id: 'A050', deck: 'A', type: 'minor_improvement',
      nameKo: '우유 단지', nameEn: 'Milk Jug',
      cost: { clay: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { food: 3 }),
          description: '소 시장 공간 사용 시 (누구든) 나 음식 3 획득, 다른 플레이어 각 음식 1 획득',
        },
      ],
    },
    {
      id: 'A053', deck: 'A', type: 'minor_improvement',
      nameKo: '점토 파이프', nameEn: 'Claypipe',
      cost: { clay: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '가족 말 배치 단계에서 건설 자원 7개 이상 획득 시 → 귀환 단계에 음식 2개',
        },
      ],
    },
    {
      id: 'A055', deck: 'A', type: 'minor_improvement',
      nameKo: '잡동사니방', nameEn: 'Junk Room',
      cost: { wood: 1, clay: 1 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { food: 1 }),
          description: '이 카드 포함, 개선 카드 건설 시마다 음식 1개 획득',
        },
      ],
    },
    {
      id: 'A056', deck: 'A', type: 'minor_improvement',
      nameKo: '바구니', nameEn: 'Basket',
      cost: { reed: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '나무 축적 공간 사용 직후, 나무 2개를 음식 3개로 교환 가능 (나무는 공간에 반납)',
        },
      ],
    },
    {
      id: 'A063', deck: 'A', type: 'minor_improvement',
      nameKo: '네덜란드 풍차', nameEn: 'Dutch Windmill',
      cost: { wood: 2, stone: 2 },
      victoryPoints: 2,
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: (s: GameState) => s,
          description: '수확 직후 라운드에 빵 굽기 시 음식 3개 추가 획득',
        },
      ],
    },
    {
      id: 'A067', deck: 'A', type: 'minor_improvement',
      nameKo: '곡물 스쿠프', nameEn: 'Corn Scoop',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '곡식 종자 공간 사용 시 곡식 1개 추가 획득',
        },
      ],
    },
    {
      id: 'A069', deck: 'A', type: 'minor_improvement',
      nameKo: '대형 온실', nameEn: 'Large Greenhouse',
      cost: { wood: 2 }, prerequisites: '직업 카드 2장 이상',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '현재 라운드+4, +7, +9 위치 라운드 공간에 채소 1씩. 해당 라운드 시작 시 획득.',
        },
      ],
    },
    {
      id: 'A071', deck: 'A', type: 'minor_improvement',
      nameKo: '개간 삽', nameEn: 'Clearing Spade',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'ANYTIME',
          apply: (s: GameState) => s,
          description: '언제든지: 씨앗 2개 이상인 밭에서 씨앗 1개를 빈 밭으로 이동 가능',
        },
      ],
    },
    {
      id: 'A075', deck: 'A', type: 'minor_improvement',
      nameKo: '제재소', nameEn: 'Lumber Mill',
      cost: { stone: 2 }, prerequisites: '직업 카드 3장 이하',
      victoryPoints: 2,
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '모든 개선 카드 건설 비용에서 나무 1개 감소',
        },
      ],
    },
    {
      id: 'A078', deck: 'A', type: 'minor_improvement',
      nameKo: '카누', nameEn: 'Canoe',
      cost: { wood: 2 }, prerequisites: '직업 카드 1장 이상',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { food: 1, reed: 1 }),
          description: '낚시 공간 사용 시 음식 1 + 갈대 1 추가 획득',
        },
      ],
    },
    {
      id: 'A080', deck: 'A', type: 'minor_improvement',
      nameKo: '돌 집게', nameEn: 'Stone Tongs',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '돌 축적 공간 사용 시 돌 1개 추가 획득',
        },
      ],
    },
    {
      id: 'A083', deck: 'A', type: 'minor_improvement',
      nameKo: '목동 지팡이', nameEn: "Shepherd's Crook",
      cost: { wood: 1 }, prerequisites: '직업 카드 3장 이상',
      effects: [
        {
          trigger: 'BUILD_FENCE',
          apply: (s: GameState) => s,
          description: '4칸 이상 목장 신설 시, 즉시 그 목장에 양 2마리 획득 (2개 신설 시 4마리)',
        },
      ],
    },
  ];
}
