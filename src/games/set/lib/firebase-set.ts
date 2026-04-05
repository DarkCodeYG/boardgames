import { ref, set, get, update, remove, onValue, runTransaction, type Unsubscribe } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { SetRoomState, Theme, Lang, ResultType } from './types';
import { generateSeed, shuffleWithSeed, dealInitialCards } from './game-engine';

const roomRef = (code: string) => ref(db, `set/${code}`);

export function sanitizeName(name: string): string {
  return name.trim().replace(/[.#$[\]/]/g, '_');
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function createSetRoom(theme: Theme, lang: Lang): Promise<string> {
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const snap = await get(roomRef(code));
    if (!snap.exists()) break;
    code = generateRoomCode();
    attempts++;
  }
  const initial: SetRoomState = {
    phase: 'lobby',
    theme,
    lang,
    createdAt: Date.now(),
    tableCards: '[]',
    deckCards: '[]',
    currentTurn: null,
    players: {},
    lastResult: null,
  };
  await set(roomRef(code), initial);
  return code;
}

export async function joinSetRoom(
  code: string,
  name: string,
): Promise<{ joined: boolean; error?: 'not_found' | 'started' }> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return { joined: false, error: 'not_found' };
  const room = snap.val() as SetRoomState;
  if (room.phase !== 'lobby') return { joined: false, error: 'started' };

  const sanitized = sanitizeName(name);
  const playersRef = ref(db, `set/${code}/players`);
  await runTransaction(playersRef, (current) => {
    const players = (current || {}) as Record<string, unknown>;
    if (players[sanitized]) return players;
    return {
      ...players,
      [sanitized]: {
        displayName: name,
        joinedAt: Date.now(),
        collectedCards: '[]',
        bonusPoints: 0,
      },
    };
  });
  return { joined: true };
}

export async function startSetGame(code: string): Promise<void> {
  const seed = generateSeed();
  const allCards = Array.from({ length: 27 }, (_, i) => i);
  const shuffled = shuffleWithSeed(allCards, seed);
  const { tableCards, deckCards } = dealInitialCards(shuffled);
  await update(roomRef(code), {
    phase: 'playing',
    tableCards: JSON.stringify(tableCards),
    deckCards: JSON.stringify(deckCards),
    currentTurn: null,
    lastResult: null,
  });
}

export async function claimTurn(
  code: string,
  playerName: string,
  type: 'set' | 'gyul',
): Promise<boolean> {
  const turnRef = ref(db, `set/${code}/currentTurn`);
  let claimed = false;
  await runTransaction(turnRef, (current) => {
    claimed = false;
    if (current !== null) return;
    claimed = true;
    return { type, playerName, startedAt: Date.now() };
  });
  return claimed;
}

export async function resolveSetCorrect(
  code: string,
  room: SetRoomState,
  playerName: string,
  selectedCardIds: number[],
): Promise<void> {
  const tableCards = JSON.parse(room.tableCards) as number[];
  const deckCards = JSON.parse(room.deckCards) as number[];
  const sanitized = sanitizeName(playerName);
  const player = room.players[sanitized];
  const collectedCards = JSON.parse(player?.collectedCards ?? '[]') as number[];

  const newTableCards = tableCards.filter((id) => !selectedCardIds.includes(id));
  const newCollectedCards = [...collectedCards, ...selectedCardIds];
  const replenishCount = Math.min(3, deckCards.length);
  const finalTableCards = [...newTableCards, ...deckCards.slice(0, replenishCount)];
  const newDeckCards = deckCards.slice(replenishCount);

  await update(roomRef(code), {
    tableCards: JSON.stringify(finalTableCards),
    deckCards: JSON.stringify(newDeckCards),
    currentTurn: null,
    lastResult: { playerName, type: 'set_correct' as ResultType, timestamp: Date.now() },
    [`players/${sanitized}/collectedCards`]: JSON.stringify(newCollectedCards),
  });
}

export async function resolveSetWrong(
  code: string,
  room: SetRoomState,
  playerName: string,
  resultType: 'set_wrong' | 'set_timeout',
): Promise<void> {
  const tableCards = JSON.parse(room.tableCards) as number[];
  const sanitized = sanitizeName(playerName);
  const player = room.players[sanitized];
  const collectedCards = JSON.parse(player?.collectedCards ?? '[]') as number[];

  let newCollectedCards = collectedCards;
  let newTableCards = tableCards;
  if (collectedCards.length > 0) {
    const randIdx = Math.floor(Math.random() * collectedCards.length);
    const returned = collectedCards[randIdx];
    newCollectedCards = collectedCards.filter((_, i) => i !== randIdx);
    newTableCards = [...tableCards, returned];
  }

  await update(roomRef(code), {
    tableCards: JSON.stringify(newTableCards),
    currentTurn: null,
    lastResult: { playerName, type: resultType as ResultType, timestamp: Date.now() },
    [`players/${sanitized}/collectedCards`]: JSON.stringify(newCollectedCards),
  });
}

export async function resolveGyulCorrect(
  code: string,
  room: SetRoomState,
  playerName: string,
): Promise<void> {
  const deckCards = JSON.parse(room.deckCards) as number[];
  const tableCards = JSON.parse(room.tableCards) as number[];
  const sanitized = sanitizeName(playerName);
  const player = room.players[sanitized];
  const bonusPoints = (player?.bonusPoints ?? 0) + 2;

  if (deckCards.length === 0) {
    await update(roomRef(code), {
      phase: 'ended',
      currentTurn: null,
      lastResult: { playerName, type: 'gyul_correct' as ResultType, timestamp: Date.now() },
      [`players/${sanitized}/bonusPoints`]: bonusPoints,
    });
  } else {
    const addCount = Math.min(3, deckCards.length);
    const newDeckCards = deckCards.slice(addCount);
    const newTableCards = [...tableCards, ...deckCards.slice(0, addCount)];
    await update(roomRef(code), {
      tableCards: JSON.stringify(newTableCards),
      deckCards: JSON.stringify(newDeckCards),
      currentTurn: null,
      lastResult: { playerName, type: 'gyul_correct' as ResultType, timestamp: Date.now() },
      [`players/${sanitized}/bonusPoints`]: bonusPoints,
    });
  }
}

export async function resolveGyulWrong(
  code: string,
  room: SetRoomState,
  playerName: string,
): Promise<void> {
  const tableCards = JSON.parse(room.tableCards) as number[];
  const sanitized = sanitizeName(playerName);
  const player = room.players[sanitized];
  const collectedCards = JSON.parse(player?.collectedCards ?? '[]') as number[];

  let newCollectedCards = collectedCards;
  let newTableCards = tableCards;
  if (collectedCards.length > 0) {
    const randIdx = Math.floor(Math.random() * collectedCards.length);
    const returned = collectedCards[randIdx];
    newCollectedCards = collectedCards.filter((_, i) => i !== randIdx);
    newTableCards = [...tableCards, returned];
  }

  await update(roomRef(code), {
    tableCards: JSON.stringify(newTableCards),
    currentTurn: null,
    lastResult: { playerName, type: 'gyul_wrong' as ResultType, timestamp: Date.now() },
    [`players/${sanitized}/collectedCards`]: JSON.stringify(newCollectedCards),
  });
}

export function subscribeSetRoom(
  code: string,
  cb: (state: SetRoomState | null) => void,
): Unsubscribe {
  return onValue(roomRef(code), (snap) => cb(snap.val() as SetRoomState | null));
}

export async function updateSetLang(code: string, lang: string): Promise<void> {
  await update(roomRef(code), { lang });
}

export async function deleteSetRoom(code: string): Promise<void> {
  await remove(roomRef(code));
}

export async function resetSetRoom(code: string, room: SetRoomState): Promise<void> {
  const seed = generateSeed();
  const allCards = Array.from({ length: 27 }, (_, i) => i);
  const shuffled = shuffleWithSeed(allCards, seed);
  const { tableCards, deckCards } = dealInitialCards(shuffled);

  const resetPlayers: Record<string, unknown> = {};
  for (const [key, player] of Object.entries(room.players || {})) {
    resetPlayers[key] = {
      displayName: player.displayName,
      joinedAt: player.joinedAt,
      collectedCards: '[]',
      bonusPoints: 0,
    };
  }

  await set(roomRef(code), {
    phase: 'lobby',
    theme: room.theme,
    lang: room.lang,
    createdAt: room.createdAt,
    tableCards: JSON.stringify(tableCards),
    deckCards: JSON.stringify(deckCards),
    currentTurn: null,
    players: resetPlayers,
    lastResult: null,
  });
}
