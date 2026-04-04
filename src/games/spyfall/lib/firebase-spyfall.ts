import { ref, set, get, onValue, update, remove, runTransaction, type Unsubscribe } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { Lang } from '../../codenames/lib/i18n';
import type { WordPack } from '../../codenames/lib/words';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/[.#$[\]/]/g, '_');
}

export interface SpyfallPlayer {
  joinedAt: number;
}

export interface SpyfallRoom {
  phase: 'lobby' | 'playing';
  seed?: string;
  pack: WordPack;
  lang: Lang;
  roundMinutes: number;
  playerCount?: number;
  startedAt?: number;
  players: Record<string, SpyfallPlayer>;
  createdAt: number;
}

const spyfallRef = (code: string) => ref(db, `spyfall/${code}`);

const FIREBASE_TIMEOUT = 10000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout')), FIREBASE_TIMEOUT),
    ),
  ]);
}

export async function createSpyfallRoom(
  pack: WordPack,
  lang: Lang,
  roundMinutes: number,
): Promise<string> {
  let code = generateCode();
  for (let i = 0; i < 10; i++) {
    const snap = await withTimeout(get(spyfallRef(code)));
    if (!snap.exists()) break;
    code = generateCode();
  }
  await withTimeout(set(spyfallRef(code), {
    phase: 'lobby',
    pack,
    lang,
    roundMinutes,
    players: {},
    createdAt: Date.now(),
  }));
  return code;
}

export async function joinSpyfallRoom(
  code: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: 'not_found' | 'duplicate' | 'already_playing' }> {
  const snap = await get(spyfallRef(code));
  if (!snap.exists()) return { ok: false, error: 'not_found' };
  const room = snap.val() as SpyfallRoom;

  const key = sanitizeName(name);

  // 기존 플레이어 재접속 (phase 무관)
  if (room.players?.[key]) return { ok: true };

  // 새 참가자는 로비에서만 가능
  if (room.phase === 'playing') return { ok: false, error: 'already_playing' };
  let isDuplicate = false;

  await runTransaction(ref(db, `spyfall/${code}/players`), (currentPlayers) => {
    const players = (currentPlayers || {}) as Record<string, SpyfallPlayer>;
    if (players[key]) {
      isDuplicate = true;
      return undefined;
    }
    return { ...players, [key]: { joinedAt: Date.now() } };
  });

  if (isDuplicate) return { ok: false, error: 'duplicate' };
  return { ok: true };
}

export async function startSpyfallRound(code: string): Promise<void> {
  const snap = await get(ref(db, `spyfall/${code}/players`));
  const players = (snap.val() as Record<string, SpyfallPlayer>) || {};
  const playerCount = Object.keys(players).length;
  const seed = generateSeed();
  await update(spyfallRef(code), {
    phase: 'playing',
    seed,
    playerCount,
    startedAt: Date.now(),
  });
}

export async function resetSpyfallToLobby(code: string): Promise<void> {
  await update(spyfallRef(code), {
    phase: 'lobby',
    seed: null,
    playerCount: null,
    startedAt: null,
  });
}

export async function updateSpyfallSettings(
  code: string,
  settings: Partial<Pick<SpyfallRoom, 'roundMinutes' | 'pack' | 'lang'>>,
): Promise<void> {
  await update(spyfallRef(code), settings);
}

export function subscribeSpyfallRoom(
  code: string,
  callback: (data: SpyfallRoom | null) => void,
): Unsubscribe {
  return onValue(spyfallRef(code), (snap) => {
    callback(snap.val() as SpyfallRoom | null);
  });
}

export async function deleteSpyfallRoom(code: string): Promise<void> {
  await remove(spyfallRef(code));
}
