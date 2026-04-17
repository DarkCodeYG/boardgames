/**
 * B덱 직업 카드 (23장 확인 + B096 미확인)
 * Phase 2: 효과 description + 단순 IMMEDIATE 구현. 복잡 효과는 stub.
 * 출처: Agricola Unofficial Compendium v4.1 / BGG / 보드라이프
 */

import type { Card, GameState } from '../types.js';

export function getOccupationsB(): Card[] {
  return [
    {
      id: 'B087', deck: 'B', type: 'occupation',
      nameKo: '오두막집 살이', nameEn: 'Cottager',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '날품팔이 액션 사용 시, 비용을 내고 방 건설 또는 집 개조 1회 추가 가능',
        },
      ],
    },
    {
      id: 'B089', deck: 'B', type: 'occupation',
      nameKo: '마부', nameEn: 'Groom',
      effects: [
        {
          trigger: 'GET_RESOURCE',
          apply: (s: GameState) => s,
          description: '다른 카드 효과로 나무를 받을 때, 즉시 나무 2개로 외양간 1개 건설 가능',
        },
      ],
    },
    {
      id: 'B091', deck: 'B', type: 'occupation',
      nameKo: '보조 경작자', nameEn: 'Assistant Tiller',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B095', deck: 'B', type: 'occupation',
      nameKo: '숙련 벽돌공', nameEn: 'Master Bricklayer',
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B097', deck: 'B', type: 'occupation',
      nameKo: '학자', nameEn: 'Scholar',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B098', deck: 'B', type: 'occupation',
      nameKo: '유기 농부', nameEn: 'Organic Farmer',
      effects: [
        {
          trigger: 'HARVEST_FIELD',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B099', deck: 'B', type: 'occupation',
      nameKo: '가정교사', nameEn: 'Tutor',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B102', deck: 'B', type: 'occupation',
      nameKo: '상담가', nameEn: 'Consultant',
      effects: [
        {
          trigger: 'IMMEDIATE',
          apply: (s: GameState) => s,
          description: '즉시: 플레이어 수에 따른 자원 선택 지급 (구현 예정)',
        },
      ],
    },
    {
      id: 'B104', deck: 'B', type: 'occupation',
      nameKo: '양치기', nameEn: 'Sheep Walker',
      effects: [
        {
          trigger: 'ANYTIME',
          apply: (s: GameState) => s,
          description: '언제든지: 농장의 양 1마리 → 야생 돼지 1/채소 1/돌 1 중 선택 교환',
        },
      ],
    },
    {
      id: 'B107', deck: 'B', type: 'occupation',
      nameKo: '하인', nameEn: 'Manservant',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B108', deck: 'B', type: 'occupation',
      nameKo: '화덕 점화 소년', nameEn: 'Oven Firing Boy',
      effects: [
        {
          trigger: 'BAKE_BREAD',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B109', deck: 'B', type: 'occupation',
      nameKo: '제지업자', nameEn: 'Paper Maker',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B114', deck: 'B', type: 'occupation',
      nameKo: '자녀 없는 이', nameEn: 'Childless',
      effects: [
        {
          trigger: 'ROUND_START',
          apply: (s: GameState) => s,
          description: '방 3개 이상 + 가족 2명뿐인 라운드 시작 시 → 음식 1 + 작물(곡식 또는 채소) 1 획득',
        },
      ],
    },
    {
      id: 'B118', deck: 'B', type: 'occupation',
      nameKo: '소농', nameEn: 'Small-scale Farmer',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B121', deck: 'B', type: 'occupation',
      nameKo: '지질학자', nameEn: 'Geologist',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B123', deck: 'B', type: 'occupation',
      nameKo: '지붕 안정공', nameEn: 'Roof Ballaster',
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B136', deck: 'B', type: 'occupation',
      nameKo: '집사', nameEn: 'House Steward',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B142', deck: 'B', type: 'occupation',
      nameKo: '채소 가게 주인', nameEn: 'Greengrocer',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B145', deck: 'B', type: 'occupation',
      nameKo: '잡목 수집가', nameEn: 'Brushwood Collector',
      effects: [
        {
          trigger: 'BUILD_ROOM',
          apply: (s: GameState) => s,
          description: '집 개조·증축 시 필요한 갈대를 나무 1개로 대체 가능',
        },
        {
          trigger: 'RENOVATE',
          apply: (s: GameState) => s,
          description: '집 개조 시 필요한 갈대를 나무 1개로 대체 가능',
        },
      ],
    },
    {
      id: 'B156', deck: 'B', type: 'occupation',
      nameKo: '창고지기', nameEn: 'Storehouse Keeper',
      effects: [
        {
          trigger: 'PLACE_WORKER',
          apply: (s: GameState) => s,
          description: '갈대·돌 획득 액션 사용 시, 흙 1 또는 곡식 1 중 하나 추가 획득 가능',
        },
      ],
    },
    {
      id: 'B163', deck: 'B', type: 'occupation',
      nameKo: '목사', nameEn: 'Pastor',
      effects: [
        {
          trigger: 'ROUND_START',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B164', deck: 'B', type: 'occupation',
      nameKo: '양 속삭이는 자', nameEn: 'Sheep Whisperer',
      effects: [
        {
          trigger: 'PASSIVE',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    {
      id: 'B166', deck: 'B', type: 'occupation',
      nameKo: '소 먹이는 사람', nameEn: 'Cattle Feeder',
      effects: [
        {
          trigger: 'HARVEST_FEED',
          apply: (s: GameState) => s,
          description: '(효과 구현 예정)',
        },
      ],
    },
    // B096 Tree Farm Joiner — 물리 카드 확인 필요
  ];
}
