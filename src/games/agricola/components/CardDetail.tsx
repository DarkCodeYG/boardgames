/** CardDetail — Phase 2 구현 예정 */
import type { Card } from '../lib/types.js';

interface CardDetailProps {
  card: Card;
  onClose: () => void;
}

export default function CardDetail({ card, onClose }: CardDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="font-bold text-lg mb-2">{card.nameKo}</h2>
        <p className="text-gray-500 text-sm mb-2">{card.nameEn} · {card.deck}덱</p>
        <p className="text-xs text-gray-400 mb-4">Phase 2 구현 예정 — 효과 텍스트 미구현</p>
        <button onClick={onClose} className="w-full py-2 bg-gray-800 text-white rounded">닫기</button>
      </div>
    </div>
  );
}
