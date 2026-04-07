import { useMemo } from 'react';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

interface ConfettiProps {
  count?: number;
}

export default function Confetti({ count = 32 }: ConfettiProps) {
  const pieces = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: `${(i / count) * 100 + Math.sin(i * 2.4) * 8}%`,
      delay: `${(i * 0.07) % 1.4}s`,
      duration: `${1.6 + (i % 5) * 0.18}s`,
      rotate: `${(i * 37) % 360}deg`,
      width: i % 3 === 0 ? 10 : 7,
      height: i % 3 === 0 ? 6 : 10,
    })),
  [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: p.id % 4 === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotate})`,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
