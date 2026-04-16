/**
 * 아그리콜라 다국어 텍스트
 * Phase 4 구현 대상. 현재는 한국어만.
 */

import type { Lang, ResourceType, CellType } from './types.js';

type I18nKey =
  | 'game_title'
  | 'start_game'
  | 'phase_work'
  | 'phase_harvest'
  | 'phase_gameover'
  | 'round'
  | 'stage'
  | 'place_worker'
  | 'return_home'
  | 'your_turn'
  | 'score_total'
  | ResourceType
  | CellType;

const ko: Record<I18nKey, string> = {
  game_title: '아그리콜라',
  start_game: '게임 시작',
  phase_work: '일하는 단계',
  phase_harvest: '수확',
  phase_gameover: '게임 종료',
  round: '라운드',
  stage: '스테이지',
  place_worker: '일꾼 배치',
  return_home: '귀환',
  your_turn: '당신의 차례',
  score_total: '총점',
  // 자원
  wood: '나무',
  clay: '점토',
  stone: '돌',
  reed: '갈대',
  grain: '밀',
  vegetable: '채소',
  food: '음식',
  sheep: '양',
  boar: '멧돼지',
  cattle: '소',
  // 셀 타입
  empty: '빈칸',
  room_wood: '나무 방',
  room_clay: '점토 방',
  room_stone: '돌 방',
  field: '밭',
  stable: '외양간',
};

const en: Record<I18nKey, string> = {
  game_title: 'Agricola',
  start_game: 'Start Game',
  phase_work: 'Work Phase',
  phase_harvest: 'Harvest',
  phase_gameover: 'Game Over',
  round: 'Round',
  stage: 'Stage',
  place_worker: 'Place Worker',
  return_home: 'Return Home',
  your_turn: 'Your Turn',
  score_total: 'Total',
  wood: 'Wood',
  clay: 'Clay',
  stone: 'Stone',
  reed: 'Reed',
  grain: 'Grain',
  vegetable: 'Vegetable',
  food: 'Food',
  sheep: 'Sheep',
  boar: 'Wild Boar',
  cattle: 'Cattle',
  empty: 'Empty',
  room_wood: 'Wooden Room',
  room_clay: 'Clay Room',
  room_stone: 'Stone Room',
  field: 'Field',
  stable: 'Stable',
};

const zh: Partial<Record<I18nKey, string>> = {
  game_title: '农场主',
  wood: '木材',
  clay: '黏土',
  stone: '石头',
  reed: '芦苇',
  grain: '谷物',
  vegetable: '蔬菜',
  food: '食物',
  sheep: '羊',
  boar: '野猪',
  cattle: '牛',
};

const texts: Record<Lang, Partial<Record<I18nKey, string>>> = { ko, en, zh };

export function t(key: I18nKey, lang: Lang): string {
  return texts[lang]?.[key] ?? texts.ko[key] ?? key;
}
