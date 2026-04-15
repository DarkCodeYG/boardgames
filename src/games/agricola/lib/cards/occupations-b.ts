/**
 * B덱 직업 카드 (23장 확인 + B096 미확인)
 * Phase 2 구현 대상 — 현재는 이름/메타만
 */

import type { Card } from '../types.js';

export function getOccupationsB(): Card[] {
  return [
    // 한국어명 출처: 나무위키 아그리콜라(보드게임)/개정판 + 코리아보드게임즈 한국어판
    { id: 'B087', deck: 'B', type: 'occupation', nameKo: '오두막집 살이', nameEn: 'Cottager', effects: [] },
    { id: 'B089', deck: 'B', type: 'occupation', nameKo: '마부', nameEn: 'Groom', effects: [] },
    { id: 'B091', deck: 'B', type: 'occupation', nameKo: '보조 경작자', nameEn: 'Assistant Tiller', effects: [] },
    { id: 'B095', deck: 'B', type: 'occupation', nameKo: '숙련 벽돌공', nameEn: 'Master Bricklayer', effects: [] },
    { id: 'B097', deck: 'B', type: 'occupation', nameKo: '학자', nameEn: 'Scholar', effects: [] },
    { id: 'B098', deck: 'B', type: 'occupation', nameKo: '유기 농부', nameEn: 'Organic Farmer', effects: [] },
    { id: 'B099', deck: 'B', type: 'occupation', nameKo: '가정교사', nameEn: 'Tutor', effects: [] },
    { id: 'B102', deck: 'B', type: 'occupation', nameKo: '상담가', nameEn: 'Consultant', effects: [] },
    { id: 'B104', deck: 'B', type: 'occupation', nameKo: '양치기', nameEn: 'Sheep Walker', effects: [] },
    { id: 'B107', deck: 'B', type: 'occupation', nameKo: '하인', nameEn: 'Manservant', effects: [] },
    { id: 'B108', deck: 'B', type: 'occupation', nameKo: '화덕 점화 소년', nameEn: 'Oven Firing Boy', effects: [] },
    { id: 'B109', deck: 'B', type: 'occupation', nameKo: '제지업자', nameEn: 'Paper Maker', effects: [] },
    { id: 'B114', deck: 'B', type: 'occupation', nameKo: '자녀 없는 이', nameEn: 'Childless', effects: [] },
    { id: 'B118', deck: 'B', type: 'occupation', nameKo: '소농', nameEn: 'Small-scale Farmer', effects: [] },
    { id: 'B121', deck: 'B', type: 'occupation', nameKo: '지질학자', nameEn: 'Geologist', effects: [] },
    { id: 'B123', deck: 'B', type: 'occupation', nameKo: '지붕 안정공', nameEn: 'Roof Ballaster', effects: [] },
    { id: 'B136', deck: 'B', type: 'occupation', nameKo: '집사', nameEn: 'House Steward', effects: [] },
    { id: 'B142', deck: 'B', type: 'occupation', nameKo: '채소 가게 주인', nameEn: 'Greengrocer', effects: [] },
    { id: 'B145', deck: 'B', type: 'occupation', nameKo: '잡목 수집가', nameEn: 'Brushwood Collector', effects: [] },
    { id: 'B156', deck: 'B', type: 'occupation', nameKo: '창고지기', nameEn: 'Storehouse Keeper', effects: [] },
    { id: 'B163', deck: 'B', type: 'occupation', nameKo: '목사', nameEn: 'Pastor', effects: [] },
    { id: 'B164', deck: 'B', type: 'occupation', nameKo: '양 속삭이는 자', nameEn: 'Sheep Whisperer', effects: [] },
    { id: 'B166', deck: 'B', type: 'occupation', nameKo: '소 먹이는 사람', nameEn: 'Cattle Feeder', effects: [] },
    // B096 Tree Farm Joiner — 물리 카드 확인 필요
  ];
}
