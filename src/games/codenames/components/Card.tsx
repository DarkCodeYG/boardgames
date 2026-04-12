import type { Card as CardType } from '../lib/types';
import type { Lang } from '../lib/i18n';
import { getPinyin } from '../lib/pinyin';
import {
  CODENAMES_COLOR_MAP as COLOR_MAP,
  CODENAMES_INVERTED_TEXT as INVERTED_TEXT_COLOR,
  CODENAMES_DIVIDER as DIVIDER_COLOR,
  CODENAMES_SPYMASTER_BORDER as SPYMASTER_BORDER,
} from '../../../lib/colors';

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
      onClick={() => onSelect(card.id)}
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
