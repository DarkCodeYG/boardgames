import { useEffect, useState } from 'react';
import { createBoard } from '../lib/game-engine';
import type { Card } from '../lib/types';

const COLOR_MAP = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  neutral: 'bg-amber-100 text-amber-800',
  assassin: 'bg-gray-900 text-white',
};

export default function SpymasterKeyPage() {
  const [board, setBoard] = useState<Card[] | null>(null);
  const [startingTeam, setStartingTeam] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    if (seed) {
      const result = createBoard(seed);
      setBoard(result.board);
      setStartingTeam(result.startingTeam);
    }
  }, []);

  if (!board) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-100">
        <p className="text-stone-500 text-lg">시드가 없습니다. QR코드를 스캔해주세요.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-stone-900 p-4 flex flex-col items-center justify-center">
      <h1 className="text-white text-xl font-bold mb-2">🕵️ 팀장 답안</h1>
      <p className="text-stone-400 text-sm mb-4">
        선공: {startingTeam === 'red' ? '🔴 RED (9장)' : '🔵 BLUE (9장)'}
      </p>

      <div className="grid grid-cols-5 gap-1.5 max-w-sm w-full">
        {board.map((card) => (
          <div
            key={card.id}
            className={`
              aspect-[4/3] rounded-lg flex items-center justify-center
              text-xs font-bold shadow-sm
              ${COLOR_MAP[card.type]}
            `}
          >
            {card.word}
          </div>
        ))}
      </div>

      <p className="text-stone-500 text-xs mt-4">이 화면을 다른 플레이어에게 보여주지 마세요!</p>
    </div>
  );
}
