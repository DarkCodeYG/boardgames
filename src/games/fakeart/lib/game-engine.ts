import seedrandom from 'seedrandom';
import { TOPICS_STANDARD } from './topics-standard';
import { TOPICS_JW } from './topics-jw';
import type { Pack, Topic } from './types';

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function resolveGame(seed: string, playerCount: number, pack: Pack) {
  const rng = seedrandom(seed);
  const topics = pack === 'jw' ? TOPICS_JW : TOPICS_STANDARD;
  const topicIndex = Math.floor(rng() * topics.length);
  const topic: Topic = topics[topicIndex];
  const fakeIndex = Math.floor(rng() * playerCount);
  const drawOrder = Array.from({ length: playerCount }, (_, i) => i);
  for (let i = drawOrder.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [drawOrder[i], drawOrder[j]] = [drawOrder[j], drawOrder[i]];
  }
  return { topic, fakeIndex, drawOrder };
}

// 투표 결과로 지목된 플레이어 인덱스 반환. 동률이면 null (가짜 안전)
// -1(기권)은 집계에서 제외
export function getAccused(votes: Record<string, number>): number | null {
  const counts: Record<number, number> = {};
  for (const v of Object.values(votes)) {
    if (v === -1) continue; // 기권 제외
    counts[v] = (counts[v] || 0) + 1;
  }
  let maxCount = 0, accused = -1, tie = false;
  for (const [p, c] of Object.entries(counts)) {
    if (c > maxCount) { maxCount = c; accused = Number(p); tie = false; }
    else if (c === maxCount) { tie = true; }
  }
  if (tie || maxCount === 0) return null;
  return accused;
}
