/**
 * GameState Firebase 직렬화/역직렬화
 *
 * Firebase RTDB 는 함수 값을 저장할 수 없음. GameState 는 다음 함수 필드를 포함:
 *   - ActionSpace.effect: (state, pid) => GameState
 *   - CardEffect.apply: (state, pid) => GameState
 *   - CardEffect.condition: (state, player, actionId?) => boolean
 *   - Card.victoryPoints: (state, pid) => number (또는 숫자)
 *   - MajorImprovement.effects[]: CardEffect[]
 *
 * 해결: 쓰기 전 `dehydrate` 로 함수 필드 제거. 읽기 후 `hydrate` 로 정적 레지스트리
 * (getPermanentActionSpaces/getRoundCardsByStage/getMajorImprovements/getBaseDeckCards)
 * 에서 ID로 lookup 하여 함수 재주입.
 */

import type {
  GameState,
  ActionSpace,
  ActionSpaceState,
  RoundCardState,
  MajorImprovement,
  Card,
  FarmBoard,
  CellType,
} from './types.js';
import { getPermanentActionSpaces } from './action-spaces.js';
import { getRoundCardsByStage } from './round-cards.js';
import { getMajorImprovements } from './cards/major-improvements.js';
import { getBaseDeckCards } from './cards/index.js';
import { createInitialFarmBoard } from './farm-engine.js';

// ── 레지스트리 빌드 (ID → 원본 객체) ─────────────────────────────

function buildActionSpaceRegistry(playerCount: 2 | 3 | 4): Record<string, ActionSpace> {
  const reg: Record<string, ActionSpace> = {};
  for (const s of getPermanentActionSpaces(playerCount)) reg[s.id] = s;
  for (let stage = 1; stage <= 6; stage++) {
    for (const s of getRoundCardsByStage(stage)) reg[s.id] = s;
  }
  return reg;
}

function buildMajorImprovementRegistry(): Record<string, MajorImprovement> {
  const reg: Record<string, MajorImprovement> = {};
  for (const m of getMajorImprovements()) reg[m.id] = m;
  return reg;
}

function buildCardRegistry(): Record<string, Card> {
  const reg: Record<string, Card> = {};
  const { occupations, improvements } = getBaseDeckCards();
  for (const c of occupations) reg[c.id] = c;
  for (const c of improvements) reg[c.id] = c;
  return reg;
}

// ── dehydrate: 함수 필드 제거 ──────────────────────────────────

function dehydrateSpace(space: ActionSpace): Partial<ActionSpace> {
  // effect 함수 제거. 나머지 필드는 유지 (ID 기반으로 재복원 가능)
  const { effect: _effect, ...rest } = space;
  return rest;
}

function dehydrateCard(card: Card): Card {
  // effects 의 apply/condition 및 victoryPoints 함수 제거
  return {
    ...card,
    effects: card.effects.map((e) => {
      const { apply: _a, condition: _c, ...rest } = e;
      return rest as Card['effects'][number];
    }),
    victoryPoints: typeof card.victoryPoints === 'function' ? 0 : card.victoryPoints,
  };
}

function dehydrateMajorImprovement(m: MajorImprovement): MajorImprovement {
  return {
    ...m,
    effects: m.effects.map((e) => {
      const { apply: _a, condition: _c, ...rest } = e;
      return rest as MajorImprovement['effects'][number];
    }),
  };
}

export function dehydrateGameState(gs: GameState): unknown {
  // Firebase 용 plain object. 깊은 복사 + 함수 제거 + undefined 값 정리
  const cleaned = {
    ...gs,
    actionSpaces: Object.fromEntries(
      Object.entries(gs.actionSpaces).map(([id, s]) => [
        id,
        { ...s, space: dehydrateSpace(s.space) },
      ]),
    ),
    revealedRoundCards: gs.revealedRoundCards.map((rc) => ({
      ...rc,
      space: dehydrateSpace(rc.space),
    })),
    pendingRoundCards: gs.pendingRoundCards.map((stage) => stage.map(dehydrateSpace)),
    occupationDeck: gs.occupationDeck.map(dehydrateCard),
    minorImprovementDeck: gs.minorImprovementDeck.map(dehydrateCard),
    majorImprovements: gs.majorImprovements.map(dehydrateMajorImprovement),
    players: Object.fromEntries(
      Object.entries(gs.players).map(([pid, p]) => [
        pid,
        { ...p, playedCards: p.playedCards.map(dehydrateCard) },
      ]),
    ),
  };
  return stripUndefined(cleaned);
}

// Firebase 는 undefined 필드 거부 → null 로 치환 or 제거
function stripUndefined(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return obj;
}

// ── hydrate: ID 기반 함수 재주입 ────────────────────────────────

function hydrateSpace(dehydrated: Partial<ActionSpace>, reg: Record<string, ActionSpace>): ActionSpace {
  const id = dehydrated.id;
  if (!id) throw new Error('hydrateSpace: id missing');
  const original = reg[id];
  if (!original) {
    // 레지스트리에 없는 ID — 비어있는 effect 로 복원
    return {
      ...(dehydrated as ActionSpace),
      effect: (s) => s,
    };
  }
  // 누적 리소스 등 상태 정보는 dehydrated 쪽을 신뢰, 함수는 original 에서 복원
  return { ...original, ...dehydrated, effect: original.effect } as ActionSpace;
}

function hydrateCard(dehydrated: Card, reg: Record<string, Card>): Card {
  const original = reg[dehydrated.id];
  if (!original) return dehydrated;
  // 상태(나 자체 — 카드 인스턴스 필드) 유지 + 원본 정적 필드 (effects, victoryPoints) 복원
  return {
    ...dehydrated,
    effects: original.effects,
    victoryPoints: original.victoryPoints,
  };
}

function hydrateMajor(dehydrated: MajorImprovement, reg: Record<string, MajorImprovement>): MajorImprovement {
  const original = reg[dehydrated.id];
  if (!original) return dehydrated;
  return { ...original, ownerId: dehydrated.ownerId };
}

export function hydrateGameState(raw: GameState): GameState {
  const playerCount = raw.playerOrder.length as 2 | 3 | 4;
  const spaceReg = buildActionSpaceRegistry(playerCount);
  const majorReg = buildMajorImprovementRegistry();
  const cardReg = buildCardRegistry();

  return {
    ...raw,
    actionSpaces: Object.fromEntries(
      Object.entries(raw.actionSpaces ?? {}).map(([id, s]) => [
        id,
        { ...s, space: hydrateSpace((s as ActionSpaceState).space, spaceReg) } as ActionSpaceState,
      ]),
    ),
    revealedRoundCards: (raw.revealedRoundCards ?? []).map((rc) => ({
      ...(rc as RoundCardState),
      space: hydrateSpace((rc as RoundCardState).space, spaceReg),
    })),
    pendingRoundCards: (raw.pendingRoundCards ?? []).map((stage) =>
      (stage ?? []).map((s) => hydrateSpace(s, spaceReg)),
    ),
    occupationDeck: (raw.occupationDeck ?? []).map((c) => hydrateCard(c, cardReg)),
    minorImprovementDeck: (raw.minorImprovementDeck ?? []).map((c) => hydrateCard(c, cardReg)),
    majorImprovements: (raw.majorImprovements ?? []).map((m) => hydrateMajor(m, majorReg)),
    players: Object.fromEntries(
      Object.entries(raw.players ?? {}).map(([pid, p]) => [
        pid,
        {
          ...p,
          playedCards: (p.playedCards ?? []).map((c) => hydrateCard(c, cardReg)),
          hand: {
            occupations: p.hand?.occupations ?? [],
            minorImprovements: p.hand?.minorImprovements ?? [],
          },
          farm: hydrateFarmBoard(p.farm),
          workers: p.workers ?? [],
        },
      ]),
    ),
    log: raw.log ?? [],
  };
}

/** FarmBoard 복원 — Firebase 가 empty array/undefined 로 삭제한 필드 재구성 */
function hydrateFarmBoard(raw: Partial<FarmBoard> | undefined): FarmBoard {
  const init = createInitialFarmBoard();
  if (!raw) return init;

  // grid: 3×5 CellType 배열 복원 (Firebase 가 각 행을 object 로 저장할 수 있음)
  const grid = (raw.grid ?? init.grid).map((row, r) => {
    const rowArr = Array.isArray(row) ? row : Object.values(row ?? {});
    return Array.from({ length: 5 }, (_, c) => (rowArr[c] as CellType) ?? init.grid[r]?.[c] ?? 'empty');
  });

  // fences: 4×5 horizontal, 3×6 vertical
  const rawH = raw.fences?.horizontal;
  const rawV = raw.fences?.vertical;
  const horizontal = Array.from({ length: 4 }, (_, r) => {
    const row = rawH?.[r];
    const arr = Array.isArray(row) ? row : row ? Object.values(row) : [];
    return Array.from({ length: 5 }, (_, c) => Boolean(arr[c]));
  });
  const vertical = Array.from({ length: 3 }, (_, r) => {
    const row = rawV?.[r];
    const arr = Array.isArray(row) ? row : row ? Object.values(row) : [];
    return Array.from({ length: 6 }, (_, c) => Boolean(arr[c]));
  });

  return {
    grid,
    sownFields: raw.sownFields ?? [],
    fences: { horizontal, vertical },
    pastures: raw.pastures ?? [],
    stables: raw.stables ?? [],
    animalsInHouse: raw.animalsInHouse ?? [],
  };
}
