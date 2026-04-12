import seedrandom from 'seedrandom';
import type { Tile, TileColor } from './types';

export const JOKER_NUMBER = 12;

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createDeck(): Tile[] {
  const tiles: Tile[] = [];
  for (const color of ['black', 'white'] as TileColor[]) {
    for (let n = 0; n <= 11; n++) {
      tiles.push({ number: n, color, revealed: false });
    }
  }
  tiles.push({ number: JOKER_NUMBER, color: 'black', revealed: false });
  tiles.push({ number: JOKER_NUMBER, color: 'white', revealed: false });
  return tiles;
}

export function shuffleDeck(deck: Tile[], seed: string): Tile[] {
  const rng = seedrandom(seed);
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Ascending by number. Same number: white before black. */
export function tileCompare(a: Tile, b: Tile): number {
  if (a.number !== b.number) return a.number - b.number;
  if (a.color === b.color) return 0;
  return a.color === 'white' ? -1 : 1;
}

/** Insert tile in sorted position. Returns new array and insertion index. */
export function insertTileSorted(
  tiles: Tile[],
  newTile: Tile,
): { tiles: Tile[]; insertedIndex: number } {
  const arr = [...tiles];
  let insertAt = arr.length;
  for (let i = 0; i < arr.length; i++) {
    if (tileCompare(newTile, arr[i]) <= 0) {
      insertAt = i;
      break;
    }
  }
  arr.splice(insertAt, 0, newTile);
  return { tiles: arr, insertedIndex: insertAt };
}

export function getInitialTileCount(playerCount: number): number {
  return playerCount === 2 ? 4 : 3;
}

export function formatTileNumber(n: number): string {
  return n === JOKER_NUMBER ? 'J' : String(n);
}
