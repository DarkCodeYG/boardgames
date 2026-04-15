/**
 * 카드 DB 진입점
 * Phase 2 구현 대상 (전체 카드 효과 구현)
 * 현재: 카드 목록만 반환 (effects는 빈 배열)
 */

import type { Card } from '../types.js';
import { DECK_A_OCCUPATION_IDS, DECK_B_OCCUPATION_IDS, DECK_A_IMPROVEMENT_IDS, DECK_B_IMPROVEMENT_IDS } from '../constants.js';

/** Phase 2에서 각 파일에서 가져올 카드 데이터 (현재는 stub) */
import { getOccupationsA } from './occupations-a.js';
import { getOccupationsB } from './occupations-b.js';
import { getImprovementsA } from './improvements-a.js';
import { getImprovementsB } from './improvements-b.js';

export interface BaseDeckCards {
  occupations: Card[];
  improvements: Card[];
}

/** 기본판 A+B 덱 전체 카드 반환 */
export function getBaseDeckCards(): BaseDeckCards {
  return {
    occupations: [...getOccupationsA(), ...getOccupationsB()],
    improvements: [...getImprovementsA(), ...getImprovementsB()],
  };
}

/** 카드 ID로 카드 조회 */
export function findCardById(id: string): Card | undefined {
  const { occupations, improvements } = getBaseDeckCards();
  return occupations.find((c) => c.id === id) ?? improvements.find((c) => c.id === id);
}

// 검증용: 모든 ID가 카드 DB에 있는지 확인
export function validateCardDatabase(): { missing: string[] } {
  const all = getBaseDeckCards();
  const allIds = new Set([...all.occupations, ...all.improvements].map((c) => c.id));
  const expectedIds = [
    ...DECK_A_OCCUPATION_IDS,
    ...DECK_B_OCCUPATION_IDS,
    ...DECK_A_IMPROVEMENT_IDS,
    ...DECK_B_IMPROVEMENT_IDS,
  ];
  return { missing: expectedIds.filter((id) => !allIds.has(id)) };
}
