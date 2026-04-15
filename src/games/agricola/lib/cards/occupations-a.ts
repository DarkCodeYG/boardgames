/**
 * A덱 직업 카드 24장
 * Phase 2 구현 대상 — 현재는 이름/메타만, effects 빈 배열
 * 출처: docs/agricola/02-card-database.md (Unofficial Compendium v4.1 기준)
 */

import type { Card } from '../types.js';

export function getOccupationsA(): Card[] {
  return [
    // 한국어명 출처: 나무위키 아그리콜라(보드게임)/개정판 + 코리아보드게임즈 한국어판
    { id: 'A086', deck: 'A', type: 'occupation', nameKo: '가축 조련사', nameEn: 'Animal Tamer', effects: [] },
    { id: 'A087', deck: 'A', type: 'occupation', nameKo: '재산 관리인', nameEn: 'Conservator', effects: [] },
    { id: 'A088', deck: 'A', type: 'occupation', nameKo: '산울타리지기', nameEn: 'Hedge Keeper', effects: [] },
    { id: 'A090', deck: 'A', type: 'occupation', nameKo: '쟁기 몰이꾼', nameEn: 'Plow Driver', effects: [] },
    { id: 'A092', deck: 'A', type: 'occupation', nameKo: '양부모', nameEn: 'Adoptive Parents', effects: [] },
    { id: 'A098', deck: 'A', type: 'occupation', nameKo: '외양간 건축가', nameEn: 'Stable Architect', effects: [] },
    { id: 'A102', deck: 'A', type: 'occupation', nameKo: '잡화상인', nameEn: 'Grocer', effects: [] },
    { id: 'A108', deck: 'A', type: 'occupation', nameKo: '버섯 따는 사람', nameEn: 'Mushroom Collector', effects: [] },
    { id: 'A110', deck: 'A', type: 'occupation', nameKo: '초벽질공', nameEn: 'Roughcaster', effects: [] },
    { id: 'A111', deck: 'A', type: 'occupation', nameKo: '벽 건축가', nameEn: 'Wall Builder', effects: [] },
    { id: 'A112', deck: 'A', type: 'occupation', nameKo: '큰낫 일꾼', nameEn: 'Scythe Worker', effects: [] },
    { id: 'A114', deck: 'A', type: 'occupation', nameKo: '농번기 일꾼', nameEn: 'Seasonal Worker', effects: [] },
    { id: 'A116', deck: 'A', type: 'occupation', nameKo: '나무꾼', nameEn: 'Wood Cutter', effects: [] },
    { id: 'A119', deck: 'A', type: 'occupation', nameKo: '장작 채집자', nameEn: 'Firewood Collector', effects: [] },
    { id: 'A120', deck: 'A', type: 'occupation', nameKo: '흙집 건축업자', nameEn: 'Clay Hut Builder', effects: [] },
    { id: 'A123', deck: 'A', type: 'occupation', nameKo: '골조 건축업자', nameEn: 'Frame Builder', effects: [] },
    { id: 'A125', deck: 'A', type: 'occupation', nameKo: '사제', nameEn: 'Priest', effects: [] },
    { id: 'A133', deck: 'A', type: 'occupation', nameKo: '허풍선이', nameEn: 'Braggart', effects: [] },
    { id: 'A138', deck: 'A', type: 'occupation', nameKo: '작살꾼', nameEn: 'Harpooner', effects: [] },
    { id: 'A143', deck: 'A', type: 'occupation', nameKo: '돌 자르는 사람', nameEn: 'Stonecutter', effects: [] },
    { id: 'A147', deck: 'A', type: 'occupation', nameKo: '가축 상인', nameEn: 'Animal Dealer', effects: [] },
    { id: 'A155', deck: 'A', type: 'occupation', nameKo: '마술사', nameEn: 'Conjurer', effects: [] },
    { id: 'A160', deck: 'A', type: 'occupation', nameKo: '류트 연주자', nameEn: 'Lutenist', effects: [] },
    { id: 'A165', deck: 'A', type: 'occupation', nameKo: '돼지 사육사', nameEn: 'Pig Breeder', effects: [] },
  ];
}
