/**
 * 아그리콜라 게임 페이지 — 메인 게임 화면
 * Phase 1 v2: 다른 플레이어 농장 탭 + 워커 pip + 차례 하이라이트 + 플레이어 타이머
 */

import { useState, useEffect, useRef } from 'react';
import { useAgricolaStore } from '../store/game-store.js';
import FarmBoard from '../components/FarmBoard.js';
import ActionBoard from '../components/ActionBoard.js';
import ResourcePanel from '../components/ResourcePanel.js';
import ScoreBoard from '../components/ScoreBoard.js';
import {
  isHarvestRound,
  placeWorker,
  startRound,
  replenishActionSpaces,
  returnWorkers,
  runHarvest,
  plowField,
  sowField,
  growFamily,
  renovateHouse,
  buildRoom,
  buildStable,
  getAnimalFromMarket,
  buildMajorImprovement,
} from '../lib/game-engine.js';
import type { AnimalType } from '../lib/types.js';
import type { GameState } from '../lib/types.js';

interface GamePageProps {
  onExit: () => void;
}

const PLAYER_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  red:    { bg: 'bg-red-100',    ring: 'ring-red-400',    text: 'text-red-700' },
  blue:   { bg: 'bg-blue-100',   ring: 'ring-blue-400',   text: 'text-blue-700' },
  green:  { bg: 'bg-green-100',  ring: 'ring-green-400',  text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-100', ring: 'ring-yellow-400', text: 'text-yellow-700' },
};

const WORKER_DOT_COLORS: Record<string, string> = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
};

const PENDING_LABELS: Record<string, string> = {
  pending_plow:                  '밭 갈기 — 빈 셀을 클릭하세요',
  pending_sow:                   '씨 뿌리기 — 밭을 클릭하세요 (밀/채소 자동 선택)',
  pending_plow_sow:              '밭 갈고 씨 뿌리기 — 먼저 빈 셀을 클릭하세요',
  pending_build_room:            '방 건설 — 기존 방에 인접한 빈 셀을 클릭하세요 (재료5+갈대2)',
  pending_build_stable:          '외양간 건설 — 빈 셀을 클릭하세요 (나무 2)',
  pending_fence:                 '울타리 건설 — 울타리 선분을 클릭 후 확인을 누르세요',
  pending_renovate:              '집 개조 — 확인 버튼을 누르세요 (자원 자동 차감)',
  pending_renovate_fence:        '집 개조 + 울타리 — 확인 버튼을 누르세요',
  pending_family_growth:         '가족 늘리기 (빈 방 필요) — 확인 버튼을 누르세요',
  pending_family_growth_urgent:  '가족 늘리기 (방 없어도 가능) — 확인 버튼을 누르세요',
  pending_animal_choice:         '동물 배치 — 확인 버튼을 누르세요',
};

function advanceToNextPlayer(state: GameState): GameState {
  const n = state.playerOrder.length;
  for (let i = 1; i <= n; i++) {
    const nextIdx = (state.currentPlayerIndex + i) % n;
    const pid = state.playerOrder[nextIdx] ?? '';
    const placed = countPlaced(state, pid);
    const player = state.players[pid];
    if (player && placed < player.familySize) {
      return { ...state, currentPlayerIndex: nextIdx };
    }
  }
  return state;
}

function countPlaced(state: GameState, pid: string): number {
  return (
    Object.values(state.actionSpaces).filter((s) => s.workerId === pid).length +
    state.revealedRoundCards.filter((rc) => rc.workerId === pid).length
  );
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GamePage({ onExit }: GamePageProps) {
  const { gameState, setGameState } = useAgricolaStore();

  // 농장 보기 탭: 현재 플레이어 또는 다른 플레이어 인덱스
  const [viewingPlayerIdx, setViewingPlayerIdx] = useState(0);

  // 바둑 방식 워커 배치: 선택된 가족 구성원 셀 좌표
  const [selectedFamilyCell, setSelectedFamilyCell] = useState<[number, number] | null>(null);

  // Undo 스택 (마지막 액션 이전 state 보관)
  const [history, setHistory] = useState<GameState[]>([]);

  // 플레이어별 누적 소요 시간 (초)
  const [playerTimers, setPlayerTimers] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPlayerIdRef = useRef<string>('');

  if (!gameState) {
    return <div className="p-8 text-center">게임 상태 없음</div>;
  }

  const gs: GameState = gameState;

  const currentPlayerId = gs.playerOrder[gs.currentPlayerIndex] ?? '';
  const currentPlayer = gs.players[currentPlayerId];
  const isGameOver = gs.phase === 'gameover';

  const allWorkersPlaced =
    gs.roundPhase === 'work' &&
    gs.playerOrder.every((pid) => {
      const p = gs.players[pid];
      return p && countPlaced(gs, pid) >= p.familySize;
    });

  const pendingLabel = PENDING_LABELS[gs.roundPhase];

  // 농장 탭 동기화: 현재 플레이어가 바뀌면 해당 탭으로 이동
  if (prevPlayerIdRef.current !== currentPlayerId && gs.phase === 'playing') {
    prevPlayerIdRef.current = currentPlayerId;
    const idx = gs.playerOrder.indexOf(currentPlayerId);
    if (idx >= 0) setViewingPlayerIdx(idx);
  }

  // 타이머: 현재 플레이어의 생각 시간 측정
  useEffect(() => {
    if (gs.phase !== 'playing' || allWorkersPlaced) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setPlayerTimers((prev) => ({
        ...prev,
        [currentPlayerId]: (prev[currentPlayerId] ?? 0) + 1,
      }));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentPlayerId, gs.phase, allWorkersPlaced]);

  const viewingPlayerId = gs.playerOrder[viewingPlayerIdx] ?? '';
  const viewingPlayer = gs.players[viewingPlayerId];

  // ── Undo 래퍼: 주요 액션 전 현재 state 보존 ────────────────────
  function saveAndSet(newState: GameState) {
    setHistory((prev) => [...prev.slice(-9), gs]); // 최대 10개 유지
    setGameState(newState);
  }

  function handleUndo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setGameState(prev);
    setSelectedFamilyCell(null);
  }

  // ── 핸들러 ──────────────────────────────────────────────────────

  function handleStartGame() {
    let s = startRound(gs);
    s = replenishActionSpaces(s);
    setGameState({ ...s, phase: 'playing' });
  }

  // 가족 구성원 클릭 — 선택 토글 (바둑 방식)
  function handleFamilyMemberClick(r: number, c: number) {
    // 이미 같은 셀 선택 시 해제
    if (selectedFamilyCell && selectedFamilyCell[0] === r && selectedFamilyCell[1] === c) {
      setSelectedFamilyCell(null);
    } else {
      setSelectedFamilyCell([r, c]);
    }
  }

  function handleActionSelect(actionSpaceId: string) {
    if (gs.roundPhase !== 'work') return;
    if (!selectedFamilyCell) return;
    const pid = gs.playerOrder[gs.currentPlayerIndex];
    if (!pid) return;
    const player = gs.players[pid];
    if (!player || countPlaced(gs, pid) >= player.familySize) return;
    try {
      let s = placeWorker(gs, pid, actionSpaceId);
      if (s.roundPhase === 'work') s = advanceToNextPlayer(s);
      setSelectedFamilyCell(null);
      saveAndSet(s);
    } catch (e) { console.error('placeWorker 오류:', e); }
  }

  // 대시설 건설 선택
  function handleMajorImpSelect(majorId: string) {
    try {
      const s = buildMajorImprovement(gs, currentPlayerId, majorId);
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) { alert((e as Error).message); }
  }

  function handleEndRound() {
    let s = returnWorkers(gs);
    if (isHarvestRound(gs.round)) s = runHarvest(s);
    if (gs.round >= 14) {
      setGameState({ ...s, phase: 'gameover' });
    } else {
      s = startRound(s);
      s = replenishActionSpaces(s);
      setGameState(s);
    }
  }

  function handleCellClick(r: number, c: number) {
    // 현재 플레이어 탭을 보고 있을 때만 클릭 유효
    if (viewingPlayerId !== currentPlayerId) return;
    const phase = gs.roundPhase;
    if (phase === 'pending_build_room') {
      try {
        const s = buildRoom(gs, currentPlayerId, r, c);
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { alert((e as Error).message); }
    } else if (phase === 'pending_build_stable') {
      try {
        const s = buildStable(gs, currentPlayerId, r, c);
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { alert((e as Error).message); }
    } else if (phase === 'pending_plow') {
      try {
        const s = plowField(gs, currentPlayerId, r, c);
        saveAndSet({ ...s, roundPhase: 'work' });
      } catch (e) { console.error(e); }
    } else if (phase === 'pending_plow_sow') {
      try {
        const s = plowField(gs, currentPlayerId, r, c);
        saveAndSet({ ...s, roundPhase: 'pending_sow' });
      } catch (e) { console.error(e); }
    } else if (phase === 'pending_sow') {
      try {
        const player = gs.players[currentPlayerId];
        const crop: 'grain' | 'vegetable' =
          (player?.resources.grain ?? 0) > 0 ? 'grain' : 'vegetable';
        const s = sowField(gs, currentPlayerId, r, c, crop);
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { console.error(e); }
    }
  }

  // 가축 시장 동물 선택 처리
  function handleAnimalSelect(animalType: AnimalType) {
    try {
      const s = getAnimalFromMarket(gs, currentPlayerId, animalType);
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) { alert((e as Error).message); }
  }

  // 방 만들기·외양간 짓기 — 어떤 걸 지을지 선택
  function handleBuildChoice(choice: 'room' | 'stable' | 'both') {
    if (choice === 'room') {
      setGameState({ ...gs, roundPhase: 'pending_build_room' });
    } else if (choice === 'stable') {
      setGameState({ ...gs, roundPhase: 'pending_build_stable' });
    } else {
      // 둘 다: 방 먼저, 완료 후 외양간 선택 — 방 건설 후 외양간도 이어서
      setGameState({ ...gs, roundPhase: 'pending_build_room' });
    }
  }

  function handlePendingConfirm() {
    const phase = gs.roundPhase;
    try {
      if (phase === 'pending_family_growth') {
        // RC_BASIC_WISH / MODEST_WISH — 방 필요 + Modest는 5라운드 조건
        let s: GameState;
        if (gs.round < 5) {
          // 소박한 가족 늘리기: 5라운드 미만이면 에러
          const actionId = Object.keys(gs.actionSpaces).find(
            (id) => gs.actionSpaces[id]?.workerId === currentPlayerId
          );
          if (actionId === 'V2_MODEST_WISH' || actionId === 'V34_MODEST_WISH') {
            throw new Error('소박한 가족 늘리기는 5라운드부터 가능합니다');
          }
        }
        s = growFamily(gs, currentPlayerId, true);
        setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } else if (phase === 'pending_family_growth_urgent') {
        // RC_URGENT_WISH — 방 불필요
        const s = growFamily(gs, currentPlayerId, false);
        setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } else if (phase === 'pending_renovate' || phase === 'pending_renovate_fence') {
        const s = renovateHouse(gs, currentPlayerId);
        const next: GameState['roundPhase'] =
          phase === 'pending_renovate_fence' ? 'pending_fence' : 'work';
        setGameState({ ...s, roundPhase: next });
      } else if (phase === 'pending_fence' || phase === 'pending_build_stable') {
        // 울타리 또는 외양간 건설은 별도 UI로 처리, 여기서는 건너뜀
        setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }));
      } else {
        setGameState({ ...gs, roundPhase: 'work' });
      }
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // ── 워커 pip 렌더 ──────────────────────────────────────────────
  function WorkerPips({ pid }: { pid: string }) {
    const p = gs.players[pid];
    if (!p) return null;
    const placed = countPlaced(gs, pid);
    const total = p.familySize;
    const color = WORKER_DOT_COLORS[p.color] ?? 'bg-gray-400';
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={[
              'w-2.5 h-2.5 rounded-full border border-white',
              i < placed ? 'opacity-30 bg-gray-400' : color,
            ].join(' ')}
            title={i < placed ? '배치됨' : '남은 일꾼'}
          />
        ))}
      </div>
    );
  }

  // ── 렌더 ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-300 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-amber-800">
            <span aria-hidden="true">🌾</span> 아그리콜라
          </h1>
          <span className="text-sm text-gray-500">
            {gs.phase === 'setup'
              ? '시작 전'
              : `${gs.round}라운드 / 스테이지 ${gs.stage}`}
          </span>
          {isHarvestRound(gs.round) && gs.phase !== 'setup' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
              🌾 수확 라운드
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="text-xs px-2 py-1 bg-stone-200 border border-stone-400 text-stone-700 rounded hover:bg-stone-300"
            >
              ↩ 되돌리기
            </button>
          )}
          <button onClick={onExit} className="text-sm text-gray-400 hover:text-gray-600">
            종료
          </button>
        </div>
      </div>

      {/* 플레이어 상태 바 — 차례 강조 */}
      {gs.phase === 'playing' && (
        <div className="flex gap-2 mb-3">
          {gs.playerOrder.map((pid) => {
            const p = gs.players[pid];
            if (!p) return null;
            const isActive = pid === currentPlayerId && !allWorkersPlaced;
            const colorStyle = PLAYER_COLORS[p.color] ?? PLAYER_COLORS.red;
            const totalSec = playerTimers[pid] ?? 0;
            return (
              <div
                key={pid}
                className={[
                  'flex-1 rounded-lg px-3 py-2 border-2 transition-all duration-300',
                  isActive ? `${colorStyle.bg} ${colorStyle.ring} ring-2 shadow-md` : 'bg-white border-gray-200 opacity-70',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isActive ? colorStyle.text : 'text-gray-600'}`}>
                    {isActive && <span aria-hidden="true">▶ </span>}
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{formatSeconds(totalSec)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <WorkerPips pid={pid} />
                  <span className="text-xs text-gray-500">
                    {countPlaced(gs, pid)}/{p.familySize} 배치
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* pending 상태 안내 배너 */}
      {gs.roundPhase === 'pending_major_imp' ? (
        /* 대시설 선택 */
        <div className="mb-3 px-4 py-3 bg-stone-100 border-2 border-stone-400 rounded-lg">
          <p className="text-sm font-semibold text-stone-800 mb-2">🏭 주요 설비 건설 — 원하는 설비를 선택하세요</p>
          <div className="grid grid-cols-2 gap-1.5">
            {gs.majorImprovements
              .filter((m) => m.ownerId === null)
              .map((m) => {
                const costStr = m.cost
                  ? Object.entries(m.cost).map(([r, v]) => `${r} ${v}`).join(' + ')
                  : '무료';
                const canAfford = !m.cost || Object.entries(m.cost).every(
                  ([r, v]) => ((currentPlayer?.resources[r as keyof typeof currentPlayer.resources] ?? 0) as number) >= (v ?? 0)
                );
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMajorImpSelect(m.id)}
                    disabled={!canAfford}
                    className={[
                      'text-left text-xs px-2 py-1.5 rounded border transition-colors',
                      canAfford
                        ? 'bg-amber-50 border-amber-400 hover:bg-amber-100 text-stone-800'
                        : 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed opacity-60',
                    ].join(' ')}
                  >
                    <span className="font-medium">{m.nameKo}</span>
                    <span className="block text-[10px] text-stone-500">{costStr} · {m.victoryPoints}VP</span>
                  </button>
                );
              })}
          </div>
          <button
            onClick={() => setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }))}
            className="mt-2 text-xs px-3 py-1 rounded border bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300"
          >
            건너뜀
          </button>
        </div>
      ) : gs.roundPhase === 'pending_animal_select' ? (
        /* 가축 시장 — 동물 종 선택 */
        <div className="mb-3 px-4 py-2 bg-sky-50 border border-sky-300 rounded-lg">
          <p className="text-sm font-medium text-sky-800 mb-2">🐾 가축 시장 — 원하는 동물을 선택하세요</p>
          <div className="flex gap-2">
            <button onClick={() => handleAnimalSelect('sheep')}
              className="flex-1 text-xs px-2 py-1.5 bg-sky-100 border border-sky-300 rounded hover:bg-sky-200 font-medium">
              🐑 양 (음식 1 지불)
            </button>
            <button onClick={() => handleAnimalSelect('boar')}
              className="flex-1 text-xs px-2 py-1.5 bg-pink-100 border border-pink-300 rounded hover:bg-pink-200 font-medium">
              🐷 멧돼지 (무료)
            </button>
            <button onClick={() => handleAnimalSelect('cattle')}
              className="flex-1 text-xs px-2 py-1.5 bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 font-medium">
              🐄 소 (음식 1 지불)
            </button>
          </div>
        </div>
      ) : gs.roundPhase === 'pending_build_room' || gs.roundPhase === 'pending_build_stable' ? (
        /* 방 만들기·외양간 짓기 — 선택 버튼 + 셀 클릭 안내 */
        <div className="mb-3 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-amber-800">
              {gs.roundPhase === 'pending_build_room'
                ? '🏠 방 건설 — 기존 방에 인접한 빈 셀을 클릭하세요 (재료5+갈대2)'
                : '🐄 외양간 건설 — 빈 셀을 클릭하세요 (나무2)'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleBuildChoice('room')}
              className={`text-xs px-3 py-1 rounded border font-medium ${gs.roundPhase === 'pending_build_room' ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-amber-700 border-amber-400 hover:bg-amber-50'}`}>
              🏠 방 건설
            </button>
            <button onClick={() => handleBuildChoice('stable')}
              className={`text-xs px-3 py-1 rounded border font-medium ${gs.roundPhase === 'pending_build_stable' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-green-700 border-green-400 hover:bg-green-50'}`}>
              🐄 외양간 건설
            </button>
            <button onClick={() => setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }))}
              className="text-xs px-3 py-1 rounded border bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200 ml-auto">
              건너뜀
            </button>
          </div>
        </div>
      ) : pendingLabel ? (
        /* 일반 pending 배너 */
        <div className="mb-3 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">{pendingLabel}</span>
          <button
            onClick={handlePendingConfirm}
            className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            확인
          </button>
        </div>
      ) : null}

      {/* 게임 종료 */}
      {isGameOver ? (
        <div>
          <h2 className="text-2xl font-bold text-center mb-6">
            <span aria-hidden="true">🏆</span> 게임 종료
          </h2>
          <ScoreBoard state={gs} />
        </div>

      /* 시작 전 */
      ) : gs.phase === 'setup' ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-gray-600 mb-2">플레이어 {gs.playerOrder.length}명 준비 완료</p>
          {/* 초기 상태 미리보기 */}
          <div className="flex gap-4 mb-4">
            {gs.playerOrder.map((pid) => {
              const p = gs.players[pid];
              if (!p) return null;
              const colorStyle = PLAYER_COLORS[p.color] ?? PLAYER_COLORS.red;
              return (
                <div key={pid} className={`rounded-lg px-4 py-3 text-sm ${colorStyle.bg} border`}>
                  <div className={`font-bold ${colorStyle.text}`}>{p.name}</div>
                  <div className="text-gray-600 mt-1">
                    🏠 방 2개 · 👨 가족 {p.familySize}명 · 🍖 음식 {p.resources.food}개
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleStartGame}
            className="px-8 py-3 bg-amber-600 text-white rounded-xl font-medium text-lg hover:bg-amber-700 transition-colors duration-150"
          >
            게임 시작 (1라운드)
          </button>
        </div>

      /* 게임 진행 */
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 행동 보드 */}
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {allWorkersPlaced
                  ? '✅ 모든 일꾼 배치 완료'
                  : `${currentPlayer?.name ?? ''}의 차례`}
              </span>
              {allWorkersPlaced && (
                <button
                  onClick={handleEndRound}
                  className="text-sm px-4 py-1.5 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition-colors duration-150"
                >
                  {isHarvestRound(gs.round) ? '라운드 종료 + 수확' : '라운드 종료'}
                </button>
              )}
            </div>
            <ActionBoard
              state={gs}
              currentPlayerId={currentPlayerId}
              onActionSelect={handleActionSelect}
              workerReady={!!selectedFamilyCell}
            />
          </div>

          {/* 농장 + 자원 — 탭으로 플레이어 전환 */}
          <div>
            {/* 플레이어 탭 */}
            <div className="flex gap-1 mb-2">
              {gs.playerOrder.map((pid, idx) => {
                const p = gs.players[pid];
                if (!p) return null;
                const isActive = pid === currentPlayerId;
                const colorStyle = PLAYER_COLORS[p.color] ?? PLAYER_COLORS.red;
                return (
                  <button
                    key={pid}
                    onClick={() => setViewingPlayerIdx(idx)}
                    className={[
                      'flex-1 text-xs py-1.5 px-2 rounded-t border-b-2 transition-colors duration-150',
                      viewingPlayerIdx === idx
                        ? `${colorStyle.bg} border-current ${colorStyle.text} font-bold`
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {isActive && <span aria-hidden="true">▶</span>} {p.name}
                  </button>
                );
              })}
            </div>

            {/* 선택된 플레이어 농장 */}
            {viewingPlayer && (
              <div className={[
                'rounded-lg p-2',
                viewingPlayerId === currentPlayerId ? 'bg-white ring-1 ring-amber-300' : 'bg-gray-50 opacity-90',
              ].join(' ')}>
                {viewingPlayerId !== currentPlayerId && (
                  <div className="text-xs text-gray-400 mb-1 text-center">👁 보기 전용</div>
                )}
                <FarmBoard
                  board={viewingPlayer.farm}
                  familySize={viewingPlayer.familySize}
                  deployedCount={viewingPlayerId === currentPlayerId ? countPlaced(gs, currentPlayerId) : viewingPlayer.familySize}
                  selectedFamilyCell={viewingPlayerId === currentPlayerId ? selectedFamilyCell : null}
                  onCellClick={viewingPlayerId === currentPlayerId ? handleCellClick : undefined}
                  onFamilyMemberClick={viewingPlayerId === currentPlayerId ? handleFamilyMemberClick : undefined}
                  fencingMode={
                    viewingPlayerId === currentPlayerId &&
                    (gs.roundPhase === 'pending_fence' || gs.roundPhase === 'pending_renovate_fence')
                  }
                />
                <div className="mt-3">
                  <ResourcePanel player={viewingPlayer} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
