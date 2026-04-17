/**
 * 아그리콜라 홈 페이지 — 설정 및 게임 시작
 */

import { useState } from 'react';
import { useAgricolaStore } from '../store/game-store.js';
import { createGameState } from '../lib/game-engine.js';

interface HomePageProps {
  onStartGame: () => void;
}

type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

const COLOR_OPTIONS: Array<{ id: PlayerColor; label: string; dot: string; bg: string; ring: string }> = [
  { id: 'red',    label: '빨강', dot: 'bg-red-500',    bg: 'bg-red-100',    ring: 'ring-red-500' },
  { id: 'blue',   label: '파랑', dot: 'bg-blue-500',   bg: 'bg-blue-100',   ring: 'ring-blue-500' },
  { id: 'green',  label: '초록', dot: 'bg-green-500',  bg: 'bg-green-100',  ring: 'ring-green-500' },
  { id: 'yellow', label: '노랑', dot: 'bg-yellow-400', bg: 'bg-yellow-100', ring: 'ring-yellow-400' },
];

export default function HomePage({ onStartGame }: HomePageProps) {
  const { playerCount, setPlayerCount, setGameState } = useAgricolaStore();
  const [names, setNames] = useState<string[]>(['플레이어 1', '플레이어 2', '플레이어 3', '플레이어 4']);
  const [colors, setColors] = useState<PlayerColor[]>(['red', 'blue', 'green', 'yellow']);

  function handleColorSelect(playerIdx: number, color: PlayerColor) {
    setColors((prev) => {
      const next = [...prev];
      next[playerIdx] = color;
      return next;
    });
  }

  function handleStart() {
    const playerNames = names.slice(0, playerCount);
    const playerColors = colors.slice(0, playerCount) as PlayerColor[];
    const state = createGameState({ playerCount, playerNames, playerColors, deck: 'AB' });
    setGameState(state);
    onStartGame();
  }

  const usedColors = colors.slice(0, playerCount);

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-amber-800 mb-2 text-center">🌾 아그리콜라</h1>
        <p className="text-center text-gray-500 text-sm mb-8">Agricola 2016 Revised Edition</p>

        {/* 인원 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">인원 수</label>
          <div className="flex gap-2">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors duration-150 ${
                  playerCount === n
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                {n}인
              </button>
            ))}
          </div>
        </div>

        {/* 플레이어 이름 + 색상 */}
        <div className="mb-8 space-y-3">
          {Array.from({ length: playerCount }, (_, i) => {
            const selectedColor = colors[i] ?? 'red';
            return (
              <div key={i} className="flex items-center gap-2">
                {/* 이름 입력 */}
                <input
                  type="text"
                  value={names[i] ?? ''}
                  onChange={(e) => {
                    const next = [...names];
                    next[i] = e.target.value;
                    setNames(next);
                  }}
                  placeholder={`플레이어 ${i + 1}`}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                />
                {/* 색상 선택 */}
                <div className="flex gap-1">
                  {COLOR_OPTIONS.map((opt) => {
                    const takenByOther = usedColors.some((c, ci) => ci !== i && c === opt.id);
                    const isSelected = selectedColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        title={opt.label}
                        disabled={takenByOther}
                        onClick={() => handleColorSelect(i, opt.id)}
                        className={[
                          'w-7 h-7 rounded-full border-2 transition-all duration-150',
                          opt.dot,
                          isSelected ? `ring-2 ring-offset-1 ${opt.ring} border-white scale-110` : 'border-transparent',
                          takenByOther ? 'opacity-25 cursor-not-allowed' : 'hover:scale-110 cursor-pointer',
                        ].join(' ')}
                        aria-label={`${opt.label} 선택`}
                        aria-pressed={isSelected}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium text-lg hover:bg-amber-700 transition-colors duration-150"
        >
          게임 시작
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">Phase 1 — 카드 없는 기본 게임</p>
      </div>
    </div>
  );
}
