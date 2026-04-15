/** ResourcePanel — Phase 1 구현 예정 */
import type { PlayerState } from '../lib/types.js';

interface ResourcePanelProps {
  player: PlayerState;
}

export default function ResourcePanel({ player }: ResourcePanelProps) {
  const { resources } = player;
  return (
    <div className="grid grid-cols-5 gap-1 text-xs">
      {Object.entries(resources).map(([res, val]) => (
        <div key={res} className="text-center">
          <div className="font-bold">{val}</div>
          <div className="text-gray-500">{res}</div>
        </div>
      ))}
    </div>
  );
}
