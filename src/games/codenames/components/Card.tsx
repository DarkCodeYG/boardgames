import type { Card as CardType } from '../lib/types';
import type { Lang } from '../lib/i18n';
import { getPinyin } from '../lib/pinyin';

const COLOR_MAP = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  neutral: 'bg-amber-100 text-amber-900',
  assassin: 'bg-gray-900 text-white',
};

const INVERTED_TEXT_COLOR = {
  red: 'text-red-200/50',
  blue: 'text-blue-200/50',
  neutral: 'text-amber-700/30',
  assassin: 'text-gray-500/50',
};

const DIVIDER_COLOR = {
  red: 'bg-red-300/30',
  blue: 'bg-blue-300/30',
  neutral: 'bg-amber-600/20',
  assassin: 'bg-gray-600/30',
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
  lang?: Lang;
}

function CardContent({ word, invertedColor, dividerColor, lang }: { word: string; invertedColor?: string; dividerColor?: string; lang?: Lang }) {
  const pinyin = lang === 'zh' ? getPinyin(word) : null;

  return (
    <>
      {/* 반대편 사람용: 위쪽에 180도 회전된 글씨 */}
      <span
        className={`absolute top-0.5 sm:top-1 left-0 right-0 text-center rotate-180
                    text-xs sm:text-lg md:text-xl font-bold
                    ${invertedColor ?? 'text-stone-400/70'} select-none pointer-events-none`}
      >
        {word}
      </span>

      {/* 구분선 */}
      <div className={`absolute top-[28%] left-[10%] right-[10%] h-px ${dividerColor ?? 'bg-stone-300/40'}`} />

      {/* 메인 글씨 + 병음 */}
      <span className="z-10 mt-1 flex flex-col items-center leading-tight">
        {pinyin && (
          <span className="text-[0.45rem] sm:text-xs md:text-sm font-normal opacity-60">{pinyin}</span>
        )}
        <span>{word}</span>
      </span>
    </>
  );
}

export default function Card({ card, isSpymasterView, onSelect, disabled, lang }: CardProps) {
  const revealed = card.revealed;

  const baseClass = `
    relative w-full h-full rounded-xl flex items-center justify-center
    text-lg sm:text-3xl md:text-4xl font-black
    overflow-hidden transition-all duration-300
  `;

  // 공개된 카드
  if (revealed) {
    return (
      <button disabled className={`${baseClass} ${COLOR_MAP[card.type]} opacity-85 shadow-md`}>
        <CardContent word={card.word} invertedColor={INVERTED_TEXT_COLOR[card.type]} dividerColor={DIVIDER_COLOR[card.type]} lang={lang} />
      </button>
    );
  }

  // 스파이마스터 뷰
  if (isSpymasterView) {
    return (
      <button
        disabled
        className={`${baseClass} bg-stone-100 text-stone-800 ${SPYMASTER_BORDER[card.type]}`}
      >
        <CardContent word={card.word} lang={lang} />
      </button>
    );
  }

  // 일반 뷰
  return (
    <button
      onClick={() => !disabled && onSelect(card.id)}
      disabled={disabled}
      className={`
        ${baseClass} bg-stone-100 text-stone-800 shadow-md
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-stone-200 hover:scale-[1.03] active:scale-95 cursor-pointer'}
      `}
    >
      <CardContent word={card.word} lang={lang} />
    </button>
  );
}
