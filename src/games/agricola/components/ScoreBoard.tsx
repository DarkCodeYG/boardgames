/** ScoreBoard — Phase 1 구현 예정 */
import type { GameState } from '../lib/types.js';
import { calculateScore } from '../lib/scoring-engine.js';

interface ScoreBoardProps {
  state: GameState;
}

const CATEGORIES = [
  ['farmlands', '밭'],
  ['pastures', '목장'],
  ['grain', '밀'],
  ['vegetables', '채소'],
  ['sheep', '양'],
  ['boar', '멧돼지'],
  ['cattle', '소'],
  ['emptySpaces', '빈 공간'],
  ['fencedStables', '울타리 외양간'],
  ['rooms', '방'],
  ['familyMembers', '가족'],
  ['cardPoints', '카드 VP'],
  ['begging', '구걸 토큰'],
  ['total', '합계'],
] as const;

export default function ScoreBoard({ state }: ScoreBoardProps) {
  const scores = state.playerOrder.map((id) => ({
    id,
    name: state.players[id]?.name ?? id,
    breakdown: calculateScore(state, id),
  }));

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">카테고리</th>
            {scores.map((s) => (
              <th key={s.id} className="border px-2 py-1">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map(([key, label]) => (
            <tr key={key} className={key === 'total' ? 'font-bold bg-gray-100' : ''}>
              <td className="border px-2 py-1">{label}</td>
              {scores.map((s) => (
                <td key={s.id} className="border px-2 py-1 text-center">
                  {s.breakdown[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
