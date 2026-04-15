/**
 * 아그리콜라 홈 페이지 — 설정 및 게임 시작
 * Phase 1 구현 대상.
 */

import { useState } from 'react';
import { useAgricolaStore } from '../store/game-store.js';
import { createGameState } from '../lib/game-engine.js';

interface HomePageProps {
  onStartGame: () => void;
}

export default function HomePage({ onStartGame }: HomePageProps) {
  const { playerCount, setPlayerCount, setGameState } = useAgricolaStore();
  const [names, setNames] = useState<string[]>(['플레이어 1', '플레이어 2', '플레이어 3', '플레이어 4']);

  function handleStart() {
    const playerNames = names.slice(0, playerCount);
    const state = createGameState({ playerCount, playerNames, deck: 'AB' });
    setGameState(state);
    onStartGame();
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
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

        {/* 플레이어 이름 */}
        <div className="mb-8 space-y-2">
          {Array.from({ length: playerCount }, (_, i) => (
            <input
              key={i}
              type="text"
              value={names[i] ?? ''}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={`플레이어 ${i + 1}`}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          ))}
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
