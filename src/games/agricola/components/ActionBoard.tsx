/**
 * ActionBoard — 행동 공간 목록 + 워커 배치 UI
 * Phase 1 구현. v2: 행동 설명 + 신규 라운드카드 강조 + 비용 힌트 추가
 */

import type { GameState, PlayerId, ActionSpaceState, RoundCardState, Resources } from '../lib/types.js';

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

export const RESOURCE_ICONS: Record<string, string> = {
  wood: '🪵', clay: '🧱', stone: '🪨', reed: '🌿',
  grain: '🌾', vegetable: '🥕', food: '🍖',
  sheep: '🐑', boar: '🐷', cattle: '🐄',
};

/** 행동 공간별 한국어 설명 및 비용 정보 */
const ACTION_INFO: Record<string, { desc: string; cost?: Partial<Resources> }> = {
  // ─ 영구 행동 공간 ─
  FOREST:         { desc: '🪵×3 누적 획득' },
  CLAY_PIT:       { desc: '🧱×1 누적 획득' },
  REED_BANK:      { desc: '🌿×1 누적 획득' },
  FISHING:        { desc: '🍖×1 누적 획득' },
  GRAIN_SEEDS:    { desc: '🌾×1 즉시 획득' },
  FARMLAND:       { desc: '빈 셀 1칸 → 밭으로 전환' },
  LESSONS:        { desc: '직업 카드 1장 플레이 (첫 번째 무료)' },
  DAY_LABORER:    { desc: '🍖×2 즉시 획득' },
  FARM_EXPANSION: { desc: '방(🏠) 또는 외양간 건설' },
  MEETING_PLACE:  { desc: '선플레이어 토큰 + 소시설 플레이' },
  // ─ 인원 확장 공간 ─
  EXT4_COPSE:     { desc: '🪵×1 누적 획득' },
  EXT4_GROVE:     { desc: '🪵×2 누적 획득' },
  EXT4_HOLLOW:    { desc: '🧱×2 누적 획득' },
  EXT4_RES_MKT:   { desc: '🌿×1 + 🪨×1 + 🍖×1 즉시' },
  EXT4_LESSONS_A: { desc: '직업 카드 1장 플레이' },
  EXT4_TRAVEL:    { desc: '🍖 누적 + 이번 라운드 워커 추가' },
  EXT3_CLAY:      { desc: '🧱×1 누적 획득' },
  EXT3_LESSONS:   { desc: '직업 카드 1장 플레이' },
  V2_FOREST:      { desc: '🪵×1 누적 획득' },
  V2_RES_MKT:     { desc: '🪨×1 + 🍖×1 즉시' },
  V2_ANIMAL_MKT:  { desc: '🐑×1+🍖×1 or 🐷×1 or 🐄×1-🍖×1' },
  V2_FAMILY_GROWTH: { desc: '가족 늘리기 (방 필요)' },
  // ─ 라운드 카드 (실제 ID 기준) ─
  RC_MAJOR_IMP:   { desc: '대시설(🏭) 또는 소시설 건설' },
  RC_FENCING:     { desc: '목장 울타리 건설 (🪵 1/칸)' },
  RC_GRAIN_UTIL:  { desc: '씨 뿌리기 or 빵 굽기' },
  RC_BASIC_WISH:  { desc: '가족 늘리기 (빈 방 필요)' },
  RC_HOUSE_RENO:  { desc: '집 개량 (재료×방수 + 🌿×1)' },
  RC_VEG_SEEDS:   { desc: '🥕×1 즉시 획득' },
  RC_URGENT_WISH: { desc: '가족 늘리기 (방 없어도 가능)' },
  RC_CULTIVATION: { desc: '밭 갈기 + 씨 뿌리기' },
  RC_FARM_RENO:   { desc: '집 개량 + 울타리 건설' },
  // 누적 카드(양/돼지/소/채석장)는 accumulatedResources 배지로 표시
};

function WorkerDot({ playerId, state }: { playerId: string; state: GameState }) {
  const color = state.players[playerId]?.color ?? 'red';
  return (
    <span
      aria-label={`워커: ${state.players[playerId]?.name ?? playerId}`}
      className={`inline-block w-3.5 h-3.5 rounded-full border border-white ${PLAYER_COLORS[color] ?? 'bg-gray-400'}`}
    />
  );
}

function ActionSpaceRow({
  id,
  nameKo,
  accumulated,
  workerId,
  state,
  currentPlayerId,
  isRound,
  isNewest,
  onSelect,
}: {
  id: string;
  nameKo: string;
  accumulated: Partial<Resources>;
  workerId: string | null;
  state: GameState;
  currentPlayerId: PlayerId;
  isRound: boolean;
  isNewest: boolean;
  onSelect?: () => void;
}) {
  const isOccupied = workerId !== null;
  const isMine = workerId === currentPlayerId;
  const canPlace = !isOccupied && state.roundPhase === 'work';

  const accEntries = Object.entries(accumulated).filter(([, v]) => (v as number) > 0);
  const info = ACTION_INFO[id];

  return (
    <div
      onClick={canPlace ? onSelect : undefined}
      className={[
        'flex flex-col gap-0.5 px-3 py-2 rounded text-sm transition-colors duration-150',
        isRound ? 'border-l-4 border-amber-500' : 'border-l-4 border-stone-400',
        isNewest ? 'ring-1 ring-amber-400 bg-amber-50' : '',
        isOccupied
          ? isMine ? 'bg-blue-50 opacity-80' : 'bg-gray-100 opacity-60'
          : canPlace ? 'bg-white hover:bg-amber-50 cursor-pointer' : 'bg-white',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        {/* 행동 이름 */}
        <span className="font-medium w-28 shrink-0 text-gray-800">{nameKo}</span>

        {/* 신규 배지 */}
        {isNewest && (
          <span className="text-[10px] px-1 py-0.5 bg-amber-500 text-white rounded font-bold">NEW</span>
        )}

        {/* 누적 자원 배지 */}
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

      {/* 행동 설명 */}
      {info?.desc && (
        <span className="text-[11px] text-gray-500 pl-0.5">{info.desc}</span>
      )}
    </div>
  );
}

export default function ActionBoard({ state, currentPlayerId, onActionSelect }: ActionBoardProps) {
  const permanent = Object.entries(state.actionSpaces);
  const rounds: RoundCardState[] = state.revealedRoundCards;

  // 이번 라운드에 새로 공개된 카드 ID (가장 마지막에 추가된 것)
  const newestCardId = rounds.length > 0 ? rounds[rounds.length - 1]?.space.id : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        영구 행동 공간
      </div>

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
          isNewest={false}
          onSelect={() => onActionSelect?.(id)}
        />
      ))}

      {rounds.length > 0 && (
        <>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-2 mb-1">
            라운드 카드 (총 {rounds.length}장 공개)
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
              isNewest={rc.space.id === newestCardId}
              onSelect={() => onActionSelect?.(rc.space.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
