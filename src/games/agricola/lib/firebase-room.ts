/**
 * Agricola 온라인 모드 Firebase RTDB 연동
 *
 * 경로 구조:
 *   rooms/{code}/
 *     meta                       RoomMeta
 *     lobby/{pid}                LobbyPlayer
 *     gameState                  GameState (호스트만 write)
 *     privateHands/{pid}         PrivateHand (본인 + 호스트만 read)
 *     actions/{pushKey}          ActionQueueItem (클라이언트 push, 호스트 처리)
 *
 * 권위 모델: 호스트가 actions 큐를 onChildAdded 로 구독 → 엔진 검증 → gameState update.
 */

import {
  ref, set, get, push, onValue, onChildAdded,
  update, remove, runTransaction, onDisconnect,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { db } from '../../../lib/firebase';
import type {
  RoomMeta,
  LobbyPlayer,
  ActionQueueItem,
  RoomSnapshot,
  GameState,
  PrivateHand,
  PlayerId,
  Lang,
} from './types';

// ── 경로 헬퍼 ─────────────────────────────────────────────────────

const roomRef       = (code: string)              => ref(db, `rooms/${code}`);
const metaRef       = (code: string)              => ref(db, `rooms/${code}/meta`);
const lobbyRef      = (code: string)              => ref(db, `rooms/${code}/lobby`);
const lobbyPlayerRef = (code: string, pid: string) => ref(db, `rooms/${code}/lobby/${pid}`);
const gameStateRef  = (code: string)              => ref(db, `rooms/${code}/gameState`);
const privateHandRef = (code: string, pid: string)=> ref(db, `rooms/${code}/privateHands/${pid}`);
const actionsRef    = (code: string)              => ref(db, `rooms/${code}/actions`);
const actionRef     = (code: string, aid: string) => ref(db, `rooms/${code}/actions/${aid}`);

// ── 유틸 ──────────────────────────────────────────────────────────

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ── 호스트: 방 생성 ───────────────────────────────────────────────

export async function createRoom(config: {
  hostSessionId: string;
  desiredPlayerCount: 2 | 3 | 4;
  lang: Lang;
}): Promise<string> {
  let code = generateRoomCode();
  for (let i = 0; i < 10; i++) {
    const snap = await get(roomRef(code));
    if (!snap.exists()) break;
    code = generateRoomCode();
  }

  const meta: RoomMeta = {
    game: 'agricola',
    createdAt: Date.now(),
    phase: 'lobby',
    hostSessionId: config.hostSessionId,
    hostConnected: true,
    desiredPlayerCount: config.desiredPlayerCount,
    lang: config.lang,
  };

  await set(roomRef(code), {
    meta,
    lobby: {},
    gameState: null,
  });

  // 호스트 디스커넥트 감지 → hostConnected: false
  try {
    await onDisconnect(metaRef(code)).update({ hostConnected: false });
  } catch {
    // 오프라인 등에서 실패해도 방 생성은 성립
  }

  return code;
}

// ── 플레이어: 방 참가 (transaction) ────────────────────────────────

export type JoinResult =
  | { ok: true; pid: PlayerId; reconnected: boolean }
  | { ok: false; error: 'not_found' | 'full' | 'already_started' };

const COLORS: Array<LobbyPlayer['color']> = ['red', 'blue', 'green', 'yellow'];

export async function joinRoom(code: string, name: string): Promise<JoinResult> {
  const metaSnap = await get(metaRef(code));
  if (!metaSnap.exists()) return { ok: false, error: 'not_found' };

  const meta = metaSnap.val() as RoomMeta;
  if (meta.phase !== 'lobby') {
    // 재접속 허용 — 이미 참가한 이름이면 해당 pid 반환
    const lobbySnap = await get(lobbyRef(code));
    const lobby = (lobbySnap.val() ?? {}) as Record<string, LobbyPlayer>;
    const existing = Object.entries(lobby).find(([, p]) => p.name === name);
    if (existing) {
      await update(lobbyPlayerRef(code, existing[0]), { connected: true });
      return { ok: true, pid: existing[0], reconnected: true };
    }
    return { ok: false, error: 'already_started' };
  }

  const maxPlayers = meta.desiredPlayerCount;
  let resolvedPid: string | null = null;
  let resultError: 'full' | null = null;

  await runTransaction(lobbyRef(code), (currentLobby) => {
    const lobby = (currentLobby ?? {}) as Record<string, LobbyPlayer>;

    // 재접속: 같은 이름이면 connected 만 갱신
    const existing = Object.entries(lobby).find(([, p]) => p.name === name);
    if (existing) {
      resolvedPid = existing[0];
      return { ...lobby, [existing[0]]: { ...existing[1], connected: true } };
    }

    if (Object.keys(lobby).length >= maxPlayers) {
      resultError = 'full';
      return;
    }

    // 사용 중이 아닌 첫 색상 할당
    const usedColors = new Set(Object.values(lobby).map((p) => p.color));
    const color = COLORS.find((c) => !usedColors.has(c)) ?? 'red';

    const pid = `p${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
    const newPlayer: LobbyPlayer = {
      pid,
      name,
      color,
      ready: false,
      joinedAt: Date.now(),
      connected: true,
    };
    resolvedPid = pid;
    return { ...lobby, [pid]: newPlayer };
  });

  if (resultError) return { ok: false, error: resultError };
  if (!resolvedPid) return { ok: false, error: 'not_found' };

  // 해당 플레이어 디스커넥트 시 connected: false
  try {
    await onDisconnect(lobbyPlayerRef(code, resolvedPid)).update({ connected: false });
  } catch {
    // 네트워크 이슈 무시
  }

  return { ok: true, pid: resolvedPid, reconnected: false };
}

// ── 플레이어: 로비 정보 갱신 (색상 변경 등) ────────────────────────

export async function updateLobbyPlayer(
  code: string,
  pid: PlayerId,
  patch: Partial<LobbyPlayer>,
): Promise<void> {
  await update(lobbyPlayerRef(code, pid), patch);
}

// ── 호스트: 게임 시작 (gameState write) ────────────────────────────

export async function startGame(
  code: string,
  gameState: GameState,
  privateHands: Record<PlayerId, PrivateHand>,
): Promise<void> {
  await update(roomRef(code), {
    'meta/phase': 'playing',
    gameState,
    privateHands,
  });
}

// ── 호스트: 게임 상태 부분 업데이트 ────────────────────────────────

export async function updateGameState(code: string, nextState: GameState): Promise<void> {
  await set(gameStateRef(code), nextState);
}

export async function updatePrivateHand(
  code: string,
  pid: PlayerId,
  hand: PrivateHand,
): Promise<void> {
  await set(privateHandRef(code, pid), hand);
}

// ── 클라이언트: 액션 제출 ──────────────────────────────────────────

export async function submitAction(
  code: string,
  action: Omit<ActionQueueItem, 'id' | 'status' | 'createdAt'>,
): Promise<string> {
  const newRef = push(actionsRef(code));
  const item: ActionQueueItem = {
    ...action,
    status: 'pending',
    createdAt: Date.now(),
  };
  await set(newRef, item);
  return newRef.key!;
}

// ── 호스트: 액션 큐 처리 결과 쓰기 ─────────────────────────────────

export async function markActionApplied(code: string, actionId: string): Promise<void> {
  await update(actionRef(code, actionId), {
    status: 'applied',
    appliedAt: Date.now(),
  });
}

export async function markActionRejected(
  code: string,
  actionId: string,
  reason: string,
): Promise<void> {
  await update(actionRef(code, actionId), {
    status: 'rejected',
    reason,
    appliedAt: Date.now(),
  });
}

// ── 구독 ──────────────────────────────────────────────────────────

/** 호스트/클라이언트 공통: 방 전체 스냅샷 (onValue) */
export function subscribeRoom(
  code: string,
  callback: (snapshot: RoomSnapshot | null) => void,
): Unsubscribe {
  return onValue(roomRef(code), (snap) => {
    const v = snap.val() as RoomSnapshot | null;
    callback(v);
  });
}

/** 호스트 전용: 새 액션이 들어올 때마다 콜백 */
export function subscribeActions(
  code: string,
  callback: (actionId: string, action: ActionQueueItem) => void,
): Unsubscribe {
  return onChildAdded(actionsRef(code), (snap) => {
    const key = snap.key;
    const v = snap.val() as ActionQueueItem | null;
    if (!key || !v) return;
    // 이미 처리된 액션은 스킵 (재접속 시 과거 액션 재발화 방지)
    if (v.status !== 'pending') return;
    callback(key, v);
  });
}

// ── 정리 ──────────────────────────────────────────────────────────

export async function deleteRoom(code: string): Promise<void> {
  await remove(roomRef(code));
}

export async function endGame(code: string): Promise<void> {
  await update(metaRef(code), { phase: 'ended' });
}

/** 호스트 heartbeat — 주기적으로 hostConnected 재확인 */
export async function hostHeartbeat(code: string): Promise<void> {
  await update(metaRef(code), { hostConnected: true, lastHeartbeat: serverTimestamp() });
}

/** 1시간 이상 된 오래된 방 정리 */
export async function cleanupOldRooms(): Promise<void> {
  const allRoomsRef = ref(db, 'rooms');
  const snap = await get(allRoomsRef);
  if (!snap.exists()) return;

  const rooms = snap.val() as Record<string, { meta?: RoomMeta }>;
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [code, room] of Object.entries(rooms)) {
    if (!room.meta?.createdAt || room.meta.createdAt < cutoff) {
      await remove(ref(db, `rooms/${code}`));
    }
  }
}
