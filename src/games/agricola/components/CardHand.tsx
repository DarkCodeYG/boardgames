/**
 * CardHand — 플레이어 손패 (직업 + 보조 설비 탭)
 */
import { useState } from 'react';
import type { Card } from '../lib/types.js';

const RES_ICON: Record<string, string> = {
  wood: '🪵', clay: '🟫', stone: '⬜', reed: '🌿',
  grain: '🌾', vegetable: '🥕', food: '🍖',
  sheep: '🐑', boar: '🐷', cattle: '🐄',
};
const RES_LABEL: Record<string, string> = {
  wood: '나무', clay: '흙', stone: '돌', reed: '갈대',
  grain: '곡식', vegetable: '채소', food: '음식',
  sheep: '양', boar: '돼지', cattle: '소',
};

function CostBadge({ cost }: { cost: Record<string, number> }) {
  const entries = Object.entries(cost).filter(([, v]) => v > 0);
  if (entries.length === 0) return <span className="text-xs text-amber-700 font-medium">무료</span>;
  return (
    <span className="flex gap-0.5 flex-wrap">
      {entries.map(([res, amt]) => (
        <span
          key={res}
          className={[
            'inline-flex items-center gap-0.5 text-[10px] border rounded px-1',
            res === 'reed' ? 'bg-white border-stone-300 text-stone-600' : 'bg-amber-100 border-amber-300',
          ].join(' ')}
          title={`${RES_LABEL[res] ?? res} ${amt}`}
        >
          <span aria-hidden="true">{RES_ICON[res] ?? res}</span>
          {amt}
        </span>
      ))}
    </span>
  );
}

interface CardMiniProps {
  card: Card;
  playable: boolean;
  selected: boolean;
  onClick: () => void;
  occupationFoodCost?: number; // 직업 카드 음식 비용
}

function CardMini({ card, playable, selected, onClick, occupationFoodCost }: CardMiniProps) {
  const isOcc = card.type === 'occupation';
  const baseBg = isOcc
    ? 'bg-amber-50 border-amber-400'
    : 'bg-green-50 border-green-400';
  const playableBg = playable
    ? 'ring-2 ring-offset-1 ring-green-500 cursor-pointer hover:bg-green-100'
    : 'opacity-50 cursor-not-allowed';
  const selectedBg = selected ? 'ring-2 ring-offset-1 ring-blue-500 bg-blue-50' : '';

  const cost = card.type === 'occupation'
    ? (occupationFoodCost != null && occupationFoodCost > 0 ? { food: occupationFoodCost } : {})
    : (card.cost ?? {});

  return (
    <button
      onClick={playable ? onClick : undefined}
      disabled={!playable}
      className={[
        'relative flex flex-col gap-0.5 p-1.5 rounded border text-left transition-all duration-150 min-w-[5rem] max-w-[7rem]',
        baseBg,
        playable ? playableBg : 'opacity-50',
        selected ? selectedBg : '',
      ].filter(Boolean).join(' ')}
    >
      {/* 타입 배지 */}
      <span className={[
        'text-[9px] font-bold rounded px-1 self-start',
        isOcc ? 'bg-amber-600 text-white' : 'bg-green-700 text-white',
      ].join(' ')}>
        {isOcc ? '직업' : '보조 설비'}
      </span>

      {/* 카드명 */}
      <span className="text-xs font-medium leading-tight line-clamp-2 text-gray-800">
        {card.nameKo}
      </span>

      {/* 비용 + VP */}
      <div className="flex items-center justify-between gap-1 mt-auto">
        <CostBadge cost={cost as Record<string, number>} />
        {card.victoryPoints != null && typeof card.victoryPoints === 'number' && card.victoryPoints !== 0 && (
          <span className={[
            'text-[10px] font-bold rounded px-1',
            card.victoryPoints > 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-red-400 text-red-900',
          ].join(' ')}>
            {card.victoryPoints > 0 ? '+' : ''}{card.victoryPoints}VP
          </span>
        )}
      </div>
    </button>
  );
}

interface CardHandProps {
  occupations: Card[];
  minorImprovements: Card[];
  /** 현재 플레이할 수 있는 카드 타입 ('occupation' | 'minor_improvement' | null) */
  activeType: 'occupation' | 'minor_improvement' | null;
  /** 직업 카드 음식 비용 */
  occupationFoodCost: number;
  onCardClick: (card: Card) => void;
  selectedCardId: string | null;
}

export default function CardHand({
  occupations,
  minorImprovements,
  activeType,
  occupationFoodCost,
  onCardClick,
  selectedCardId,
}: CardHandProps) {
  const [tab, setTab] = useState<'occupation' | 'minor_improvement'>('occupation');

  const cards = tab === 'occupation' ? occupations : minorImprovements;
  const hasOcc = occupations.length > 0;
  const hasMinor = minorImprovements.length > 0;

  return (
    <div className="bg-stone-100 border border-stone-300 rounded-lg p-2">
      {/* 탭 */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => setTab('occupation')}
          className={[
            'text-xs px-2 py-1 rounded font-medium transition-colors duration-150',
            tab === 'occupation'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-600 border border-stone-300 hover:bg-amber-50',
          ].join(' ')}
        >
          직업 {hasOcc ? `(${occupations.length})` : ''}
        </button>
        <button
          onClick={() => setTab('minor_improvement')}
          className={[
            'text-xs px-2 py-1 rounded font-medium transition-colors duration-150',
            tab === 'minor_improvement'
              ? 'bg-green-700 text-white'
              : 'bg-white text-gray-600 border border-stone-300 hover:bg-green-50',
          ].join(' ')}
        >
          보조 설비 {hasMinor ? `(${minorImprovements.length})` : ''}
        </button>

        {activeType && (
          <span className="ml-auto text-[10px] text-green-700 font-medium self-center animate-pulse">
            {activeType === 'occupation' ? '직업 카드를 선택하세요' : '보조 설비을 선택하세요'}
          </span>
        )}
      </div>

      {/* 카드 목록 */}
      {cards.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">패 없음</p>
      ) : (
        <div className="flex gap-1.5 flex-wrap max-h-36 overflow-y-auto">
          {cards.map((card) => (
            <CardMini
              key={card.id}
              card={card}
              playable={activeType === card.type}
              selected={selectedCardId === card.id}
              onClick={() => onCardClick(card)}
              occupationFoodCost={occupationFoodCost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
