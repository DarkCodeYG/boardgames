/**
 * 아그리콜라 게임 엔진 — 핵심 게임 흐름
 * 워커 배치, 라운드 진행, 수확, 자원 보충
 * Phase 1 구현 대상.
 *
 * 규칙: 순수 함수만. GameState → GameState.
 */

import type { GameState, PlayerId, CreateGameConfig, ActionSpaceState, PlayerState, AnimalType, FarmBoard, CellType } from './types.js';
import { emptyResources } from './types.js';
import {
  STAGE_ROUNDS,
  HARVEST_ROUNDS,
  ROUND_TO_STAGE,
  PERMANENT_ACTION_SPACE_IDS,
  BEGGING_FOOD_PER_PERSON,
  INITIAL_FAMILY_SIZE,
} from './constants.js';
import { createInitialFarmBoard, recalculatePastures } from './farm-engine.js';
import { getPermanentActionSpaces } from './action-spaces.js';
import { getRoundCardsByStage } from './round-cards.js';
import { getMajorImprovements } from './cards/major-improvements.js';
import { getBaseDeckCards } from './cards/index.js';

// ── 게임 초기화 ───────────────────────────────────────────────────

export function createGameState(config: CreateGameConfig): GameState {
  // Phase 1 TODO: 셔플, 패 배분, 초기 보드 설정
  const playerIds = config.playerNames.map((_, i) => `player_${i}`);
  const colors: Array<'red' | 'blue' | 'green' | 'yellow'> = ['red', 'blue', 'green', 'yellow'];

  // 차례 보상 음식: P1=2, P2=3, P3=4, P4=5 (아그리콜라 룰)
  const players: GameState['players'] = Object.fromEntries(
    playerIds.map((id, i) => {
      const p = createInitialPlayerState(id, config.playerNames[i] ?? `Player ${i + 1}`, colors[i] ?? 'red');
      return [id, { ...p, resources: { ...p.resources, food: 2 + i } }];
    })
  );

  // 영구 행동 공간
  const permanentSpaces = getPermanentActionSpaces(config.playerCount);
  const actionSpaces: Record<string, ActionSpaceState> = Object.fromEntries(
    permanentSpaces.map((space) => [
      space.id,
      {
        space,
        accumulatedResources: emptyResources(),
        workerId: null,
      },
    ])
  );

  // 라운드 카드 (스테이지별 준비)
  const pendingRoundCards = Object.keys(STAGE_ROUNDS).map((stage) =>
    getRoundCardsByStage(Number(stage))
  );

  // 카드 덱 (Phase 2에서 셔플 구현)
  const { occupations, improvements } = getBaseDeckCards();
  const majorImprovements = getMajorImprovements();

  return {
    roomCode: generateRoomCode(config.seed),
    phase: 'setup',
    round: 0,
    stage: 0,
    roundPhase: 'start_round',
    currentPlayerIndex: 0,
    firstPlayerIndex: 0,
    playerOrder: playerIds,
    players,
    actionSpaces,
    revealedRoundCards: [],
    pendingRoundCards,
    occupationDeck: occupations,
    minorImprovementDeck: improvements,
    majorImprovements,
    startingPlayerToken: playerIds[0] ?? '',
    log: [],
  };
}

function createInitialPlayerState(
  id: PlayerId,
  name: string,
  color: 'red' | 'blue' | 'green' | 'yellow',
): PlayerState {
  return {
    id,
    name,
    color,
    farm: createInitialFarmBoard(),
    hand: { occupations: [], minorImprovements: [] },
    playedCards: [],
    resources: { ...emptyResources(), food: 0 },
    familySize: INITIAL_FAMILY_SIZE,
    beggingTokens: 0,
    workers: Array.from({ length: INITIAL_FAMILY_SIZE }, () => ({
      playerId: id,
      actionSpaceId: null,
    })),
    hasGrown: false,
    occupationsPlayed: 0,
  };
}

function generateRoomCode(seed?: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = seed ?? Date.now();
  return Array.from({ length: 4 }, () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return chars[Math.abs(s) % chars.length];
  }).join('');
}

// ── 라운드 흐름 ───────────────────────────────────────────────────

/** 새 라운드 시작: 라운드 카드 공개 */
export function startRound(state: GameState): GameState {
  const nextRound = state.round + 1;
  if (nextRound > 14) throw new Error('Game already ended');

  const nextStage = ROUND_TO_STAGE[nextRound] ?? state.stage;
  const stageCards = state.pendingRoundCards[nextStage - 1] ?? [];
  const [newCard, ...remaining] = stageCards;

  // Phase 1 TODO: 전체 라운드 시작 로직
  return {
    ...state,
    round: nextRound,
    stage: nextStage,
    roundPhase: 'replenish',
    pendingRoundCards: state.pendingRoundCards.map((cards, i) =>
      i === nextStage - 1 ? remaining : cards
    ),
    revealedRoundCards: newCard
      ? [
          ...state.revealedRoundCards,
          {
            space: newCard,
            accumulatedResources: emptyResources(),
            workerId: null,
            stageRevealed: nextStage,
          },
        ]
      : state.revealedRoundCards,
  };
}

/** 자원 보충: 누적 공간에 자원 쌓기 */
export function replenishActionSpaces(state: GameState): GameState {
  const actionSpaces = { ...state.actionSpaces };

  for (const [id, spaceState] of Object.entries(actionSpaces)) {
    if (spaceState.workerId !== null) continue; // 워커 있으면 보충 없음
    const { accumulates } = spaceState.space;
    if (!accumulates || accumulates.length === 0) continue;

    const newResources = { ...spaceState.accumulatedResources };
    for (const acc of accumulates) {
      newResources[acc.resource] = (newResources[acc.resource] ?? 0) + acc.amount;
    }
    actionSpaces[id] = { ...spaceState, accumulatedResources: newResources };
  }

  return { ...state, actionSpaces, roundPhase: 'work' };
}

/** 워커 배치 */
export function placeWorker(
  state: GameState,
  playerId: PlayerId,
  actionSpaceId: string,
): GameState {
  // Phase 1 TODO: 유효성 검사, 행동 효과 적용
  const spaceState = state.actionSpaces[actionSpaceId]
    ?? state.revealedRoundCards.find((rc) => rc.space.id === actionSpaceId);

  if (!spaceState) throw new Error(`Action space ${actionSpaceId} not found`);
  if (spaceState.workerId) throw new Error(`Action space ${actionSpaceId} is occupied`);

  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);

  // 행동 효과 적용
  let newState = spaceState.space.effect(state, playerId);

  // 워커 배치 표시 — 영구 공간 또는 라운드 카드 모두 처리
  if (actionSpaceId in newState.actionSpaces) {
    const cur = newState.actionSpaces[actionSpaceId]!;
    newState = {
      ...newState,
      actionSpaces: {
        ...newState.actionSpaces,
        [actionSpaceId]: { ...cur, workerId: playerId, accumulatedResources: emptyResources() },
      },
    };
  } else {
    // 라운드 카드: workerId 설정 + accumulatedResources 초기화
    newState = {
      ...newState,
      revealedRoundCards: newState.revealedRoundCards.map((rc) =>
        rc.space.id === actionSpaceId
          ? { ...rc, workerId: playerId, accumulatedResources: emptyResources() }
          : rc
      ),
    };
  }

  // 로그
  return addLog(newState, { round: newState.round, playerId, action: 'place_worker', detail: actionSpaceId, timestamp: Date.now() });
}

/** 모든 워커 회수 */
export function returnWorkers(state: GameState): GameState {
  const actionSpaces = Object.fromEntries(
    Object.entries(state.actionSpaces).map(([id, s]) => [
      id, { ...s, workerId: null },
    ])
  );
  const revealedRoundCards = state.revealedRoundCards.map((rc) => ({
    ...rc, workerId: null,
  }));

  const players = Object.fromEntries(
    Object.entries(state.players).map(([id, p]) => [
      id,
      {
        ...p,
        workers: p.workers.map((w) => ({ ...w, actionSpaceId: null })),
        hasGrown: false,
      },
    ])
  );

  return { ...state, actionSpaces, revealedRoundCards, players, roundPhase: 'return_home' };
}

// ── 수확 ─────────────────────────────────────────────────────────

export function isHarvestRound(round: number): boolean {
  return HARVEST_ROUNDS.includes(round as typeof HARVEST_ROUNDS[number]);
}

/** 수확: 밭 수확 → 식량 공급 → 번식 순서 */
export function runHarvest(state: GameState): GameState {
  let newState = harvestFields(state);
  newState = feedFamily(newState);
  newState = breedAnimals(newState);
  return newState;
}

function harvestFields(state: GameState): GameState {
  // Phase 1 TODO: 밭에서 씨앗 1개씩 수확
  const players = Object.fromEntries(
    Object.entries(state.players).map(([id, player]) => {
      const harvestedGrain = player.farm.sownFields.filter((f) => f.resource === 'grain').length;
      const harvestedVeg   = player.farm.sownFields.filter((f) => f.resource === 'vegetable').length;

      const sownFields = player.farm.sownFields
        .map((f) => ({ ...f, count: f.count - 1 }))
        .filter((f) => f.count > 0);

      return [id, {
        ...player,
        farm: { ...player.farm, sownFields },
        resources: {
          ...player.resources,
          grain: player.resources.grain + harvestedGrain,
          vegetable: player.resources.vegetable + harvestedVeg,
        },
      }];
    })
  );
  return { ...state, players };
}

function feedFamily(state: GameState): GameState {
  // Phase 1 TODO: 가족 1인당 음식 2개 필요, 부족 시 구걸 토큰
  const players = Object.fromEntries(
    Object.entries(state.players).map(([id, player]) => {
      const needed = player.familySize * BEGGING_FOOD_PER_PERSON;
      const food = player.resources.food;
      const deficit = Math.max(0, needed - food);
      return [id, {
        ...player,
        resources: {
          ...player.resources,
          food: Math.max(0, food - needed),
        },
        beggingTokens: player.beggingTokens + deficit,
      }];
    })
  );
  return { ...state, players };
}

function breedAnimals(state: GameState): GameState {
  const ANIMAL_TYPES: AnimalType[] = ['sheep', 'boar', 'cattle'];
  const players = Object.fromEntries(
    Object.entries(state.players).map(([id, player]) => {
      let farm = player.farm;
      for (const animalType of ANIMAL_TYPES) {
        farm = breedAnimalType(farm, animalType);
      }
      return [id, { ...player, farm }];
    })
  );
  return { ...state, players };
}

/** 특정 동물 종 번식 처리 */
function breedAnimalType(farm: FarmBoard, type: AnimalType): FarmBoard {
  // 총 보유 수 계산
  const totalCount =
    farm.pastures.reduce((sum, p) => sum + (p.animals?.type === type ? p.animals.count : 0), 0) +
    farm.animalsInHouse.reduce((sum, a) => sum + (a.type === type ? a.count : 0), 0);

  if (totalCount < 2) return farm; // 2마리 미만: 번식 없음

  // 총 용량 계산 (해당 동물 타입 또는 빈 목장)
  const totalCapacity =
    farm.pastures.reduce((sum, p) => {
      if (p.animals === null || p.animals.type === type) return sum + p.capacity;
      return sum;
    }, 0) + 1; // +1: 집 안 1마리

  if (totalCount >= totalCapacity) return farm; // 용량 부족: 번식 없음

  // 새끼 1마리 배치 — 해당 타입 동물이 이미 있는 목장 우선, 그다음 빈 목장, 마지막으로 집
  const pastures = [...farm.pastures];
  let placed = false;

  // 1) 같은 타입 있고 여유 있는 목장
  for (let i = 0; i < pastures.length; i++) {
    const p = pastures[i]!;
    if (p.animals?.type === type && p.animals.count < p.capacity) {
      pastures[i] = { ...p, animals: { type, count: p.animals.count + 1 } };
      placed = true;
      break;
    }
  }

  // 2) 빈 목장
  if (!placed) {
    for (let i = 0; i < pastures.length; i++) {
      const p = pastures[i]!;
      if (p.animals === null) {
        pastures[i] = { ...p, animals: { type, count: 1 } };
        placed = true;
        break;
      }
    }
  }

  // 3) 집 안
  if (!placed) {
    const inHouse = farm.animalsInHouse.find((a) => a.type === type);
    const newInHouse = inHouse
      ? farm.animalsInHouse.map((a) => (a.type === type ? { ...a, count: a.count + 1 } : a))
      : [...farm.animalsInHouse, { type, count: 1 }];
    return { ...farm, pastures, animalsInHouse: newInHouse };
  }

  return { ...farm, pastures };
}

// ── 유틸리티 ─────────────────────────────────────────────────────

export function addResources(
  state: GameState,
  playerId: PlayerId,
  resources: Partial<Record<string, number>>,
): GameState {
  const player = state.players[playerId];
  if (!player) return state;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: Object.fromEntries(
          Object.entries(player.resources).map(([k, v]) => [
            k, v + (resources[k] ?? 0),
          ])
        ) as typeof player.resources,
      },
    },
  };
}

function addLog(
  state: GameState,
  entry: GameState['log'][number],
): GameState {
  return { ...state, log: [...state.log, entry] };
}

// ── 인터랙티브 행동 함수 ─────────────────────────────────────────

/** 밭 갈기: 빈 셀 → 밭 */
export function plowField(
  state: GameState,
  playerId: PlayerId,
  row: number,
  col: number,
): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  if (player.farm.grid[row]?.[col] !== 'empty') throw new Error(`Cannot plow (${row},${col})`);

  const grid = player.farm.grid.map((r, ri) =>
    r.map((c, ci): CellType => (ri === row && ci === col ? 'field' : c))
  );
  return updatePlayerFarm(state, playerId, { grid });
}

/** 씨 뿌리기: field 셀에 씨앗 추가 */
export function sowField(
  state: GameState,
  playerId: PlayerId,
  row: number,
  col: number,
  crop: 'grain' | 'vegetable',
): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  if (player.farm.grid[row]?.[col] !== 'field') throw new Error(`(${row},${col}) is not a field`);
  if (player.farm.sownFields.some((f) => f.row === row && f.col === col)) {
    throw new Error(`(${row},${col}) already sown`);
  }

  const resourceCost: Partial<Record<string, number>> = { [crop]: -1 };
  const sownFields = [...player.farm.sownFields, { row, col, resource: crop, count: 3 }];
  let newState = updatePlayerFarm(state, playerId, { sownFields });
  newState = addResources(newState, playerId, resourceCost);
  return newState;
}

/** 가족 늘리기: 방 남은 경우 (또는 긴급 시 방 없어도) */
export function growFamily(
  state: GameState,
  playerId: PlayerId,
  requireRoom: boolean,
): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  if (player.hasGrown) throw new Error(`${playerId} already grew this round`);
  if (player.familySize >= 5) throw new Error(`${playerId} family is already full (5)`);

  if (requireRoom) {
    const rooms = player.farm.grid.flat().filter(
      (c) => c === 'room_wood' || c === 'room_clay' || c === 'room_stone'
    ).length;
    if (rooms <= player.familySize) {
      throw new Error(`Need more rooms (rooms=${rooms}, family=${player.familySize})`);
    }
  }

  const newWorker = { playerId, actionSpaceId: null };
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        familySize: player.familySize + 1,
        workers: [...player.workers, newWorker],
        hasGrown: true,
      },
    },
  };
}

/** 집 개량: 방 재질 변경 (나무 → 점토 → 돌) */
export function renovateHouse(
  state: GameState,
  playerId: PlayerId,
): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);

  const currentMaterial = player.farm.grid.flat().find(
    (c) => c === 'room_wood' || c === 'room_clay' || c === 'room_stone'
  );
  if (!currentMaterial) throw new Error('No rooms to renovate');

  const nextMaterial: Record<string, CellType> = {
    room_wood: 'room_clay',
    room_clay: 'room_stone',
    room_stone: 'room_stone', // 이미 돌집 — 개량 불가
  };
  const target = nextMaterial[currentMaterial];
  if (target === currentMaterial) throw new Error('Already stone house');

  const rooms = player.farm.grid.flat().filter((c) => c === currentMaterial).length;
  const costMap: Record<string, Partial<Record<string, number>>> = {
    room_wood: { clay: -rooms, reed: -1 }, // 나무집 → 점토집: 점토 N + 갈대 1
    room_clay: { stone: -rooms, reed: -1 }, // 점토집 → 돌집: 돌 N + 갈대 1
  };
  const cost = costMap[currentMaterial] ?? {};

  const grid = player.farm.grid.map((r) =>
    r.map((c): CellType => (c === currentMaterial ? target : c))
  );
  let newState = updatePlayerFarm(state, playerId, { grid });
  newState = addResources(newState, playerId, cost);
  return newState;
}

/** 울타리 건설: 지정 울타리 세그먼트 추가 (나무 비용 1개/세그먼트) */
export function buildFences(
  state: GameState,
  playerId: PlayerId,
  segments: Array<{ type: 'h' | 'v'; row: number; col: number }>,
): GameState {
  if (segments.length === 0) return state;

  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);

  const woodCost = segments.length;
  if ((player.resources.wood ?? 0) < woodCost) {
    throw new Error(`Not enough wood (need ${woodCost}, have ${player.resources.wood})`);
  }

  const fences = {
    horizontal: player.farm.fences.horizontal.map((r) => [...r]),
    vertical: player.farm.fences.vertical.map((r) => [...r]),
  };
  for (const seg of segments) {
    if (seg.type === 'h') {
      fences.horizontal[seg.row]![seg.col] = true;
    } else {
      fences.vertical[seg.row]![seg.col] = true;
    }
  }

  const updatedFarm = recalculatePastures({ ...player.farm, fences });
  let newState = updatePlayerFarm(state, playerId, updatedFarm);
  newState = addResources(newState, playerId, { wood: -woodCost });
  return newState;
}

/** 방 건설: 빈 셀 클릭 → 현재 집 재질과 같은 방 추가 (재료 5 + 갈대 2) */
export function buildRoom(
  state: GameState,
  playerId: PlayerId,
  row: number,
  col: number,
): GameState {
  const player = state.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  if (player.farm.grid[row]?.[col] !== 'empty') throw new Error(`Cannot build room at (${row},${col})`);

  // 인접 셀 중 방이 있어야 함
  const dirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
  const hasAdjacentRoom = dirs.some(([dr, dc]) => {
    const cell = player.farm.grid[row + dr]?.[col + dc];
    return cell === 'room_wood' || cell === 'room_clay' || cell === 'room_stone';
  });
  if (!hasAdjacentRoom) throw new Error('새 방은 기존 방에 인접해야 합니다');

  // 현재 집 재질
  const currentMaterial = (player.farm.grid.flat().find(
    (c) => c === 'room_wood' || c === 'room_clay' || c === 'room_stone'
  ) ?? 'room_wood') as CellType;

  const costMap: Record<string, Partial<Record<string, number>>> = {
    room_wood:  { wood:  -5, reed: -2 },
    room_clay:  { clay:  -5, reed: -2 },
    room_stone: { stone: -5, reed: -2 },
  };
  const cost = costMap[currentMaterial] ?? {};
  const res = player.resources;
  if (currentMaterial === 'room_wood'  && (res.wood  ?? 0) < 5) throw new Error('나무 부족 (필요: 5)');
  if (currentMaterial === 'room_clay'  && (res.clay  ?? 0) < 5) throw new Error('점토 부족 (필요: 5)');
  if (currentMaterial === 'room_stone' && (res.stone ?? 0) < 5) throw new Error('돌 부족 (필요: 5)');
  if ((res.reed ?? 0) < 2) throw new Error('갈대 부족 (필요: 2)');

  const grid = player.farm.grid.map((r, ri) =>
    r.map((c, ci): CellType => (ri === row && ci === col ? currentMaterial : c))
  );
  let newState = updatePlayerFarm(state, playerId, { grid });
  newState = addResources(newState, playerId, cost);
  return newState;
}

// ── 유틸리티 ─────────────────────────────────────────────────────

function updatePlayerFarm(
  state: GameState,
  playerId: PlayerId,
  farmPatch: Partial<FarmBoard>,
): GameState {
  const player = state.players[playerId];
  if (!player) return state;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        farm: { ...player.farm, ...farmPatch },
      },
    },
  };
}

// 사용되지 않는 import 방지를 위한 re-export
export { PERMANENT_ACTION_SPACE_IDS };
