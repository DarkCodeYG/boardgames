/**
 * ActionBoard — 행동 공간 목록 + 가족 말 배치 UI
 * Phase 1 구현. v2: 행동 설명 + 신규 라운드카드 강조 + 비용 힌트 추가
 */

import type { GameState, PlayerId, ActionSpaceState, RoundCardState, Resources } from '../lib/types.js';

interface ActionBoardProps {
  state: GameState;
  currentPlayerId: PlayerId;
  onActionSelect?: (actionSpaceId: string) => void;
  /** 가족 구성원 선택됨 → 행동칸 드롭 가능 상태 강조 */
  workerReady?: boolean;
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
  FOREST:           { desc: '🪵×3 누적 획득' },
  CLAY_PIT:         { desc: '🧱(흙)×1 누적 획득' },
  REED_BANK:        { desc: '🌿(갈대)×1 누적 획득' },
  FISHING:          { desc: '🍖×1 누적 획득' },
  GRAIN_SEEDS:      { desc: '🌾(곡식 종자)×1 즉시 획득' },
  FARMLAND:         { desc: '밭 타일 1개를 농장 칸에 내려놓기' },
  LESSONS:          { desc: '직업 카드 1장 플레이 (첫 번째 무료)' },
  DAY_LABORER:      { desc: '🍖×2 즉시 획득 (음식 보조)' },
  FARM_EXPANSION:   { desc: '방 건설(재료5+갈대2) 또는 외양간(나무2)' },
  MEETING_PLACE:    { desc: '시작 플레이어 되기 그리고/또는 보조 설비 1장 놓기' },
  // ─ 인원 확장 공간 ─
  EXT4_COPSE:       { desc: '🪵×1 누적 획득' },
  EXT4_GROVE:       { desc: '🪵×2 누적 획득' },
  EXT4_HOLLOW:      { desc: '흙×2 누적 획득' },
  EXT4_RES_MKT:     { desc: '🌿×1 + 🪨×1 + 🍖×1 즉시' },
  EXT4_LESSONS_A:   { desc: '직업 카드 1장 플레이' },
  EXT4_TRAVEL:      { desc: '🍖 누적 획득 + 이번 라운드 일꾼 1명 추가' },
  EXT3_CLAY:        { desc: '🧱×1 누적 획득' },
  EXT3_LESSONS:     { desc: '직업 카드 1장 플레이' },
  V2_COPSE:         { desc: '🪵×1 누적 획득' },
  V2_RES_MKT:       { desc: '🪨×1 + 🍖×1 즉시' },
  V2_ANIMAL_MKT:    { desc: '🐑+🍖 OR 🐷×1 OR 🐄×1 (선택)' },
  V34_ANIMAL_MKT:   { desc: '🐑+🍖 OR 🐷×1 OR 🐄×1 (선택)' },
  V2_MODEST_WISH:   { desc: '가족 늘리기 (5라운드 이후, 방 필요)' },
  V34_MODEST_WISH:  { desc: '가족 늘리기 (5라운드 이후, 방 필요)' },
  // ─ 라운드 카드 (실제 ID 기준) ─
  RC_MAJOR_IMP:     { desc: '주요 설비 또는 보조 설비 1장 건설' },
  RC_FENCING:       { desc: '목장 울타리 건설 (🪵 1개/칸)' },
  RC_GRAIN_UTIL:    { desc: '씨 뿌리기 그리고/또는 빵 굽기' },
  RC_BASIC_WISH:    { desc: '가족 늘리기 (빈 방 필요) + 보조 설비 1장 놓기' },
  RC_HOUSE_RENO:    { desc: '집 개조 (재료×방수 + 🌿×1) 후 주요 또는 보조 설비 1장 놓기' },
  RC_VEG_SEEDS:     { desc: '🥕(채소 종자)×1 즉시 획득' },
  RC_URGENT_WISH:   { desc: '가족 늘리기 (방 없어도 가능)' },
  RC_CULTIVATION:   { desc: '밭 1칸 갈기 + 씨 뿌리기' },
  RC_FARM_RENO:     { desc: '집 개조 + 울타리 건설 그리고/또는 보조 설비 1장 놓기' },
  // 누적 카드(양/돼지/소/채석장)는 accumulatedResources 배지로 표시
};

function WorkerDot({ playerId, state }: { playerId: string; state: GameState }) {
  const color = state.players[playerId]?.color ?? 'red';
  return (
    <span
      aria-label={`일꾼: ${state.players[playerId]?.name ?? playerId}`}
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
  workerReady,
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
  workerReady?: boolean;
  onSelect?: () => void;
}) {
  const isOccupied = workerId !== null;
  const isMine = workerId === currentPlayerId;
  // 가족 말 배치 가능: 빈 칸 + work 단계 + 가족 구성원 선택됨
  const canPlace = !isOccupied && state.roundPhase === 'work' && !!workerReady;

  const accEntries = Object.entries(accumulated).filter(([, v]) => (v as number) > 0);
  const info = ACTION_INFO[id];

  return (
    <div
      onClick={canPlace ? onSelect : undefined}
      className={[
        'relative flex flex-col gap-0.5 px-3 py-2 rounded text-sm transition-all duration-150',
        isRound ? 'border-l-4 border-amber-500' : 'border-l-4 border-stone-400',
        isOccupied
          ? isMine
            ? 'bg-amber-100 border border-amber-400'
            : 'bg-stone-100 opacity-60'
          : canPlace
            ? 'bg-amber-50 ring-2 ring-amber-500 cursor-pointer shadow-md hover:bg-amber-100 hover:shadow-lg'
            : workerReady
              ? 'bg-stone-50 opacity-40 cursor-not-allowed'
              : isNewest
                ? 'ring-1 ring-amber-600 bg-amber-50/60'
                : 'bg-stone-50 hover:bg-stone-100',
      ].join(' ')}
    >
      {/* 체스 착지 표시 — 배치 가능 칸에 초록 원형 배지 */}
      {canPlace && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm animate-pulse"
        >
          ●
        </span>
      )}

      <div className="flex items-center gap-2">
        {/* 신규 배지 */}
        {isNewest && !canPlace && (
          <span className="text-[10px] px-1 py-0.5 bg-amber-500 text-white rounded font-bold shrink-0">NEW</span>
        )}

        {/* 행동 이름 */}
        <span className={[
          'font-medium w-28 shrink-0',
          isOccupied && isMine ? 'text-amber-900' : 'text-gray-800',
        ].join(' ')}>{nameKo}</span>

        {/* 누적 자원 배지 */}
        <span className="flex gap-1 text-xs text-amber-700 flex-1">
          {accEntries.map(([res, cnt]) => (
            <span
              key={res}
              className={[
                'px-1 rounded border',
                res === 'reed' ? 'bg-white border-stone-300' : 'bg-amber-100 border-transparent',
              ].join(' ')}
            >
              {RESOURCE_ICONS[res] ?? res} {cnt}
            </span>
          ))}
        </span>

        {/* 배치된 가족 말 표시 — 크게 눈에 띄게 */}
        {workerId && (
          <div className="flex items-center gap-1">
            <WorkerDot playerId={workerId} state={state} />
          </div>
        )}
      </div>

      {/* 행동 설명 */}
      {info?.desc && (
        <span className={[
          'text-[11px] pl-0.5',
          canPlace ? 'text-amber-800 font-medium' : 'text-gray-500',
        ].join(' ')}>{info.desc}</span>
      )}
    </div>
  );
}

export default function ActionBoard({ state, currentPlayerId, onActionSelect, workerReady = false }: ActionBoardProps) {
  const permanent = Object.entries(state.actionSpaces);
  const rounds: RoundCardState[] = state.revealedRoundCards;

  // 이번 라운드에 새로 공개된 카드 ID (가장 마지막에 추가된 것)
  const newestCardId = rounds.length > 0 ? rounds[rounds.length - 1]?.space.id : null;

  return (
    <div className="bg-stone-100 border-2 border-stone-400 rounded-lg p-2 shadow-inner">
      <div className="flex flex-col gap-1">
      {workerReady && (
        <div className="text-xs text-amber-900 font-medium bg-amber-100 border-2 border-amber-500 rounded-lg px-3 py-1.5 mb-1 flex items-center gap-2 shadow-sm">
          <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full bg-amber-200 border-2 border-amber-700 inline-block" />
          <span>가족 구성원 선택됨</span>
          <span className="text-amber-700">— ● 표시 행동칸에 배치하세요</span>
        </div>
      )}
      <div className="text-xs text-amber-800 font-semibold uppercase tracking-widest border-b border-amber-300 pb-0.5 mb-1">
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
          workerReady={workerReady}
          onSelect={() => onActionSelect?.(id)}
        />
      ))}

      {rounds.length > 0 && (
        <>
          <div className="text-xs text-amber-800 font-semibold uppercase tracking-widest border-b border-amber-300 pb-0.5 mt-2 mb-1">
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
              workerReady={workerReady}
              onSelect={() => onActionSelect?.(rc.space.id)}
            />
          ))}
        </>
      )}
      </div>
    </div>
  );
}
