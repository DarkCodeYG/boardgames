/**
 * 아그리콜라 점수 계산 엔진
 * 출처: docs/agricola/06-scoring.md
 * Phase 1 구현 대상 (카드 VP 제외).
 */

import type { GameState, PlayerId, PlayerState, FarmBoard, ScoreBreakdown } from './types.js';
import {
  SCORE_TABLE_FIELDS,
  SCORE_TABLE_PASTURES,
  SCORE_TABLE_VEGETABLES,
  SCORE_GRAIN,
  SCORE_SHEEP,
  SCORE_BOAR,
  SCORE_CATTLE,
  SCORE_ROOM,
  SCORE_FAMILY_PER_PERSON,
  BEGGING_PENALTY,
} from './constants.js';
import { countFields, countEmptySpaces, isPastureFullyFenced } from './farm-engine.js';

// ── 카테고리별 점수 함수 ─────────────────────────────────────────

function scoreFields(board: FarmBoard): number {
  const count = countFields(board);
  return SCORE_TABLE_FIELDS[Math.min(count, SCORE_TABLE_FIELDS.length - 1)] ?? -1;
}

function scorePastures(board: FarmBoard): number {
  // 룰: 완전히 울타리로 닫힌 목장만 점수화
  const count = board.pastures.filter((p) => isPastureFullyFenced(p.cells, board.fences)).length;
  return SCORE_TABLE_PASTURES[Math.min(count, SCORE_TABLE_PASTURES.length - 1)] ?? -1;
}

function scoreGrain(player: PlayerState): number {
  const inStock = player.resources.grain;
  const inFields = player.farm.sownFields
    .filter((f) => f.resource === 'grain')
    .reduce((sum, f) => sum + f.count, 0);
  return SCORE_GRAIN(inStock + inFields);
}

function scoreVegetables(player: PlayerState): number {
  const inStock = player.resources.vegetable;
  const inFields = player.farm.sownFields
    .filter((f) => f.resource === 'vegetable')
    .reduce((sum, f) => sum + f.count, 0);
  const total = inStock + inFields;
  return SCORE_TABLE_VEGETABLES[Math.min(total, SCORE_TABLE_VEGETABLES.length - 1)] ?? -1;
}

function scoreSheep(player: PlayerState): number {
  return SCORE_SHEEP(totalAnimals(player, 'sheep'));
}

function scoreBoar(player: PlayerState): number {
  return SCORE_BOAR(totalAnimals(player, 'boar'));
}

function scoreCattle(player: PlayerState): number {
  return SCORE_CATTLE(totalAnimals(player, 'cattle'));
}

function scoreEmptySpaces(board: FarmBoard): number {
  return countEmptySpaces(board) * -1;
}

function scoreFencedStables(board: FarmBoard): number {
  // 룰: 완전히 울타리로 닫힌 목장의 외양간만 VP (목장당 1점, 모든 외양간 아님)
  // 정확히는 "울타리로 둘러싸인 외양간 개수" — 닫힌 목장 내부의 stable 셀 수 합
  return board.pastures
    .filter((p) => isPastureFullyFenced(p.cells, board.fences))
    .reduce((sum, p) => sum + p.cells.filter(([r, c]) =>
      board.stables.some(([sr, sc]) => sr === r && sc === c),
    ).length, 0);
}

function scoreRooms(board: FarmBoard): number {
  return board.grid.flat().reduce((sum, cell) => sum + (SCORE_ROOM[cell] ?? 0), 0);
}

function scoreFamilyMembers(player: PlayerState): number {
  return player.familySize * SCORE_FAMILY_PER_PERSON;
}

function scoreCards(player: PlayerState, state: GameState): number {
  return player.playedCards.reduce((sum, card) => {
    const vp =
      typeof card.victoryPoints === 'function'
        ? card.victoryPoints(state, player.id)
        : (card.victoryPoints ?? 0);
    return sum + vp;
  }, 0);
}

function scoreBegging(player: PlayerState): number {
  return player.beggingTokens * BEGGING_PENALTY;
}

// ── 공통 헬퍼 ────────────────────────────────────────────────────

export function totalAnimals(player: PlayerState, type: 'sheep' | 'boar' | 'cattle'): number {
  const inPastures = player.farm.pastures
    .filter((p) => p.animals?.type === type)
    .reduce((sum, p) => sum + (p.animals?.count ?? 0), 0);
  const inHouse = player.farm.animalsInHouse
    .filter((a) => a.type === type)
    .reduce((sum, a) => sum + a.count, 0);
  return inPastures + inHouse;
}

export function totalGrain(player: PlayerState): number {
  return (
    player.resources.grain +
    player.farm.sownFields
      .filter((f) => f.resource === 'grain')
      .reduce((sum, f) => sum + f.count, 0)
  );
}

export function totalVegetables(player: PlayerState): number {
  return (
    player.resources.vegetable +
    player.farm.sownFields
      .filter((f) => f.resource === 'vegetable')
      .reduce((sum, f) => sum + f.count, 0)
  );
}

export function totalGoods(player: PlayerState): number {
  const r = player.resources;
  return (
    r.wood + r.clay + r.stone + r.reed +
    totalGrain(player) + totalVegetables(player) + r.food +
    totalAnimals(player, 'sheep') +
    totalAnimals(player, 'boar') +
    totalAnimals(player, 'cattle')
  );
}

// ── 전체 점수 계산 ───────────────────────────────────────────────

export function calculateScore(state: GameState, playerId: PlayerId): ScoreBreakdown {
  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  const board = player.farm;

  const farmlands     = scoreFields(board);
  const pastures      = scorePastures(board);
  const grain         = scoreGrain(player);
  const vegetables    = scoreVegetables(player);
  const sheep         = scoreSheep(player);
  const boar          = scoreBoar(player);
  const cattle        = scoreCattle(player);
  const emptySpaces   = scoreEmptySpaces(board);
  const fencedStables = scoreFencedStables(board);
  const rooms         = scoreRooms(board);
  const familyMembers = scoreFamilyMembers(player);
  const cardPoints    = scoreCards(player, state);
  const begging       = scoreBegging(player);

  const total =
    farmlands + pastures + grain + vegetables +
    sheep + boar + cattle + emptySpaces + fencedStables +
    rooms + familyMembers + cardPoints + begging;

  return {
    farmlands, pastures, grain, vegetables,
    sheep, boar, cattle, emptySpaces, fencedStables,
    rooms, familyMembers, cardPoints, begging, total,
  };
}

// ── 동점 처리 ────────────────────────────────────────────────────

/**
 * 동점 처리: 양수 = a 승, 음수 = b 승
 * 밭→목장→밀→채소→양→멧돼지→소→총 자원 순서
 */
export function tieBreak(
  a: PlayerState,
  b: PlayerState,
): number {
  const comparators: Array<(p: PlayerState) => number> = [
    (p) => p.farm.grid.flat().filter((c) => c === 'field').length,
    (p) => p.farm.pastures.length,
    (p) => totalGrain(p),
    (p) => totalVegetables(p),
    (p) => totalAnimals(p, 'sheep'),
    (p) => totalAnimals(p, 'boar'),
    (p) => totalAnimals(p, 'cattle'),
  ];

  for (const fn of comparators) {
    const diff = fn(a) - fn(b);
    if (diff !== 0) return diff;
  }
  return totalGoods(a) - totalGoods(b);
}
