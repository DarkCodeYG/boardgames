/** HarvestModal — Phase 1 구현 예정 */
import type { GameState, PlayerId } from '../lib/types.js';

interface HarvestModalProps {
  state: GameState;
  currentPlayerId: PlayerId;
  onFeedConfirm: (beggingTokens: number) => void;
}

export default function HarvestModal({ state: _s, currentPlayerId: _cpi, onFeedConfirm }: HarvestModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="font-bold text-lg mb-4">수확</h2>
        <p className="text-sm text-gray-500 mb-4">Phase 1 구현 예정</p>
        <button
          onClick={() => onFeedConfirm(0)}
          className="w-full py-2 bg-amber-600 text-white rounded"
        >
          확인
        </button>
      </div>
    </div>
  );
}
