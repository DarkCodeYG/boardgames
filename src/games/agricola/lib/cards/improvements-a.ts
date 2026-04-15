/**
 * A덱 소시설 카드 24장
 * Phase 2 구현 대상 — 현재는 이름/비용만, effects 빈 배열
 */

import type { Card } from '../types.js';

export function getImprovementsA(): Card[] {
  return [
    { id: 'A002', deck: 'A', type: 'minor_improvement', nameKo: '이동 경작', nameEn: 'Shifting Cultivation', cost: { food: 2 }, effects: [] },
    { id: 'A005', deck: 'A', type: 'minor_improvement', nameKo: '점토 제방', nameEn: 'Clay Embankment', cost: { food: 1 }, effects: [] },
    { id: 'A009', deck: 'A', type: 'minor_improvement', nameKo: '어린 동물 시장', nameEn: 'Young Animal Market', cost: { sheep: 1 }, effects: [] },
    { id: 'A012', deck: 'A', type: 'minor_improvement', nameKo: '구유', nameEn: 'Drinking Trough', cost: { clay: 1 }, effects: [] },
    { id: 'A016', deck: 'A', type: 'minor_improvement', nameKo: '다진 점토', nameEn: 'Rammed Clay', effects: [] }, // 무료
    { id: 'A019', deck: 'A', type: 'minor_improvement', nameKo: '손쟁기', nameEn: 'Handplow', cost: { wood: 1 }, effects: [] },
    { id: 'A024', deck: 'A', type: 'minor_improvement', nameKo: '타작판', nameEn: 'Threshing Board', cost: { wood: 1 }, prerequisites: '직업 카드 2장 이상', effects: [], victoryPoints: 1 },
    { id: 'A026', deck: 'A', type: 'minor_improvement', nameKo: '잠자리 구석', nameEn: 'Sleeping Corner', cost: { wood: 1 }, prerequisites: '밀밭 2개 이상', effects: [], victoryPoints: 1 },
    { id: 'A032', deck: 'A', type: 'minor_improvement', nameKo: '여물통', nameEn: 'Manger', cost: { wood: 2 }, effects: [] },
    { id: 'A033', deck: 'A', type: 'minor_improvement', nameKo: '광활한 땅', nameEn: 'Big Country', prerequisites: '농장 모든 칸 사용', effects: [] }, // 무료
    { id: 'A038', deck: 'A', type: 'minor_improvement', nameKo: '양털 담요', nameEn: 'Wool Blankets', prerequisites: '양 5마리 이상', effects: [] }, // 무료
    { id: 'A044', deck: 'A', type: 'minor_improvement', nameKo: '연못 오두막', nameEn: 'Pond Hut', cost: { wood: 1 }, prerequisites: '직업 카드 정확히 2장', effects: [], victoryPoints: 1 },
    { id: 'A050', deck: 'A', type: 'minor_improvement', nameKo: '우유 단지', nameEn: 'Milk Jug', cost: { clay: 1 }, effects: [] },
    { id: 'A053', deck: 'A', type: 'minor_improvement', nameKo: '점토 파이프', nameEn: 'Claypipe', cost: { clay: 1 }, effects: [] },
    { id: 'A055', deck: 'A', type: 'minor_improvement', nameKo: '잡동사니방', nameEn: 'Junk Room', cost: { wood: 1, clay: 1 }, effects: [] },
    { id: 'A056', deck: 'A', type: 'minor_improvement', nameKo: '바구니', nameEn: 'Basket', cost: { reed: 1 }, effects: [] },
    { id: 'A063', deck: 'A', type: 'minor_improvement', nameKo: '네덜란드 풍차', nameEn: 'Dutch Windmill', cost: { wood: 2, stone: 2 }, effects: [], victoryPoints: 2 },
    { id: 'A067', deck: 'A', type: 'minor_improvement', nameKo: '곡물 스쿠프', nameEn: 'Corn Scoop', cost: { wood: 1 }, effects: [] },
    { id: 'A069', deck: 'A', type: 'minor_improvement', nameKo: '대형 온실', nameEn: 'Large Greenhouse', cost: { wood: 2 }, prerequisites: '직업 카드 2장 이상', effects: [] },
    { id: 'A071', deck: 'A', type: 'minor_improvement', nameKo: '개간 삽', nameEn: 'Clearing Spade', cost: { wood: 1 }, effects: [] },
    { id: 'A075', deck: 'A', type: 'minor_improvement', nameKo: '제재소', nameEn: 'Lumber Mill', cost: { stone: 2 }, prerequisites: '직업 카드 3장 이하', effects: [], victoryPoints: 2 },
    { id: 'A078', deck: 'A', type: 'minor_improvement', nameKo: '카누', nameEn: 'Canoe', cost: { wood: 2 }, prerequisites: '직업 카드 1장 이상', effects: [], victoryPoints: 1 },
    { id: 'A080', deck: 'A', type: 'minor_improvement', nameKo: '돌 집게', nameEn: 'Stone Tongs', cost: { wood: 1 }, effects: [] },
    { id: 'A083', deck: 'A', type: 'minor_improvement', nameKo: '목동 지팡이', nameEn: "Shepherd's Crook", cost: { wood: 1 }, effects: [] },
  ];
}
