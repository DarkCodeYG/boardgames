import { cardAttrs, geniusCardAttrs } from '../lib/game-engine';
import type { Theme } from '../lib/types';

// Standard: attr1=count(0→1,1→2,2→3), attr2=color(0=red,1=green,2=purple),
//           attr3=shape(0=diamond,1=oval,2=squiggle), attr4=fill(0=solid,1=striped,2=open)
// Genius:   shapeColor(0=blue,1=red,2=yellow), bgColor(0=white,1=gray,2=black), shape(0=circle,1=triangle,2=square)

const STD_COLORS = ['#ef4444', '#22c55e', '#a855f7'];
const GENIUS_SHAPE_COLORS = ['#2a74d1', '#bf3030', '#d4a800'];  // 파랑, 빨강, 노랑
const GENIUS_BG_COLORS    = ['#f0f0f0', '#787878', '#1e1e1e'];  // 흰색, 회색, 검정색

function StdShape({ shape, cx, cy, fill, stroke, strokeWidth, patternId }: {
  shape: number; cx: number; cy: number;
  fill: string; stroke: string; strokeWidth: number; patternId?: string;
}) {
  const f = patternId ? `url(#${patternId})` : fill;
  const props = { fill: f, stroke, strokeWidth };
  switch (shape) {
    case 0: // diamond
      return <polygon points={`${cx},${cy - 18} ${cx + 8},${cy} ${cx},${cy + 18} ${cx - 8},${cy}`} {...props} />;
    case 1: // oval
      return <ellipse cx={cx} cy={cy} rx={7} ry={13} {...props} />;
    case 2: // squiggle (rounded caps)
      return <path d={`M ${cx+4},${cy-13} C ${cx+12},${cy-8} ${cx-4},${cy+8} ${cx+4},${cy+13} A 4 4 0 0 1 ${cx-4},${cy+13} C ${cx-12},${cy+8} ${cx+4},${cy-8} ${cx-4},${cy-13} A 4 4 0 0 1 ${cx+4},${cy-13} Z`} {...props} />;
    default:
      return null;
  }
}

function StandardCardSvg({ count, color, shape, fillType, cardId }: {
  count: number; color: string; shape: number; fillType: number; cardId: number;
}) {
  const positions = count === 0 ? [45] : count === 1 ? [25, 65] : [13, 45, 77];
  const patternId = fillType === 1 ? `sp-${cardId}` : undefined;
  const fillColor = fillType === 0 ? color : 'none';
  const strokeWidth = fillType === 2 ? 2 : 1.5;

  return (
    <svg viewBox="0 0 90 60" className="w-full h-full">
      {patternId && (
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="3" height="3" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="3" stroke={color} strokeWidth="1.5" />
          </pattern>
        </defs>
      )}
      {positions.map((cx, i) => (
        <StdShape
          key={i} shape={shape} cx={cx} cy={30}
          fill={fillColor} stroke={color} strokeWidth={strokeWidth}
          patternId={patternId}
        />
      ))}
    </svg>
  );
}

function GeniusCardSvg({ shapeColor, shape }: {
  shapeColor: string; shape: number;
}) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {shape === 0 && <circle cx="40" cy="40" r="17" fill={shapeColor} />}
      {shape === 1 && <polygon points="40,22 59,58 21,58" fill={shapeColor} />}
      {shape === 2 && <rect x="23" y="23" width="34" height="34" rx="3" fill={shapeColor} />}
    </svg>
  );
}

interface SetCardProps {
  cardId: number;
  theme: Theme;
  selected?: boolean;
  correct?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
}

export default function SetCard({ cardId, theme, selected, correct, onClick, disabled, small }: SetCardProps) {
  let borderClass = 'border-2 border-stone-200';
  if (selected) borderClass = 'border-4 border-blue-500 ring-2 ring-blue-300';
  if (correct) borderClass = 'border-4 border-green-500 ring-2 ring-green-300';

  if (theme === 'genius') {
    const [sc, bc, shape] = geniusCardAttrs(cardId);
    return (
      <button
        onClick={onClick}
        disabled={disabled || !onClick}
        style={{ backgroundColor: GENIUS_BG_COLORS[bc] }}
        className={`
          w-full h-full rounded-xl shadow-md overflow-hidden ${borderClass}
          transition-all duration-150
          ${onClick && !disabled ? 'hover:shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer' : 'cursor-default'}
          ${selected ? 'scale-[1.03] shadow-lg' : ''}
          flex items-center justify-center
        `}
      >
        <div className={small ? 'w-12 h-8' : 'w-full h-full'}>
          <GeniusCardSvg shapeColor={GENIUS_SHAPE_COLORS[sc]} shape={shape} />
        </div>
      </button>
    );
  }

  const [count, color, shape, fillType] = cardAttrs(cardId);
  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        w-full h-full bg-white rounded-xl shadow-md ${borderClass}
        transition-all duration-150
        ${onClick && !disabled ? 'hover:shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer' : 'cursor-default'}
        ${selected ? 'scale-[1.03] shadow-lg' : ''}
        ${small ? 'p-1' : 'p-3'}
        flex items-center justify-center
      `}
    >
      <div className={small ? 'w-12 h-8' : 'w-full h-full'}>
        <StandardCardSvg count={count} color={STD_COLORS[color]} shape={shape} fillType={fillType} cardId={cardId} />
      </div>
    </button>
  );
}
