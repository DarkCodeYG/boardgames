import { ref, runTransaction, get } from 'firebase/database';
import { db } from './firebase';

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function incrementPlayCount(gameId: string): Promise<void> {
  const ym = currentYearMonth();
  const r = ref(db, `stats/plays/${gameId}/${ym}`);
  await runTransaction(r, (current) => (current ?? 0) + 1);
}

export async function fetchMonthlyStats(yearMonth?: string): Promise<Record<string, number>> {
  const ym = yearMonth ?? currentYearMonth();
  const r = ref(db, 'stats/plays');
  const snap = await get(r);
  if (!snap.exists()) return {};

  const result: Record<string, number> = {};
  snap.forEach((gameSnap) => {
    const count = gameSnap.child(ym).val();
    if (typeof count === 'number') {
      result[gameSnap.key!] = count;
    }
  });
  return result;
}
