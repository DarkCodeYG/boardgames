import { ref, set, get, onValue, update, remove, runTransaction, type Unsubscribe } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { GameState, SpecialRole } from './types';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

const roomRef = (code: string) => ref(db, `rooms/${code}`);
const playerRef = (code: string, pid: string) => ref(db, `rooms/${code}/players/${pid}`);

/** 호스트: 방 생성 (기존 방 충돌 방지) */
export async function createRoom(enabledRoles: SpecialRole[], maxPlayers?: number): Promise<string> {
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const snapshot = await get(roomRef(code));
    if (!snapshot.exists()) break;
    code = generateRoomCode();
    attempts++;
  }
  await set(roomRef(code), {
    phase: 'lobby',
    enabledRoles: enabledRoles.filter(r => r !== null),
    maxPlayers: maxPlayers || 12,
    players: {},
    createdAt: Date.now(),
  });
  return code;
}

/** 플레이어: 방 참가 (Transaction으로 원자적 중복/초과 체크) */
export async function joinRoom(code: string, name: string): Promise<{ pid: string } | { error: 'not_found' | 'duplicate' | 'full' | 'reconnect'; pid?: string }> {
  const pid = `p${Date.now().toString(36)}`;
  let resultError: 'not_found' | 'duplicate' | 'full' | 'reconnect' | null = null;
  let reconnectPid: string | undefined;

  const playersRef = ref(db, `rooms/${code}/players`);

  // 먼저 방 존재 + maxPlayers 확인 (읽기 전용)
  const roomSnapshot = await get(roomRef(code));
  if (!roomSnapshot.exists()) return { error: 'not_found' };
  const maxPlayers = (roomSnapshot.val().maxPlayers as number) || 12;

  // Transaction으로 players에 원자적 추가
  await runTransaction(playersRef, (currentPlayers) => {
    const players = (currentPlayers || {}) as Record<string, { name: string; connected?: boolean }>;

    // 같은 이름 → 재접속
    const existing = Object.entries(players).find(([, p]) => p.name === name);
    if (existing) {
      resultError = 'reconnect';
      reconnectPid = existing[0];
      return; // abort transaction
    }

    // 인원 초과
    if (Object.keys(players).length >= maxPlayers) {
      resultError = 'full';
      return; // abort transaction
    }

    // 추가
    return { ...players, [pid]: { name, connected: true } };
  });

  if (resultError === 'reconnect') return { error: 'reconnect', pid: reconnectPid };
  if (resultError) return { error: resultError };
  return { pid };
}

/** 플레이어: 방 나가기 */
export async function leaveRoom(code: string, pid: string): Promise<void> {
  await remove(playerRef(code, pid));
}

/** 호스트: 게임 상태 전체 업데이트 */
export async function updateGameState(code: string, state: Partial<GameState & { [key: string]: unknown }>): Promise<void> {
  await update(roomRef(code), state);
}

/** 호스트: 게임 상태 전체 덮어쓰기 */
export async function setGameState(code: string, data: Record<string, unknown>): Promise<void> {
  await set(roomRef(code), data);
}

/** 투표/봉사 결과 제출 */
export async function submitAction(code: string, path: string, value: unknown): Promise<void> {
  await set(ref(db, `rooms/${code}/${path}`), value);
}

/** 방 상태 구독 */
export function subscribeRoom(code: string, callback: (data: Record<string, unknown> | null) => void): Unsubscribe {
  return onValue(roomRef(code), (snapshot) => {
    callback(snapshot.val());
  });
}

/** 방 존재 확인 */
export async function roomExists(code: string): Promise<boolean> {
  const snapshot = await get(roomRef(code));
  return snapshot.exists();
}

/** 방 삭제 */
export async function deleteRoom(code: string): Promise<void> {
  await remove(roomRef(code));
}

/** 같은 방/플레이어 유지, 게임 상태만 초기화 (다시 하기용) */
export async function resetRoomForNewGame(code: string): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const current = snap.val() as Record<string, unknown>;
  await set(roomRef(code), {
    phase: 'lobby',
    enabledRoles: current.enabledRoles ?? [],
    maxPlayers: current.maxPlayers ?? 12,
    players: current.players ?? {},
    createdAt: current.createdAt ?? Date.now(),
  });
}

/** 1시간 이상 된 오래된 방 정리 (백그라운드) */
export async function cleanupOldRooms(): Promise<void> {
  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);
  if (!snapshot.exists()) return;

  const rooms = snapshot.val() as Record<string, { createdAt?: number }>;
  const cutoff = Date.now() - 60 * 60 * 1000; // 1시간

  for (const [code, room] of Object.entries(rooms)) {
    if (!room.createdAt || room.createdAt < cutoff) {
      await remove(ref(db, `rooms/${code}`));
    }
  }
}
