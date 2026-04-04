import type { Card as CardType } from '../lib/types';

const COLOR_MAP = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  neutral: 'bg-amber-100 text-amber-900',
  assassin: 'bg-gray-900 text-white',
};

const SPYMASTER_BORDER = {
  red: 'ring-4 ring-red-400',
  blue: 'ring-4 ring-blue-400',
  neutral: 'ring-4 ring-amber-300',
  assassin: 'ring-4 ring-gray-700',
};

interface CardProps {
  card: CardType;
  isSpymasterView: boolean;
  onSelect: (id: number) => void;
  disabled: boolean;
}

export default function Card({ card, isSpymasterView, onSelect, disabled }: CardProps) {
  const revealed = card.revealed;

  // 공개된 카드
  if (revealed) {
    return (
      <button
        disabled
        className={`
          w-full aspect-[4/3] rounded-xl flex items-center justify-center
          text-sm sm:text-base font-bold shadow-md
          ${COLOR_MAP[card.type]} opacity-80
          transition-all duration-300
        `}
      >
        {card.word}
      </button>
    );
  }

  // 스파이마스터 뷰 (미공개 카드에 색상 힌트)
  if (isSpymasterView) {
    return (
      <button
        disabled
        className={`
          w-full aspect-[4/3] rounded-xl flex items-center justify-center
          text-sm sm:text-base font-bold
          bg-stone-100 text-stone-800
          ${SPYMASTER_BORDER[card.type]}
          transition-all duration-300
        `}
      >
        {card.word}
      </button>
    );
  }

  // 일반 뷰 (미공개 카드 - 선택 가능)
  return (
    <button
      onClick={() => !disabled && onSelect(card.id)}
      disabled={disabled}
      className={`
        w-full aspect-[4/3] rounded-xl flex items-center justify-center
        text-sm sm:text-base font-bold
        bg-stone-100 text-stone-800
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-stone-200 hover:scale-105 active:scale-95 cursor-pointer'}
        shadow-md transition-all duration-200
      `}
    >
      {card.word}
    </button>
  );
}
