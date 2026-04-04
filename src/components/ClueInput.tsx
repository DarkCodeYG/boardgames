import { useState } from 'react';
import type { Team } from '../lib/types';

interface ClueInputProps {
  team: Team;
  onSubmit: (word: string, count: number) => void;
}

export default function ClueInput({ team, onSubmit }: ClueInputProps) {
  const [word, setWord] = useState('');
  const [count, setCount] = useState(1);

  const teamColor = team === 'red' ? 'bg-red-500' : 'bg-blue-500';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim()) {
      onSubmit(word.trim(), count);
      setWord('');
      setCount(1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 p-4">
      <div className={`${teamColor} text-white px-3 py-1 rounded-full text-sm font-bold`}>
        {team === 'red' ? '🔴 RED' : '🔵 BLUE'} 팀장
      </div>
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="단서 단어 입력"
        className="border-2 border-stone-300 rounded-lg px-3 py-2 text-center font-bold
                   focus:outline-none focus:border-stone-500 w-40"
        autoFocus
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCount(Math.max(0, count - 1))}
          className="w-8 h-8 rounded-full bg-stone-200 font-bold hover:bg-stone-300"
        >
          -
        </button>
        <span className="w-8 text-center font-bold text-lg">{count}</span>
        <button
          type="button"
          onClick={() => setCount(Math.min(9, count + 1))}
          className="w-8 h-8 rounded-full bg-stone-200 font-bold hover:bg-stone-300"
        >
          +
        </button>
      </div>
      <button
        type="submit"
        disabled={!word.trim()}
        className={`${teamColor} text-white px-4 py-2 rounded-lg font-bold
                   disabled:opacity-50 hover:opacity-90 transition-opacity`}
      >
        단서 제출
      </button>
    </form>
  );
}
