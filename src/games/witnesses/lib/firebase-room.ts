import { ref, set, get, onValue, update, remove, type Unsubscribe } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { GameState, SpecialRole } from './types';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

const roomRef = (code: string) => ref(db, `rooms/${code}`);
const playerRef = (code: string, pid: string) => ref(db, `rooms/${code}/players/${pid}`);

/** 호스트: 방 생성 */
export async function createRoom(enabledRoles: SpecialRole[]): Promise<string> {
  const code = generateRoomCode();
  await set(roomRef(code), {
    phase: 'lobby',
    enabledRoles: enabledRoles.filter(r => r !== null),
    players: {},
    createdAt: Date.now(),
  });
  return code;
}

/** 플레이어: 방 참가 */
export async function joinRoom(code: string, name: string): Promise<string | null> {
  const snapshot = await get(roomRef(code));
  if (!snapshot.exists()) return null;

  const pid = `p${Date.now().toString(36)}`;
  await set(playerRef(code, pid), {
    name,
    connected: true,
  });
  return pid;
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
