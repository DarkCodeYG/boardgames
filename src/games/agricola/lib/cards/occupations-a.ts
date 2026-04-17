/**
 * A덱 직업 카드 24장
 * Phase 2: 효과 description + 단순 IMMEDIATE 구현. 복잡 효과는 stub.
 * 출처: Agricola Unofficial Compendium v4.1 / Agricola General Compendium v11.2
 */

import type { Card, GameState, PlayerId } from '../types.js';
import { addResources } from '../game-engine.js';

export function getOccupationsA(): Card[] {
  return [
    {
      id: 'A086', deck: 'A', type: 'occupation',
      nameKo: '가축 조련사', nameEn: 'Animal Tamer',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { wood: 1 }),
          description: '즉시 나무 1 또는 곡식 1 중 선택 (현재: 나무 1 지급)',
        },
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '집 안에 동물을 방 1개당 1마리씩 보관 가능 (기본 1마리 → 방 수만큼)',
        },
      ],
    },
    {
      id: 'A087', deck: 'A', type: 'occupation',
      nameKo: '재산 관리인', nameEn: 'Conservator',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '나무집 → 집 개조 시 흙집 단계 없이 바로 돌집으로 개조 가능',
        },
      ],
    },
    {
      id: 'A088', deck: 'A', type: 'occupation',
      nameKo: '산울타리지기', nameEn: 'Hedge Keeper',
      effects: [
        {
          trigger: 'BUILD_FENCE',
          apply: (s: GameState) => s,
          description: '울타리 건설 시 최대 3개까지 나무 비용 면제 (나무 0개로 울타리 1~3개 건설 가능)',
        },
      ],
    },
    {
      id: 'A090', deck: 'A', type: 'occupation',
      nameKo: '쟁기 몰이꾼', nameEn: 'Plow Driver',
      effects: [
        {
          trigger: 'ROUND_START',
          apply: (s: GameState) => s,
          description: '돌집 거주 시 매 라운드 시작에 음식 1개를 내고 밭 1개를 갈 수 있음',
        },
      ],
    },
    {
      id: 'A092', deck: 'A', type: 'occupation',
      nameKo: '양부모', nameEn: 'Adoptive Parents',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '음식 1개를 내면, 가족이 늘어난 같은 라운드에 새 구성원으로 일꾼 배치 가능',
        },
      ],
    },
    {
      id: 'A098', deck: 'A', type: 'occupation',
      nameKo: '외양간 건축가', nameEn: 'Stable Architect',
      effects: [
        {
          trigger: 'GAME_END',
          apply: (state: GameState, playerId: PlayerId) => {
            // 울타리 없는 외양간 수만큼 보너스 VP
            const player = state.players[playerId];
            if (!player) return state;
            const fencedStables = player.farm.pastures.filter(p => p.hasStable).length;
            const totalStables = player.farm.stables.length;
            const unfencedStables = totalStables - fencedStables;
            return addResources(state, playerId, { food: 0 }); // VP는 scoring-engine에서 처리
            void unfencedStables;
          },
          description: '게임 종료 시 울타리 없는 외양간 1개당 보너스 1점',
        },
      ],
    },
    {
      id: 'A102', deck: 'A', type: 'occupation',
      nameKo: '잡화상인', nameEn: 'Grocer',
      effects: [
        {
          trigger: 'ANYTIME',
          apply: (s: GameState) => s,
          description: '카드 위 자원 더미 (나무→곡식→갈대→돌→채소→흙→갈대→채소 순)에서 맨 위 1개를 음식 1로 구매 가능',
        },
      ],
    },
    {
      id: 'A108', deck: 'A', type: 'occupation',
      nameKo: '버섯 따는 사람', nameEn: 'Mushroom Collector',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '나무 축적 공간 사용 직후, 음식 2개를 내고 나무를 다시 공간에 되돌릴 수 있음',
        },
      ],
    },
    {
      id: 'A110', deck: 'A', type: 'occupation',
      nameKo: '초벽질공', nameEn: 'Roughcaster',
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '흙방 1개 이상 건설하거나 흙집→돌집 개조 시, 음식 3개 획득',
        },
      ],
    },
    {
      id: 'A111', deck: 'A', type: 'occupation',
      nameKo: '벽 건축가', nameEn: 'Wall Builder',
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '방 건설 시, 다음 4개 라운드 공간에 음식 1씩 배치. 해당 라운드 시작에 획득.',
        },
      ],
    },
    {
      id: 'A112', deck: 'A', type: 'occupation',
      nameKo: '큰낫 일꾼', nameEn: 'Scythe Worker',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { grain: 1 }),
          description: '즉시 곡식 1개 획득',
        },
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '수확 시 곡식밭마다 곡식 1개 추가 수확',
        },
      ],
    },
    {
      id: 'A114', deck: 'A', type: 'occupation',
      nameKo: '농번기 일꾼', nameEn: 'Seasonal Worker',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '날품팔이 공간 사용 시 곡식 1개 추가. 6라운드부터는 채소 1개로 대체 선택 가능.',
        },
      ],
    },
    {
      id: 'A116', deck: 'A', type: 'occupation',
      nameKo: '나무꾼', nameEn: 'Wood Cutter',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '나무 축적 공간 사용 시 나무 1개 추가 획득',
        },
      ],
    },
    {
      id: 'A119', deck: 'A', type: 'occupation',
      nameKo: '장작 채집자', nameEn: 'Firewood Collector',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '경작지/곡물 종자/곡식 활용/밭 농사 공간 사용 시 해당 턴 종료 후 나무 1개 획득',
        },
      ],
    },
    {
      id: 'A120', deck: 'A', type: 'occupation',
      nameKo: '흙집 건축업자', nameEn: 'Clay Hut Builder',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '더 이상 나무집이 아닐 때, 2개 라운드 공간에 흙 1씩 배치. 해당 라운드 시작에 획득.',
        },
      ],
    },
    {
      id: 'A123', deck: 'A', type: 'occupation',
      nameKo: '골조 건축업자', nameEn: 'Frame Builder',
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '방 건설·개조 시 방 1개당 흙 2개 또는 돌 2개를 나무 1개로 대체 가능 (1회)',
        },
        {
          trigger: 'RENOVATE',
          apply: (s: GameState) => s,
          description: '집 개조 시 흙 2개 또는 돌 2개를 나무 1개로 대체 가능',
        },
      ],
    },
    {
      id: 'A125', deck: 'A', type: 'occupation',
      nameKo: '사제', nameEn: 'Priest',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => {
            const player = state.players[playerId];
            if (!player) return state;
            // 흙방 정확히 2개일 때만 발동
            const clayRooms = player.farm.grid.flat().filter(c => c === 'room_clay').length;
            if (clayRooms === 2) {
              return addResources(state, playerId, { clay: 3, reed: 2, stone: 2 });
            }
            return state;
          },
          description: '즉시: 흙집 방 정확히 2개인 경우 → 흙 3 + 갈대 2 + 돌 2 획득',
        },
      ],
    },
    {
      id: 'A133', deck: 'A', type: 'occupation',
      nameKo: '허풍선이', nameEn: 'Braggart',
      effects: [
        {
          trigger: 'GAME_END',
          apply: (s: GameState) => s,
          description: '게임 종료 시 보너스 VP: 개선 카드 5/6/7/8/9/10장 이상 → 2/3/4/5/7/9점',
        },
      ],
    },
    {
      id: 'A138', deck: 'A', type: 'occupation',
      nameKo: '작살꾼', nameEn: 'Harpooner',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '낚시 공간 사용 시, 나무 1을 내고 가족 수만큼 음식 + 갈대 1 추가 획득 가능',
        },
      ],
    },
    {
      id: 'A143', deck: 'A', type: 'occupation',
      nameKo: '돌 자르는 사람', nameEn: 'Stonecutter',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '모든 개선·방 건설·집 개조 시 돌 비용 1개 감소',
        },
      ],
    },
    {
      id: 'A147', deck: 'A', type: 'occupation',
      nameKo: '가축 상인', nameEn: 'Animal Dealer',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '양/돼지/소 시장 사용 시, 음식 1개를 내고 해당 종 동물 1마리 추가 획득 가능',
        },
      ],
    },
    {
      id: 'A155', deck: 'A', type: 'occupation',
      nameKo: '마술사', nameEn: 'Conjurer',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '유랑극단 공간 사용 시 나무 1 + 곡식 1 추가 획득',
        },
      ],
    },
    {
      id: 'A160', deck: 'A', type: 'occupation',
      nameKo: '류트 연주자', nameEn: 'Lutenist',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '다른 플레이어가 유랑극단 사용 시 → 음식 1 + 나무 1 획득. 이후 채소 1을 음식 2에 구매 가능.',
        },
      ],
    },
    {
      id: 'A165', deck: 'A', type: 'occupation',
      nameKo: '돼지 사육사', nameEn: 'Pig Breeder',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (state: GameState, playerId: PlayerId) => addResources(state, playerId, { boar: 1 }),
          description: '즉시 멧돼지 1마리 획득',
        },
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '12라운드 종료 시 멧돼지 번식 1회 추가 (공간 있을 때)',
        },
      ],
    },
  ];
}
