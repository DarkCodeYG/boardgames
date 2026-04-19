/**
 * 액션 디스패처 — 호스트가 클라이언트 액션 요청을 엔진으로 처리
 *
 * 순수 함수. I/O 없음. (GameState, ActionQueueItem) → { nextState } or throw
 * Firebase 쓰기는 호스트 페이지에서 이 함수 반환값을 받아 처리.
 *
 * 지원 액션 (Cycle 4 MVP — 카드 없는 기본 플로우):
 *   place_worker, end_round, harvest_confirm, bake_bread
 * 추후(Cycle 4.2+): cell_click 계열(plow/sow/build), fence_click, place_animal, cook_animal, ...
 */

import type { GameState, ActionQueueItem, PlayerId, AnimalType } from './types.js';
import {
  placeWorker,
  advanceToNextPlayer,
  countPlacedWorkers,
  returnWorkers,
  startRound,
  replenishActionSpaces,
  harvestFields,
  feedFamilyForPlayer,
  breedAnimalsForPlayer,
  bakeBreadForPlayer,
  isHarvestRound,
  plowField,
  sowField,
  growFamily,
  renovateHouse,
  buildRoom,
  buildStable,
  buildFences,
  getAnimalFromMarket,
  placeAnimalForPlayer,
  replaceAnimalAtLocation,
  cookAnimal,
  addResources,
  type AnimalSource,
} from './game-engine.js';

export interface DispatchResult {
  nextState: GameState;
  /** 추가 사이드 효과: 플레이어 폰에 pending 상태 안내 등. Cycle 5 에서 확장 */
  notes?: string[];
}

/** 디스패처 메인 — 예외 발생 시 호출측이 markActionRejected */
export function dispatchAction(
  state: GameState,
  action: ActionQueueItem,
): DispatchResult {
  // 1) 플레이어 존재 확인
  if (!state.players[action.playerId]) {
    throw new Error('플레이어를 찾을 수 없습니다');
  }

  // 2) 현재 차례 강제 (end_round/harvest_confirm 등 호스트 전용 제외)
  const currentPid = state.playerOrder[state.currentPlayerIndex] ?? '';
  const TURN_FREE = new Set<string>(['end_round', 'harvest_confirm', 'cook_animal']);
  if (!TURN_FREE.has(action.kind) && action.playerId !== currentPid) {
    throw new Error('본인 차례가 아닙니다');
  }

  switch (action.kind) {
    case 'place_worker': {
      const actionSpaceId = action.payload.actionSpaceId as string;
      if (!actionSpaceId) throw new Error('행동 공간 ID 누락');
      let s = placeWorker(state, action.playerId, actionSpaceId);
      if (s.roundPhase === 'work') s = advanceToNextPlayer(s);
      return { nextState: s };
    }

    case 'cell_click': {
      const r = action.payload.row as number;
      const c = action.payload.col as number;
      const phase = state.roundPhase;
      let s: GameState;
      if (phase === 'pending_plow') {
        s = plowField(state, action.playerId, r, c);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else if (phase === 'pending_plow_sow') {
        s = plowField(state, action.playerId, r, c);
        s = { ...s, roundPhase: 'pending_sow' };
      } else if (phase === 'pending_sow') {
        const player = state.players[action.playerId];
        const crop: 'grain' | 'vegetable' =
          (player?.resources.grain ?? 0) > 0 ? 'grain' : 'vegetable';
        s = sowField(state, action.playerId, r, c, crop);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else if (phase === 'pending_build_room') {
        s = buildRoom(state, action.playerId, r, c);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else if (phase === 'pending_build_stable') {
        s = buildStable(state, action.playerId, r, c);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else {
        throw new Error(`현재 단계(${phase})에서는 셀 클릭이 유효하지 않습니다`);
      }
      return { nextState: s };
    }

    case 'pending_confirm': {
      const phase = state.roundPhase;
      let s: GameState = state;
      if (phase === 'pending_family_growth') {
        s = growFamily(state, action.playerId, true);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else if (phase === 'pending_family_growth_urgent') {
        s = growFamily(state, action.playerId, false);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else if (phase === 'pending_renovate') {
        s = renovateHouse(state, action.playerId);
        s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      } else if (phase === 'pending_renovate_fence') {
        s = renovateHouse(state, action.playerId);
        s = { ...s, roundPhase: 'pending_fence' };
      } else if (phase === 'pending_fence') {
        const segments = (action.payload.segments as Array<{ type: 'h' | 'v'; row: number; col: number }>) ?? [];
        if (segments.length === 0) {
          s = advanceToNextPlayer({ ...state, roundPhase: 'work' });
        } else {
          s = buildFences(state, action.playerId, segments);
          s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
        }
      } else {
        throw new Error(`현재 단계(${phase})에서는 확인이 유효하지 않습니다`);
      }
      return { nextState: s };
    }

    case 'animal_select': {
      const animalType = action.payload.animalType as AnimalType;
      const s = getAnimalFromMarket(state, action.playerId, animalType);
      // pending_animal_choice 는 배치 완료 후 advanceToNextPlayer — 여기서는 work 유지
      return { nextState: { ...s, roundPhase: 'work' } };
    }

    case 'place_animal': {
      const animalType = action.payload.animalType as AnimalType;
      const destination = action.payload.destination as number | 'house';
      let s = placeAnimalForPlayer(state, action.playerId, animalType, destination);
      s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      return { nextState: s };
    }

    case 'remove_animal': {
      const animalType = action.payload.animalType as AnimalType;
      const location = action.payload.location as { type: 'pasture'; index: number } | { type: 'house' };
      let s = replaceAnimalAtLocation(state, action.playerId, animalType, location);
      s = advanceToNextPlayer({ ...s, roundPhase: 'work' });
      return { nextState: s };
    }

    case 'overflow_discard':
    case 'cancel_replace': {
      const animalType = action.payload.animalType as AnimalType;
      const s = addResources(state, action.playerId, { [animalType]: -1 });
      return { nextState: advanceToNextPlayer({ ...s, roundPhase: 'work' }) };
    }

    case 'overflow_cook': {
      const animalType = action.payload.animalType as AnimalType;
      const src: AnimalSource = { kind: 'resources', animalType, count: 1 };
      const s = cookAnimal(state, action.playerId, src);
      return { nextState: advanceToNextPlayer({ ...s, roundPhase: 'work' }) };
    }

    case 'cook_animal': {
      const src = action.payload.source as AnimalSource;
      const s = cookAnimal(state, action.playerId, src);
      return { nextState: s };
    }

    case 'bake_bread': {
      const improvementId = action.payload.improvementId as string;
      const s = bakeBreadForPlayer(state, action.playerId, improvementId);
      return { nextState: s };
    }

    case 'harvest_confirm': {
      const pid = action.playerId;
      let s = feedFamilyForPlayer(state, pid);
      s = breedAnimalsForPlayer(s, pid);
      return { nextState: s };
    }

    case 'end_round': {
      // 모든 플레이어 워커 배치 끝 → 수확 처리 or 다음 라운드
      if (isHarvestRound(state.round)) {
        // 수확은 호스트 UI 에서 단계별 진행 — 우선 밭 수확만
        const s = harvestFields(state);
        return { nextState: s, notes: ['harvest_started'] };
      }
      // 비수확 라운드 — 워커 회수 + 다음 라운드 시작
      let s = returnWorkers(state);
      s = { ...s, currentPlayerIndex: s.firstPlayerIndex };
      if (state.round >= 14) {
        return { nextState: { ...s, phase: 'gameover' } };
      }
      s = startRound(s);
      s = replenishActionSpaces(s);
      return { nextState: s };
    }

    default:
      throw new Error(`지원하지 않는 액션: ${action.kind}`);
  }
}

/** 게임 내에서 이 플레이어가 행동 가능한지 */
export function canPlayerAct(state: GameState, pid: PlayerId): boolean {
  const currentPid = state.playerOrder[state.currentPlayerIndex];
  if (currentPid !== pid) return false;
  const p = state.players[pid];
  if (!p) return false;
  if (state.phase !== 'playing') return false;
  return countPlacedWorkers(state, pid) < p.familySize;
}
