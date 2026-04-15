/**
 * ActionBoard — 행동 공간 목록 + 워커 배치 UI
 * Phase 1 구현.
 */

import type { GameState, PlayerId, ActionSpaceState, RoundCardState } from '../lib/types.js';

interface ActionBoardProps {
  state: GameState;
  currentPlayerId: PlayerId;
  onActionSelect?: (actionSpaceId: string) => void;
}

const PLAYER_COLORS: Record<string, string> = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
};

function WorkerDot({ playerId, state }: { playerId: string; state: GameState }) {
  const color = state.players[playerId]?.color ?? 'red';
  return (
    <span
      aria-label={`워커: ${state.players[playerId]?.name ?? playerId}`}
      className={`inline-block w-4 h-4 rounded-full border border-white ${PLAYER_COLORS[color] ?? 'bg-gray-400'}`}
    />
  );
}

function ActionSpaceRow({
  id: _id,
  nameKo,
  accumulated,
  workerId,
  state,
  currentPlayerId,
  isRound,
  onSelect,
}: {
  id: string;
  nameKo: string;
  accumulated: Record<string, number>;
  workerId: string | null;
  state: GameState;
  currentPlayerId: PlayerId;
  isRound: boolean;
  onSelect?: () => void;
}) {
  const isOccupied = workerId !== null;
  const isMine = workerId === currentPlayerId;
  const canPlace = !isOccupied && state.roundPhase === 'work';

  // 누적 자원 표시
  const accEntries = Object.entries(accumulated).filter(([, v]) => v > 0);

  return (
    <div
      onClick={canPlace ? onSelect : undefined}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-150',
        isRound ? 'border-l-4 border-amber-500' : 'border-l-4 border-stone-400',
        isOccupied
          ? isMine ? 'bg-blue-50 opacity-80' : 'bg-gray-100 opacity-60'
          : canPlace ? 'bg-white hover:bg-amber-50 cursor-pointer' : 'bg-white',
      ].join(' ')}
    >
      {/* 행동 공간 이름 */}
      <span className="font-medium w-28 shrink-0 text-gray-800">{nameKo}</span>

      {/* 누적 자원 */}
      <span className="flex gap-1 text-xs text-amber-700 flex-1">
        {accEntries.map(([res, cnt]) => (
          <span key={res} className="bg-amber-100 px-1 rounded">
            {RESOURCE_ICONS[res] ?? res} {cnt}
          </span>
        ))}
      </span>

      {/* 워커 표시 */}
      {workerId && <WorkerDot playerId={workerId} state={state} />}
    </div>
  );
}

const RESOURCE_ICONS: Record<string, string> = {
  wood: '🪵', clay: '🧱', stone: '🪨', reed: '🌿',
  grain: '🌾', vegetable: '🥕', food: '🍖',
  sheep: '🐑', boar: '🐷', cattle: '🐄',
};

export default function ActionBoard({ state, currentPlayerId, onActionSelect }: ActionBoardProps) {
  // 영구 행동 공간
  const permanent = Object.entries(state.actionSpaces);

  // 공개된 라운드 카드
  const rounds: RoundCardState[] = state.revealedRoundCards;

  return (
    <div className="flex flex-col gap-1">
      {/* 라운드 헤더 */}
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        영구 행동 공간
      </div>

      {/* 영구 공간들 */}
      {permanent.map(([id, spaceState]: [string, ActionSpaceState]) => (
        <ActionSpaceRow
          key={id}
          id={id}
          nameKo={spaceState.space.nameKo}
          accumulated={spaceState.accumulatedResources}
          workerId={spaceState.workerId}
          state={state}
          currentPlayerId={currentPlayerId}
          isRound={false}
          onSelect={() => onActionSelect?.(id)}
        />
      ))}

      {/* 라운드 카드들 */}
      {rounds.length > 0 && (
        <>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-2 mb-1">
            라운드 카드 (스테이지 {state.stage})
          </div>
          {rounds.map((rc) => (
            <ActionSpaceRow
              key={rc.space.id}
              id={rc.space.id}
              nameKo={rc.space.nameKo}
              accumulated={rc.accumulatedResources}
              workerId={rc.workerId}
              state={state}
              currentPlayerId={currentPlayerId}
              isRound={true}
              onSelect={() => onActionSelect?.(rc.space.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
