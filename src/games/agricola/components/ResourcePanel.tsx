/** ResourcePanel — 자원 패널 (한국어 레이블 + 아이콘 + 구걸 토큰) */
import type { PlayerState, AnimalType } from '../lib/types.js';

const ANIMAL_TYPES: AnimalType[] = ['sheep', 'boar', 'cattle'];

function totalAnimalCount(player: PlayerState, type: AnimalType): number {
  const inResources = player.resources[type] ?? 0;
  const inPastures = player.farm.pastures.reduce(
    (sum, p) => sum + (p.animals?.type === type ? p.animals.count : 0), 0,
  );
  const inHouse = player.farm.animalsInHouse.reduce(
    (sum, a) => sum + (a.type === type ? a.count : 0), 0,
  );
  return inResources + inPastures + inHouse;
}

interface ResourcePanelProps {
  player: PlayerState;
}

const RESOURCE_ROWS: { key: string; icon: string; label: string; color: string }[][] = [
  // 건재료
  [
    { key: 'wood',      icon: '🪵', label: '나무',   color: 'text-yellow-800' },
    { key: 'clay',      icon: '🧱', label: '흙',     color: 'text-orange-700' },
    { key: 'stone',     icon: '🪨', label: '돌',     color: 'text-gray-600' },
    { key: 'reed',      icon: '🌿', label: '갈대',   color: 'text-stone-500' },
  ],
  // 작물
  [
    { key: 'grain',     icon: '🌾', label: '곡식',   color: 'text-yellow-600' },
    { key: 'vegetable', icon: '🥕', label: '채소',   color: 'text-orange-500' },
    { key: 'food',      icon: '🍖', label: '음식',   color: 'text-red-600' },
  ],
  // 동물
  [
    { key: 'sheep',     icon: '🐑', label: '양',     color: 'text-sky-600' },
    { key: 'boar',      icon: '🐷', label: '멧돼지', color: 'text-pink-700' },
    { key: 'cattle',    icon: '🐄', label: '소',     color: 'text-amber-800' },
  ],
];

export default function ResourcePanel({ player }: ResourcePanelProps) {
  const { resources, beggingTokens, familySize } = player;
  const animalTotals = Object.fromEntries(
    ANIMAL_TYPES.map((t) => [t, totalAnimalCount(player, t)]),
  ) as Record<AnimalType, number>;

  return (
    <div className="bg-amber-50 rounded-lg border-2 border-amber-300 p-2 text-xs shadow-sm">
      {/* 가족 수 + 구걸 토큰 */}
      <div className="flex items-center gap-3 mb-2 pb-1.5 border-b border-amber-200">
        <span className="flex items-center gap-1 font-medium text-gray-700">
          <span aria-hidden="true">👨‍👩‍👧</span> 가족 <span className="font-bold">{familySize}</span>명
        </span>
        {beggingTokens > 0 && (
          <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 border border-red-300 px-1.5 py-0.5 rounded">
            <span aria-hidden="true">😞</span> 구걸 <span className="font-bold">-{beggingTokens * 3}점</span>
          </span>
        )}
      </div>

      {/* 자원 그리드 */}
      {RESOURCE_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 mb-1">
          {row.map(({ key, icon, label, color }) => {
            const isAnimal = ANIMAL_TYPES.includes(key as AnimalType);
            const val = isAnimal
              ? (animalTotals[key as AnimalType] ?? 0)
              : (resources as Record<string, number>)[key] ?? 0;
            return (
              <div
                key={key}
                className={[
                  'flex-1 flex flex-col items-center py-1 rounded',
                  key === 'reed'
                    ? val > 0 ? 'bg-white border-2 border-stone-300 shadow-sm' : 'bg-stone-50 border border-stone-200 opacity-60'
                    : val > 0 ? 'bg-amber-200/60 border border-amber-400' : 'bg-stone-100/60 border border-stone-200 opacity-60',
                ].join(' ')}
              >
                <span aria-hidden="true" className="text-base leading-none">{icon}</span>
                <span className={`font-bold mt-0.5 ${color}`}>{val}</span>
                <span className="text-gray-400 text-[10px]">{label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
