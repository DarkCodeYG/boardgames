/**
 * B덱 소시설 카드 24장
 * Phase 2 구현 대상 — 현재는 이름/비용만
 */

import type { Card } from '../types.js';

export function getImprovementsB(): Card[] {
  return [
    { id: 'B002', deck: 'B', type: 'minor_improvement', nameKo: '미니 목장', nameEn: 'Mini Pasture', cost: { food: 2 }, effects: [] },
    { id: 'B008', deck: 'B', type: 'minor_improvement', nameKo: '시장 가판', nameEn: 'Market Stall', cost: { grain: 1 }, effects: [] },
    { id: 'B010', deck: 'B', type: 'minor_improvement', nameKo: '캐러밴', nameEn: 'Caravan', cost: { wood: 3, food: 3 }, effects: [] },
    { id: 'B013', deck: 'B', type: 'minor_improvement', nameKo: '목수의 응접실', nameEn: "Carpenter's Parlor", cost: { wood: 1, stone: 1 }, effects: [] },
    { id: 'B016', deck: 'B', type: 'minor_improvement', nameKo: '채광 망치', nameEn: 'Mining Hammer', cost: { wood: 1 }, effects: [] },
    { id: 'B019', deck: 'B', type: 'minor_improvement', nameKo: '몰드보드 쟁기', nameEn: 'Moldboard Plow', cost: { wood: 2 }, prerequisites: '직업 카드 1장 이상', effects: [] },
    { id: 'B024', deck: 'B', type: 'minor_improvement', nameKo: '올가미', nameEn: 'Lasso', cost: { reed: 1 }, effects: [] },
    { id: 'B025', deck: 'B', type: 'minor_improvement', nameKo: '빵 주걱', nameEn: 'Bread Paddle', cost: { wood: 1 }, effects: [] },
    { id: 'B033', deck: 'B', type: 'minor_improvement', nameKo: '벽난로 선반', nameEn: 'Mantlepiece', cost: { stone: 1 }, prerequisites: '점토 또는 돌집', effects: [], victoryPoints: -3 },
    { id: 'B036', deck: 'B', type: 'minor_improvement', nameKo: '병', nameEn: 'Bottles', effects: [], victoryPoints: 4 }, // 비용: 가족 수×(점토1+음식1)
    { id: 'B039', deck: 'B', type: 'minor_improvement', nameKo: '베틀', nameEn: 'Loom', cost: { wood: 2 }, prerequisites: '직업 카드 2장 이상', effects: [], victoryPoints: 1 },
    { id: 'B045', deck: 'B', type: 'minor_improvement', nameKo: '딸기 밭', nameEn: 'Strawberry Patch', cost: { wood: 1 }, prerequisites: '채소밭 2개 이상', effects: [], victoryPoints: 2 },
    { id: 'B047', deck: 'B', type: 'minor_improvement', nameKo: '청어 냄비', nameEn: 'Herring Pot', cost: { clay: 1 }, effects: [] },
    { id: 'B050', deck: 'B', type: 'minor_improvement', nameKo: '버터 교반기', nameEn: 'Butter Churn', cost: { wood: 1 }, prerequisites: '직업 카드 3장 이하', effects: [], victoryPoints: 1 },
    { id: 'B056', deck: 'B', type: 'minor_improvement', nameKo: '시냇물', nameEn: 'Brook', prerequisites: '낚시 공간에 본인 워커', effects: [] }, // 무료
    { id: 'B057', deck: 'B', type: 'minor_improvement', nameKo: '작은 부엌', nameEn: 'Scullery', cost: { wood: 1, clay: 1 }, effects: [] },
    { id: 'B061', deck: 'B', type: 'minor_improvement', nameKo: '삼포식 농업', nameEn: 'Three-Field Rotation', prerequisites: '직업 카드 3장 이상', effects: [] }, // 무료
    { id: 'B062', deck: 'B', type: 'minor_improvement', nameKo: '쇠스랑', nameEn: 'Pitchfork', cost: { wood: 1 }, effects: [] },
    { id: 'B066', deck: 'B', type: 'minor_improvement', nameKo: '마대 수레', nameEn: 'Sack Cart', cost: { wood: 2 }, prerequisites: '직업 카드 2장 이상', effects: [] },
    { id: 'B068', deck: 'B', type: 'minor_improvement', nameKo: '콩밭', nameEn: 'Beanfield', cost: { food: 1 }, prerequisites: '직업 카드 2장 이상', effects: [], victoryPoints: 1 },
    { id: 'B074', deck: 'B', type: 'minor_improvement', nameKo: '울창한 숲', nameEn: 'Thick Forest', prerequisites: '점토 5개 이상 보유', effects: [] }, // 무료
    { id: 'B077', deck: 'B', type: 'minor_improvement', nameKo: '황토 웅덩이', nameEn: 'Loam Pit', cost: { food: 1 }, prerequisites: '직업 카드 3장 이상', effects: [], victoryPoints: 1 },
    { id: 'B080', deck: 'B', type: 'minor_improvement', nameKo: '경질 자기', nameEn: 'Hard Porcelain', cost: { clay: 1 }, effects: [] },
    { id: 'B084', deck: 'B', type: 'minor_improvement', nameKo: '도토리 바구니', nameEn: 'Acorns Basket', cost: { reed: 1 }, prerequisites: '직업 카드 3장 이상', effects: [] },
  ];
}
