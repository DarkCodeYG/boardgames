/**
 * 아그리콜라 게임 페이지 — 메인 게임 화면
 * Phase 1 구현: placeWorker 연동 + 라운드 진행 버튼 + pending_* 상태 처리
 */

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
} from '../lib/game-engine.js';
import type { GameState } from '../lib/types.js';

interface GamePageProps {
  onExit: () => void;
}

/** 현재 플레이어에서 다음 워커 미배치 플레이어로 이동 */
function advanceToNextPlayer(state: GameState): GameState {
  const n = state.playerOrder.length;
  for (let i = 1; i <= n; i++) {
    const nextIdx = (state.currentPlayerIndex + i) % n;
    const pid = state.playerOrder[nextIdx] ?? '';
    const placed =
      Object.values(state.actionSpaces).filter((s) => s.workerId === pid).length +
      state.revealedRoundCards.filter((rc) => rc.workerId === pid).length;
    const player = state.players[pid];
    if (player && placed < player.familySize) {
      return { ...state, currentPlayerIndex: nextIdx };
    }
  }
  return state; // 모두 배치 완료 — 그대로 유지 (UI에서 "라운드 종료" 버튼 표시)
}

/** 플레이어가 배치한 워커 수 */
function countPlaced(state: GameState, pid: string): number {
  return (
    Object.values(state.actionSpaces).filter((s) => s.workerId === pid).length +
    state.revealedRoundCards.filter((rc) => rc.workerId === pid).length
  );
}

const PENDING_LABELS: Record<string, string> = {
  pending_plow: '밭 갈기 — 빈 셀(🟫)을 클릭하세요',
  pending_sow: '씨 뿌리기 — 밭(🌱)을 클릭하세요',
  pending_plow_sow: '밭 갈고 씨 뿌리기 — 먼저 빈 셀을 클릭하세요',
  pending_fence: '울타리 건설 — 울타리 선분을 클릭하세요',
  pending_renovate: '집 개량 — 아래 확인 버튼을 누르세요',
  pending_renovate_fence: '집 개량 + 울타리 — 아래 확인 버튼을 누르세요',
  pending_family_growth: '가족 늘리기 — 아래 확인 버튼을 누르세요',
  pending_animal_choice: '동물 배치 — 확인 버튼을 누르세요',
};

export default function GamePage({ onExit }: GamePageProps) {
  const { gameState, setGameState } = useAgricolaStore();

  if (!gameState) {
    return <div className="p-8 text-center">게임 상태 없음</div>;
  }

  // 클로저 내에서 null 타입 narrowing을 유지하기 위해 캡처
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

  const currentPlaced = countPlaced(gs, currentPlayerId);
  const currentTotal = currentPlayer?.familySize ?? 0;
  const pendingLabel = PENDING_LABELS[gs.roundPhase];

  // ── 핸들러 ──────────────────────────────────────────────────────

  function handleStartGame() {
    let s = startRound(gs);
    s = replenishActionSpaces(s);
    setGameState({ ...s, phase: 'playing' });
  }

  function handleActionSelect(actionSpaceId: string) {
    if (gs.roundPhase !== 'work') return;
    const pid = gs.playerOrder[gs.currentPlayerIndex];
    if (!pid) return;
    const player = gs.players[pid];
    if (!player || countPlaced(gs, pid) >= player.familySize) return;

    try {
      let s = placeWorker(gs, pid, actionSpaceId);
      // pending_* 상태가 설정되지 않았을 때만 다음 플레이어로 이동
      if (s.roundPhase === 'work') {
        s = advanceToNextPlayer(s);
      }
      setGameState(s);
    } catch (e) {
      console.error('placeWorker 오류:', e);
    }
  }

  function handleEndRound() {
    let s = returnWorkers(gs);
    if (isHarvestRound(gs.round)) {
      s = runHarvest(s);
    }
    if (gs.round >= 14) {
      setGameState({ ...s, phase: 'gameover' });
    } else {
      s = startRound(s);
      s = replenishActionSpaces(s);
      setGameState(s);
    }
  }

  function handleCellClick(r: number, c: number) {
    const phase = gs.roundPhase;
    if (phase === 'pending_plow') {
      try {
        const s = plowField(gs, currentPlayerId, r, c);
        setGameState({ ...s, roundPhase: 'work' });
      } catch (e) { console.error(e); }
    } else if (phase === 'pending_plow_sow') {
      try {
        const s = plowField(gs, currentPlayerId, r, c);
        setGameState({ ...s, roundPhase: 'pending_sow' });
      } catch (e) { console.error(e); }
    } else if (phase === 'pending_sow') {
      try {
        const player = gs.players[currentPlayerId];
        const crop: 'grain' | 'vegetable' =
          (player?.resources.grain ?? 0) > 0 ? 'grain' : 'vegetable';
        const s = sowField(gs, currentPlayerId, r, c, crop);
        setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { console.error(e); }
    }
  }

  function handlePendingConfirm() {
    const phase = gs.roundPhase;
    try {
      if (phase === 'pending_family_growth') {
        const s = growFamily(gs, currentPlayerId, false);
        setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } else if (phase === 'pending_renovate' || phase === 'pending_renovate_fence') {
        const s = renovateHouse(gs, currentPlayerId);
        const next: GameState['roundPhase'] =
          phase === 'pending_renovate_fence' ? 'pending_fence' : 'work';
        setGameState({ ...s, roundPhase: next });
      } else {
        setGameState({ ...gs, roundPhase: 'work' });
      }
    } catch (e) {
      console.error('pending 확인 오류:', e);
      setGameState({ ...gs, roundPhase: 'work' });
    }
  }

  // ── 렌더 ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
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
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">수확</span>
          )}
        </div>
        <button onClick={onExit} className="text-sm text-gray-400 hover:text-gray-600">
          종료
        </button>
      </div>

      {/* pending 상태 안내 배너 */}
      {pendingLabel && (
        <div className="mb-3 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">{pendingLabel}</span>
          <button
            onClick={handlePendingConfirm}
            className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            확인
          </button>
        </div>
      )}

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
          <p className="text-gray-600">플레이어 {gs.playerOrder.length}명 준비 완료</p>
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
                  ? '모든 워커 배치 완료'
                  : `${currentPlayer?.name ?? ''}의 차례  (${currentPlaced}/${currentTotal} 배치)`}
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
            />
          </div>

          {/* 농장 + 자원 */}
          <div>
            {currentPlayer && (
              <>
                <div className="mb-2 font-medium text-sm text-gray-700">
                  {currentPlayer.name}의 농장
                </div>
                <FarmBoard
                  board={currentPlayer.farm}
                  onCellClick={handleCellClick}
                  fencingMode={
                    gs.roundPhase === 'pending_fence' ||
                    gs.roundPhase === 'pending_renovate_fence'
                  }
                />
                <div className="mt-3">
                  <ResourcePanel player={currentPlayer} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
