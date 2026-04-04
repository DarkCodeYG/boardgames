import seedrandom from 'seedrandom';
import type { GameState, PlayerRole } from './types';
import type { Lang } from '../../codenames/lib/i18n';
import { LOCATIONS_STANDARD, type Location } from './locations-standard';
import { LOCATIONS_JW } from './locations-jw';
import type { WordPack } from '../../codenames/lib/words';

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getLocations(pack: WordPack): Location[] {
  return pack === 'jw' ? LOCATIONS_JW : LOCATIONS_STANDARD;
}

/** 시드로부터 장소, 스파이, 역할 순서를 결정하는 핵심 함수 (한 곳에서만 로직 관리) */
function resolveGame(seed: string, playerCount: number, pack: WordPack) {
  const rng = seedrandom(seed);
  const locations = getLocations(pack);
  const locationIndex = Math.floor(rng() * locations.length);
  const location = locations[locationIndex];
  const spyIndex = Math.floor(rng() * playerCount);

  // 역할 셔플용 인덱스 배열 생성 (언어 무관하게 인덱스만 결정)
  const roleCount = location.roles.ko.length;
  const roleIndices: number[] = Array.from({ length: roleCount }, (_, i) => i);
  for (let i = roleIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [roleIndices[i], roleIndices[j]] = [roleIndices[j], roleIndices[i]];
  }

  return { location, spyIndex, roleIndices };
}

export function createGame(
  playerCount: number,
  pack: WordPack = 'standard',
  roundMinutes: number = 8,
  existingSeed?: string,
): GameState {
  const seed = existingSeed ?? generateSeed();
  const { spyIndex } = resolveGame(seed, playerCount, pack);

  return {
    phase: 'setup',
    playerCount,
    spyIndex,
    seed,
    roundMinutes,
    startedAt: null,
  };
}

export function startGame(state: GameState): GameState {
  return { ...state, phase: 'playing', startedAt: Date.now() };
}

export function getPlayerRole(
  seed: string,
  playerIndex: number,
  playerCount: number,
  lang: Lang,
  pack: WordPack,
): PlayerRole {
  const { location, spyIndex, roleIndices } = resolveGame(seed, playerCount, pack);

  if (playerIndex === spyIndex) {
    return { isSpy: true, location: null, role: null };
  }

  // 스파이를 제외한 순서로 역할 배정
  const roles = location.roles[lang];
  let roleSlot = 0;
  for (let i = 0; i < playerCount; i++) {
    if (i === spyIndex) continue;
    if (i === playerIndex) {
      const idx = roleIndices[roleSlot % roleIndices.length];
      return {
        isSpy: false,
        location: location.name[lang],
        role: roles[idx % roles.length],
      };
    }
    roleSlot++;
  }

  throw new Error(`Invalid playerIndex: ${playerIndex}`);
}
