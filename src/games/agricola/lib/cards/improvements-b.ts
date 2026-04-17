/**
 * B덱 소시설 카드 24장
 * Phase 2: 효과 description + 단순 IMMEDIATE 구현. 복잡 효과는 stub.
 * 출처: Agricola Unofficial Compendium v4.1 / BGG / 나무위키
 */

import type { Card, GameState, PlayerId } from '../types.js';
import { addResources } from '../game-engine.js';

export function getImprovementsB(): Card[] {
  return [
    {
      id: 'B002', deck: 'B', type: 'minor_improvement',
      nameKo: '미니 목장', nameEn: 'Mini Pasture',
      cost: { food: 2 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 나무 비용 없이 빈 칸 1개에 울타리. 2장 동시 플레이 시 양 4마리 획득.',
        },
      ],
    },
    {
      id: 'B008', deck: 'B', type: 'minor_improvement',
      nameKo: '시장 가판', nameEn: 'Market Stall',
      cost: { grain: 1 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { vegetable: 1 }),
          description: '즉시 채소 1개 획득 (실질: 곡식 1 → 채소 1 교환)',
        },
      ],
    },
    {
      id: 'B010', deck: 'B', type: 'minor_improvement',
      nameKo: '캐러밴', nameEn: 'Caravan',
      cost: { wood: 3, food: 3 },
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '가족 구성원 1명 추가 거주 공간 제공 (방으로 계산 안 됨)',
        },
      ],
    },
    {
      id: 'B013', deck: 'B', type: 'minor_improvement',
      nameKo: '목수의 응접실', nameEn: "Carpenter's Parlor",
      cost: { wood: 1, stone: 1 },
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '나무방 건설 시 방 1개당 비용: 나무 2 + 갈대 2 (일반 나무5+갈대2 → 절감)',
        },
      ],
    },
    {
      id: 'B016', deck: 'B', type: 'minor_improvement',
      nameKo: '채광 망치', nameEn: 'Mining Hammer',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정 — 돌/흙 관련)',
        },
      ],
    },
    {
      id: 'B019', deck: 'B', type: 'minor_improvement',
      nameKo: '몰드보드 쟁기', nameEn: 'Moldboard Plow',
      cost: { wood: 2 }, prerequisites: '직업 카드 1장 이상',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '카드 위 밭 타일 2장. 경작지 액션 사용 시 이 카드에서 밭 1개 추가 갈기 (2회 한정)',
        },
      ],
    },
    {
      id: 'B024', deck: 'B', type: 'minor_improvement',
      nameKo: '올가미', nameEn: 'Lasso',
      cost: { reed: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '양/돼지/소 시장 사용 시, 가족 구성원 2명을 연달아 배치 가능',
        },
      ],
    },
    {
      id: 'B025', deck: 'B', type: 'minor_improvement',
      nameKo: '빵 주걱', nameEn: 'Bread Paddle',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { food: 1 }),
          description: '즉시 음식 1 획득. 이후 직업 카드 플레이 시마다 빵 굽기 1회 추가.',
        },
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '직업 카드 플레이 시 빵 굽기 1회 추가 가능',
        },
      ],
    },
    {
      id: 'B033', deck: 'B', type: 'minor_improvement',
      nameKo: '벽난로 선반', nameEn: 'Mantlepiece',
      cost: { stone: 1 }, prerequisites: '점토 또는 돌집',
      victoryPoints: -3,
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 남은 라운드 수만큼 보너스 점수. 이후 집 개조 불가.',
        },
      ],
    },
    {
      id: 'B036', deck: 'B', type: 'minor_improvement',
      nameKo: '병', nameEn: 'Bottles',
      victoryPoints: 4,
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '비용: 가족 수 × (흙 1 + 음식 1). 4승점 획득.',
        },
      ],
    },
    {
      id: 'B039', deck: 'B', type: 'minor_improvement',
      nameKo: '베틀', nameEn: 'Loom',
      cost: { wood: 2 }, prerequisites: '직업 카드 2장 이상',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '수확 밭 단계: 양 1/4/7마리 이상 → 음식 1/2/3 획득. 게임 종료 시 양 3마리당 보너스 1점.',
        },
        {
          trigger: 'GAME_END',
          apply: (s: GameState) => s,
          description: '게임 종료 시 양 3마리당 보너스 1점',
        },
      ],
    },
    {
      id: 'B045', deck: 'B', type: 'minor_improvement',
      nameKo: '딸기 밭', nameEn: 'Strawberry Patch',
      cost: { wood: 1 }, prerequisites: '채소밭 2개 이상',
      victoryPoints: 2,
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 다음 3개 라운드 공간에 음식 1씩 배치. 해당 라운드 시작 시 획득.',
        },
      ],
    },
    {
      id: 'B047', deck: 'B', type: 'minor_improvement',
      nameKo: '청어 냄비', nameEn: 'Herring Pot',
      cost: { clay: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { food: 1 }),
          description: '낚시 공간 사용 시 음식 1 추가. 수확 시 채소 수확마다 음식 1 추가.',
        },
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '수확 밭 단계: 채소 수확마다 음식 1 추가 획득',
        },
      ],
    },
    {
      id: 'B050', deck: 'B', type: 'minor_improvement',
      nameKo: '버터 교반기', nameEn: 'Butter Churn',
      cost: { wood: 1 }, prerequisites: '직업 카드 3장 이하',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '수확 밭 단계: 양 3마리당 음식 1, 소 2마리당 음식 1 획득',
        },
      ],
    },
    {
      id: 'B056', deck: 'B', type: 'minor_improvement',
      nameKo: '시냇물', nameEn: 'Brook',
      prerequisites: '낚시 공간에 본인 일꾼',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '낚시 위 4개 행동 중 하나 사용 시 음식 1 추가 (내 일꾼이 낚시에 있을 때)',
        },
      ],
    },
    {
      id: 'B057', deck: 'B', type: 'minor_improvement',
      nameKo: '작은 부엌', nameEn: 'Scullery',
      cost: { wood: 1, clay: 1 },
      effects: [
        {
          trigger: 'ROUND_START',
          apply: (s: GameState) => s,
          description: '나무집 거주 시 매 라운드 시작에 음식 1 획득',
        },
      ],
    },
    {
      id: 'B061', deck: 'B', type: 'minor_improvement',
      nameKo: '삼포식 농업', nameEn: 'Three-Field Rotation',
      prerequisites: '직업 카드 3장 이상',
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '수확 밭 단계 시작 시: 곡식밭 1+채소밭 1+빈밭 1 이상 보유 시 음식 3 획득',
        },
      ],
    },
    {
      id: 'B062', deck: 'B', type: 'minor_improvement',
      nameKo: '쇠스랑', nameEn: 'Pitchfork',
      cost: { wood: 1 },
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '곡물 종자 공간 사용 시, 경작지 공간이 점유된 경우 음식 3 추가 획득',
        },
      ],
    },
    {
      id: 'B066', deck: 'B', type: 'minor_improvement',
      nameKo: '마대 수레', nameEn: 'Sack Cart',
      cost: { wood: 2 }, prerequisites: '직업 카드 2장 이상',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B068', deck: 'B', type: 'minor_improvement',
      nameKo: '콩밭', nameEn: 'Beanfield',
      cost: { food: 1 }, prerequisites: '직업 카드 2장 이상',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '채소만 심을 수 있는 밭. 채소밭 전제조건과 점수에 포함.',
        },
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '수확 시 채소 수확 (일반 밭과 동일)',
        },
      ],
    },
    {
      id: 'B074', deck: 'B', type: 'minor_improvement',
      nameKo: '울창한 숲', nameEn: 'Thick Forest',
      prerequisites: '점토 5개 이상 보유',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정 — 나무 자원 관련)',
        },
      ],
    },
    {
      id: 'B077', deck: 'B', type: 'minor_improvement',
      nameKo: '황토 웅덩이', nameEn: 'Loam Pit',
      cost: { food: 1 }, prerequisites: '직업 카드 3장 이상',
      victoryPoints: 1,
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정 — 흙/날품팔이 관련)',
        },
      ],
    },
    {
      id: 'B080', deck: 'B', type: 'minor_improvement',
      nameKo: '경질 자기', nameEn: 'Hard Porcelain',
      cost: { clay: 1 },
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B084', deck: 'B', type: 'minor_improvement',
      nameKo: '도토리 바구니', nameEn: 'Acorns Basket',
      cost: { reed: 1 }, prerequisites: '직업 카드 3장 이상',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 다음 라운드 2개 공간에 야생 돼지 1마리씩. 1~2칸 목장에도 작물 심기 가능.',
        },
      ],
    },
  ];
}
