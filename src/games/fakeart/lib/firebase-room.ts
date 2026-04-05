import { ref, set, get, update, onValue, runTransaction, type Unsubscribe } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { RoomState, Pack, Lang } from './types';

const roomRef = (code: string) => ref(db, `fakeart/${code}`);

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

/** 호스트: 방 생성 */
export async function createFakeartRoom(
  seed: string,
  pack: Pack,
  lang: Lang,
  drawTime: number,
): Promise<string> {
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const snap = await get(roomRef(code));
    if (!snap.exists()) break;
    code = generateRoomCode();
    attempts++;
  }
  const initial: RoomState = {
    phase: 'lobby',
    seed,
    pack,
    lang,
    drawTime,
    players: {},
    playerCount: 0,
    currentDrawerIndex: 0,
    votes: {},
    fakeGuess: '',
    winner: null,
  };
  await set(roomRef(code), initial);
  return code;
}

/** 플레이어: 방 참가.
 *  - 같은 이름 + 토큰 일치 → 재접속(reconnect: true)
 *  - 같은 이름 + 토큰 불일치/없음 → pre-fill만 (reconnect: false)
 *  - 새 이름 → 신규 참가, deviceToken 발급
 */
export async function joinFakeartRoom(
  code: string,
  name: string,
  deviceToken?: string,
): Promise<{ index: number; deviceToken: string; reconnect: boolean } | { error: 'not_found' | 'started' }> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return { error: 'not_found' };
  const room = snap.val() as RoomState;

  // 기존 플레이어 → 토큰 일치 여부로 진짜 재접속 판단
  if (room.players?.[name]) {
    const stored = room.players[name].deviceToken;
    const isReconnect = !!deviceToken && !!stored && deviceToken === stored;
    return {
      index: room.players[name].index,
      deviceToken: stored ?? deviceToken ?? '',
      reconnect: isReconnect,
    };
  }

  // 새 참가자는 로비에서만 가능
  if (room.phase !== 'lobby') return { error: 'started' };

  const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const playersRef = ref(db, `fakeart/${code}/players`);
  let resultIndex = -1;

  await runTransaction(playersRef, (current) => {
    const players = (current || {}) as Record<string, { index: number; joinedAt: number; deviceToken?: string }>;

    if (players[name]) {
      resultIndex = players[name].index;
      return players; // no change (race condition 방어)
    }

    const nextIndex = Object.keys(players).length;
    resultIndex = nextIndex;
    return { ...players, [name]: { index: nextIndex, joinedAt: Date.now(), deviceToken: newToken } };
  });

  return { index: resultIndex, deviceToken: newToken, reconnect: false };
}

export async function updateFakeartRoom(code: string, data: Partial<RoomState>): Promise<void> {
  await update(roomRef(code), data as Record<string, unknown>);
}

export function subscribeFakeartRoom(
  code: string,
  cb: (state: RoomState | null) => void,
): Unsubscribe {
  return onValue(roomRef(code), (snap) => cb(snap.val() as RoomState | null));
}

export async function submitVote(
  code: string,
  voterIndex: number,
  accusedIndex: number,
): Promise<void> {
  await set(ref(db, `fakeart/${code}/votes/${voterIndex}`), accusedIndex);
}

export async function submitFakeGuess(code: string, guess: string): Promise<void> {
  await set(ref(db, `fakeart/${code}/fakeGuess`), guess);
}

export async function setWinner(code: string, winner: 'fake' | 'others'): Promise<void> {
  await update(roomRef(code), { winner, phase: 'result' });
}
