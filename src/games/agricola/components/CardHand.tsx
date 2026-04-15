/** CardHand — Phase 2 구현 예정 */
import type { Card } from '../lib/types.js';

interface CardHandProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  playable?: boolean;
}

export default function CardHand({ cards, onCardClick: _oc, playable: _p }: CardHandProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {cards.length === 0 ? (
        <span className="text-gray-400 text-sm">패 없음</span>
      ) : (
        cards.map((c) => (
          <div key={c.id} className="border rounded px-2 py-1 text-xs bg-yellow-50">
            {c.nameKo}
          </div>
        ))
      )}
    </div>
  );
}
