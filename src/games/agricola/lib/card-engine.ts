/**
 * 카드 효과 엔진 — 트리거 매칭 및 효과 발동
 * Phase 2 구현 대상.
 */

import type { GameState, PlayerId, TriggerType, Card, CardEffect } from './types.js';

// ── 트리거 발동 ──────────────────────────────────────────────────

/**
 * 특정 트리거 타입에 해당하는 플레이어 카드 효과를 모두 발동
 * 순수 함수: state → state
 */
export function triggerEffects(
  state: GameState,
  playerId: PlayerId,
  trigger: TriggerType,
  actionId?: string,
): GameState {
  const player = state.players[playerId];
  if (!player) return state;

  let newState = state;
  for (const card of player.playedCards) {
    for (const effect of card.effects) {
      if (effect.trigger !== trigger) continue;
      if (effect.condition && !effect.condition(newState, player, actionId)) continue;
      newState = effect.apply(newState, playerId);
    }
  }
  return newState;
}

/**
 * 카드 플레이: 손패에서 제거 + 플레이 카드로 이동 + IMMEDIATE 트리거 발동
 * Phase 2 TODO
 */
export function playCard(
  state: GameState,
  playerId: PlayerId,
  cardId: string,
): GameState {
  // Phase 2 TODO
  const player = state.players[playerId];
  if (!player) return state;

  // 손패에서 찾기
  const occ = player.hand.occupations.find((c) => c.id === cardId);
  const imp = player.hand.minorImprovements.find((c) => c.id === cardId);
  const card: Card | undefined = occ ?? imp;
  if (!card) throw new Error(`Card ${cardId} not in hand`);

  // 비용 지불
  let newState = payCardCost(state, playerId, card);

  // 플레이드 카드로 이동
  newState = {
    ...newState,
    players: {
      ...newState.players,
      [playerId]: {
        ...newState.players[playerId]!,
        hand: {
          occupations: newState.players[playerId]!.hand.occupations.filter((c) => c.id !== cardId),
          minorImprovements: newState.players[playerId]!.hand.minorImprovements.filter((c) => c.id !== cardId),
        },
        playedCards: [...newState.players[playerId]!.playedCards, card],
        occupationsPlayed: card.type === 'occupation'
          ? newState.players[playerId]!.occupationsPlayed + 1
          : newState.players[playerId]!.occupationsPlayed,
      },
    },
  };

  // IMMEDIATE 트리거
  return triggerEffects(newState, playerId, 'IMMEDIATE');
}

function payCardCost(state: GameState, _playerId: PlayerId, card: Card): GameState {
  // Phase 2 TODO: 비용 검증 + 자원 차감
  void card; // stub
  return state;
}

// ── 카드 비용 계산 ───────────────────────────────────────────────

/**
 * 직업 카드 플레이 비용: 첫 번째 무료, 이후 음식 1개 (1-2인 기준)
 * 3인 이상: LESSONS/EXT3_LESSONS 행동 공간에서 처리
 */
export function getOccupationPlayCost(player: { occupationsPlayed: number }, playerCount: number): number {
  if (playerCount <= 2) {
    return player.occupationsPlayed === 0 ? 0 : 1;
  }
  // 3-4인은 전용 행동 공간에서만 플레이 가능, 비용은 공간 정의에 따름
  return 1;
}

// ── 유효성 검사 ──────────────────────────────────────────────────

export function canPlayCard(
  state: GameState,
  playerId: PlayerId,
  card: Card,
): { ok: boolean; reason?: string } {
  const player = state.players[playerId];
  if (!player) return { ok: false, reason: 'Player not found' };

  // prerequisites 확인 (Phase 2 TODO: 실제 조건 파싱)
  if (card.prerequisites) {
    // TODO: parse and check prerequisites string
  }

  // 비용 확인
  if (card.cost) {
    for (const [resource, amount] of Object.entries(card.cost)) {
      if ((player.resources[resource as keyof typeof player.resources] ?? 0) < (amount ?? 0)) {
        return { ok: false, reason: `Insufficient ${resource}` };
      }
    }
  }

  return { ok: true };
}

// ── 번식 계산 (카드 효과 없는 기본 번식) ─────────────────────────

export function calculateBreeding(
  _state: GameState,
  _playerId: PlayerId,
): GameState {
  // Phase 1 TODO: 목장 동물 번식 로직
  // 규칙: 같은 종 2마리 이상 + 빈 용량 있으면 새끼 1마리
  // 번식 시 새끼는 즉시 음식으로 변환 불가
  throw new Error('Phase 1 TODO: calculateBreeding');
}

// stub용 타입 export (noUnusedLocals 방지)
export type { CardEffect };
