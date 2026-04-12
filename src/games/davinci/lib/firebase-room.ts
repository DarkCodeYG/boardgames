import { ref, set, get, update, remove, onValue, runTransaction, type Unsubscribe } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { RoomState, PlayerState, Tile, Lang } from './types';
import { createDeck, shuffleDeck, tileCompare, insertTileAt, getInitialTileCount } from './game-engine';

const roomRef = (code: string) => ref(db, `davinci/${code}`);

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function createDavinciRoom(lang: Lang): Promise<string> {
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
    lang,
    players: {},
    playerOrder: [],
    deck: [],
    currentTurnIndex: 0,
    turnState: 'draw',
    drawnTileIndex: null,
    pendingDrawnTile: null,
    guessStartedAt: null,
    pendingGuess: null,
    lastResult: null,
    winner: null,
  };
  await set(roomRef(code), initial);
  return code;
}

export async function joinDavinciRoom(
  code: string,
  name: string,
): Promise<{ ok: true } | { error: 'not_found' | 'started' }> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return { error: 'not_found' };
  const room = snap.val() as RoomState;

  if (room.players?.[name]) return { ok: true };
  if (room.phase !== 'lobby') return { error: 'started' };

  const playersRef = ref(db, `davinci/${code}/players`);
  await runTransaction(playersRef, (current) => {
    const players = (current ?? {}) as Record<string, unknown>;
    if (players[name]) return players;
    return { ...players, [name]: { joinedAt: Date.now(), eliminated: false, tiles: [] } };
  });

  return { ok: true };
}

export async function startDavinciGame(code: string, seed: string): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.val() as RoomState;

  const playerOrder = Object.entries(room.players)
    .sort(([, a], [, b]) => (a as PlayerState).joinedAt - (b as PlayerState).joinedAt)
    .map(([name]) => name);

  const playerCount = playerOrder.length;
  const tilesPerPlayer = getInitialTileCount(playerCount);

  let deck = createDeck();
  deck = shuffleDeck(deck, seed);

  const players = { ...room.players };
  for (const name of playerOrder) {
    const hand: Tile[] = [];
    for (let i = 0; i < tilesPerPlayer; i++) {
      hand.push(deck.shift()!);
    }
    hand.sort(tileCompare);
    players[name] = { ...players[name], tiles: hand, eliminated: false };
  }

  await update(roomRef(code), {
    phase: 'playing',
    playerOrder,
    deck,
    players,
    currentTurnIndex: 0,
    turnState: 'draw',
    drawnTileIndex: null,
    pendingDrawnTile: null,
    pendingGuess: null,
    lastResult: null,
    winner: null,
  });
}

export async function drawTile(code: string): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.val() as RoomState;

  const deck = [...(room.deck ?? [])];
  if (!deck.length) return;

  const drawn = deck.shift()!;

  await update(roomRef(code), {
    deck,
    pendingDrawnTile: drawn,
    turnState: 'placing',
    drawnTileIndex: null,
    guessStartedAt: null,
  });
}

export async function confirmTilePlacement(code: string, insertIndex: number): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.val() as RoomState;

  const pendingTile = room.pendingDrawnTile;
  if (!pendingTile) return;

  const currentPlayerName = room.playerOrder[room.currentTurnIndex];
  const currentPlayer = room.players[currentPlayerName];
  if (!currentPlayer) return;

  const newTiles = insertTileAt(currentPlayer.tiles ?? [], pendingTile, insertIndex);

  await update(roomRef(code), {
    [`players/${currentPlayerName}/tiles`]: newTiles,
    pendingDrawnTile: null,
    drawnTileIndex: insertIndex,
    turnState: 'guess',
    guessStartedAt: Date.now(),
  });
}

export async function skipDraw(code: string): Promise<void> {
  await update(roomRef(code), { turnState: 'guess', drawnTileIndex: null, guessStartedAt: Date.now() });
}

export async function setPendingGuess(code: string, targetId: string, tileIndex: number): Promise<void> {
  await update(roomRef(code), { pendingGuess: { targetId, tileIndex } });
}

export async function clearPendingGuess(code: string): Promise<void> {
  await update(roomRef(code), { pendingGuess: null });
}

export async function submitGuess(
  code: string,
  targetId: string,
  tileIndex: number,
  guessedNumber: number,
): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.val() as RoomState;

  const targetPlayer = room.players[targetId];
  const targetTile = targetPlayer?.tiles?.[tileIndex];
  if (!targetPlayer || !targetTile) return;

  const correct = targetTile.number === guessedNumber;

  const lastResult = {
    correct,
    targetId,
    tileIndex,
    guessedNumber,
    actualNumber: targetTile.number,
  };

  if (correct) {
    const newTiles = (targetPlayer.tiles ?? []).map((t, i) =>
      i === tileIndex ? { ...t, revealed: true } : t,
    );
    const eliminated = newTiles.every((t) => t.revealed);

    const updatedPlayers = {
      ...room.players,
      [targetId]: { ...room.players[targetId], tiles: newTiles, eliminated },
    };
    const activePlayers = room.playerOrder.filter((n) => !updatedPlayers[n].eliminated);
    const winner = activePlayers.length <= 1 ? (activePlayers[0] ?? null) : null;

    await update(roomRef(code), {
      [`players/${targetId}/tiles`]: newTiles,
      [`players/${targetId}/eliminated`]: eliminated,
      lastResult,
      pendingGuess: null,
      turnState: 'result',
      ...(winner !== null ? { winner, phase: 'gameover' } : {}),
    });
  } else {
    const currentPlayerName = room.playerOrder[room.currentTurnIndex];
    const drawnTileIndex = room.drawnTileIndex;
    const updates: Record<string, unknown> = {
      lastResult,
      pendingGuess: null,
      turnState: 'result',
    };

    if (drawnTileIndex !== null && room.players[currentPlayerName]?.tiles) {
      const currentTiles = room.players[currentPlayerName].tiles.map((t, i) =>
        i === drawnTileIndex ? { ...t, revealed: true } : t,
      );
      const currentEliminated = currentTiles.every((t) => t.revealed);
      updates[`players/${currentPlayerName}/tiles`] = currentTiles;
      if (currentEliminated) {
        updates[`players/${currentPlayerName}/eliminated`] = true;

        const updatedPlayers = { ...room.players, [currentPlayerName]: { ...room.players[currentPlayerName], eliminated: true } };
        const activePlayers = room.playerOrder.filter((n) => !updatedPlayers[n].eliminated);
        const winner = activePlayers.length <= 1 ? (activePlayers[0] ?? null) : null;
        if (winner !== null) {
          updates.winner = winner;
          updates.phase = 'gameover';
        }
      }
    }

    await update(roomRef(code), updates);
  }
}

export async function continueGuessing(code: string): Promise<void> {
  await update(roomRef(code), {
    turnState: 'guess',
    pendingGuess: null,
    lastResult: null,
    guessStartedAt: Date.now(),
  });
}

function getNextPlayerIndex(room: RoomState): number {
  const playerCount = room.playerOrder.length;
  let nextIndex = (room.currentTurnIndex + 1) % playerCount;
  for (let i = 0; i < playerCount; i++) {
    if (!room.players[room.playerOrder[nextIndex]]?.eliminated) break;
    nextIndex = (nextIndex + 1) % playerCount;
  }
  return nextIndex;
}

export async function endTurn(code: string): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.val() as RoomState;

  await update(roomRef(code), {
    currentTurnIndex: getNextPlayerIndex(room),
    turnState: 'draw',
    drawnTileIndex: null,
    pendingDrawnTile: null,
    guessStartedAt: null,
    pendingGuess: null,
    lastResult: null,
  });
}

/** 추측 시간 초과 — 뽑은 타일 공개 후 턴 종료 (오답 패널티와 동일) */
export async function forfeitTurn(code: string): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.val() as RoomState;

  const currentPlayerName = room.playerOrder[room.currentTurnIndex];
  const drawnTileIndex = room.drawnTileIndex;

  const updates: Record<string, unknown> = {
    currentTurnIndex: getNextPlayerIndex(room),
    turnState: 'draw',
    drawnTileIndex: null,
    pendingDrawnTile: null,
    guessStartedAt: null,
    pendingGuess: null,
    lastResult: null,
  };

  if (drawnTileIndex !== null && room.players[currentPlayerName]?.tiles) {
    const newTiles = room.players[currentPlayerName].tiles.map((t, i) =>
      i === drawnTileIndex ? { ...t, revealed: true } : t,
    );
    const eliminated = newTiles.every((t) => t.revealed);
    updates[`players/${currentPlayerName}/tiles`] = newTiles;
    if (eliminated) {
      updates[`players/${currentPlayerName}/eliminated`] = true;
      const updatedPlayers = { ...room.players, [currentPlayerName]: { ...room.players[currentPlayerName], eliminated: true } };
      const activePlayers = room.playerOrder.filter((n) => !updatedPlayers[n].eliminated);
      const winner = activePlayers.length <= 1 ? (activePlayers[0] ?? null) : null;
      if (winner !== null) { updates.winner = winner; updates.phase = 'gameover'; }
    }
  }

  await update(roomRef(code), updates);
}

export function subscribeDavinciRoom(
  code: string,
  cb: (state: RoomState | null) => void,
): Unsubscribe {
  return onValue(roomRef(code), (snap) => cb(snap.val() as RoomState | null));
}

export async function deleteDavinciRoom(code: string): Promise<void> {
  await remove(roomRef(code));
}

export async function resetDavinciRoom(code: string): Promise<void> {
  const snap = await get(roomRef(code));
  if (!snap.exists()) return;
  const current = snap.val() as RoomState;

  const resetPlayers: Record<string, unknown> = {};
  for (const name of Object.keys(current.players)) {
    resetPlayers[name] = { joinedAt: current.players[name].joinedAt, eliminated: false, tiles: [] };
  }

  await set(roomRef(code), {
    phase: 'lobby',
    lang: current.lang,
    players: resetPlayers,
    playerOrder: [],
    deck: [],
    currentTurnIndex: 0,
    turnState: 'draw',
    drawnTileIndex: null,
    pendingDrawnTile: null,
    guessStartedAt: null,
    pendingGuess: null,
    lastResult: null,
    winner: null,
  });
}

