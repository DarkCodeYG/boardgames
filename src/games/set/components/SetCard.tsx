import { cardAttrs } from '../lib/game-engine';
import type { Theme } from '../lib/types';

// Standard: attr1=count(0→1개,1→2개,2→3개), attr2=color(0=red,1=green,2=purple), attr3=shape(0=diamond,1=circle,2=triangle)
// Genius:   attr1=innerColor(0=red,1=green,2=blue), attr2=outerColor(0=yellow,1=purple,2=orange), attr3=shape(0=triangle,1=circle,2=square)

const STD_COLORS = ['#ef4444', '#22c55e', '#a855f7'];
const GENIUS_INNER = ['#ef4444', '#22c55e', '#3b82f6'];
const GENIUS_OUTER = ['#f59e0b', '#a855f7', '#f97316'];

function StdShape({ shape, cx, cy }: { shape: number; cx: number; cy: number }) {
  switch (shape) {
    case 0: // diamond
      return <polygon points={`${cx},${cy - 14} ${cx + 11},${cy} ${cx},${cy + 14} ${cx - 11},${cy}`} />;
    case 1: // circle
      return <circle cx={cx} cy={cy} r={12} />;
    case 2: // triangle
      return <polygon points={`${cx},${cy - 14} ${cx + 13},${cy + 9} ${cx - 13},${cy + 9}`} />;
    default:
      return null;
  }
}

function StandardCardSvg({ count, color, shape }: { count: number; color: string; shape: number }) {
  const positions = count === 0 ? [45] : count === 1 ? [25, 65] : [13, 45, 77];
  return (
    <svg viewBox="0 0 90 60" className="w-full h-full" fill={color}>
      {positions.map((cx, i) => (
        <StdShape key={i} shape={shape} cx={cx} cy={30} />
      ))}
    </svg>
  );
}

function GeniusCardSvg({ innerColor, outerColor, shape }: { innerColor: string; outerColor: string; shape: number }) {
  const props = { fill: innerColor, stroke: outerColor, strokeWidth: 6 };
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {shape === 0 && <polygon points="40,10 70,68 10,68" {...props} />}
      {shape === 1 && <circle cx="40" cy="42" r="30" {...props} />}
      {shape === 2 && <rect x="10" y="10" width="60" height="60" rx="5" {...props} />}
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
  const [a1, a2, a3] = cardAttrs(cardId);

  let borderClass = 'border-2 border-stone-200';
  if (selected) borderClass = 'border-4 border-blue-500 ring-2 ring-blue-300';
  if (correct) borderClass = 'border-4 border-green-500 ring-2 ring-green-300';

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        bg-white rounded-xl shadow-md ${borderClass}
        transition-all duration-150
        ${onClick && !disabled ? 'hover:shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer' : 'cursor-default'}
        ${selected ? 'scale-[1.03] shadow-lg' : ''}
        ${small ? 'p-1' : 'p-3'}
        flex items-center justify-center
      `}
    >
      <div className={small ? 'w-12 h-8' : 'w-full h-full aspect-[3/2]'}>
        {theme === 'standard' ? (
          <StandardCardSvg count={a1} color={STD_COLORS[a2]} shape={a3} />
        ) : (
          <GeniusCardSvg innerColor={GENIUS_INNER[a1]} outerColor={GENIUS_OUTER[a2]} shape={a3} />
        )}
      </div>
    </button>
  );
}
