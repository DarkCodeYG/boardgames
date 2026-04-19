/**
 * 농장 보드 컴포넌트 — 3×5 그리드 + 울타리 오버레이
 * Phase 1 구현. v3: 바둑 방식 워커 배치 (가족 구성원 선택→행동칸 드롭)
 */

import type { FarmBoard as FarmBoardType, AnimalType } from '../lib/types.js';
import FarmCell, { type FamilyMemberState } from './FarmCell.js';

const ANIMAL_ICON: Record<AnimalType, string> = { sheep: '🐑', boar: '🐷', cattle: '🐄' };
const ANIMAL_NAME: Record<AnimalType, string> = { sheep: '양', boar: '멧돼지', cattle: '소' };

interface FarmBoardProps {
  board: FarmBoardType;
  onCellClick?: (row: number, col: number) => void;
  onFamilyMemberClick?: (row: number, col: number) => void;
  onFenceClick?: (orientation: 'horizontal' | 'vertical', r: number, c: number) => void;
  fencingMode?: boolean;
  selectedCell?: [number, number] | null;
  /** 가족 구성원 수 */
  familySize?: number;
  /** 이미 배치된 워커 수 (deployed 상태 계산용) */
  deployedCount?: number;
  /** 선택된 가족 구성원 셀 좌표 */
  selectedFamilyCell?: [number, number] | null;
  /** 플레이어 색상 (토큰 색상 표시용) */
  playerColor?: string;
  /** 선택 중인 울타리 세그먼트 (미확정, 주황색 강조) */
  pendingFenceSegments?: Array<{ type: 'h' | 'v'; row: number; col: number }>;
  /** 가축 배치 모드: 배치할 동물 종류 */
  animalPlacementType?: AnimalType | null;
  /** 가축 배치 목장 선택 (목장 인덱스 또는 'house') */
  onAnimalPlace?: (destination: number | 'house') => void;
  /** 가축 제거(교체) 모드: 기존 동물 클릭으로 제거 */
  animalRemovalMode?: boolean;
  onAnimalRemove?: (location: { type: 'pasture'; index: number } | { type: 'house' }) => void;
  /** 선플레이어 토큰 보유 여부 — 마커 표시 */
  isStartingPlayer?: boolean;
}

const ROWS = 3;
const COLS = 5;

/** 방 셀 좌표 목록 (읽기 순서) */
function getRoomCells(board: FarmBoardType): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board.grid[r]?.[c];
      if (cell === 'room_wood' || cell === 'room_clay' || cell === 'room_stone') {
        cells.push([r, c]);
      }
    }
  }
  return cells;
}

export default function FarmBoard({
  board,
  onCellClick,
  onFamilyMemberClick,
  onFenceClick,
  fencingMode = false,
  selectedCell = null,
  familySize = 0,
  deployedCount = 0,
  selectedFamilyCell = null,
  playerColor,
  pendingFenceSegments = [],
  animalPlacementType = null,
  onAnimalPlace,
  animalRemovalMode = false,
  onAnimalRemove,
  isStartingPlayer = false,
}: FarmBoardProps) {
  // 방 셀에 가족 구성원 상태 부여
  // 읽기 순서로: 첫 deployedCount 방 → 'deployed', 나머지 → 'available'
  const roomCells = getRoomCells(board);
  const familyMemberMap = new Map<string, FamilyMemberState>();
  const visibleCount = Math.min(familySize, roomCells.length);

  for (let i = 0; i < visibleCount; i++) {
    const [r, c] = roomCells[i]!;
    const key = `${r}-${c}`;
    if (i < deployedCount) {
      familyMemberMap.set(key, 'deployed');
    } else {
      familyMemberMap.set(key, 'available');
    }
  }

  // 선택된 셀은 'selected'로 덮어쓰기
  if (selectedFamilyCell) {
    const [sr, sc] = selectedFamilyCell;
    familyMemberMap.set(`${sr}-${sc}`, 'selected');
  }

  // 셀이 속한 목장 찾기
  function pastureForCell(r: number, c: number) {
    return board.pastures.find((p) => p.cells.some(([pr, pc]) => pr === r && pc === c));
  }

  // 외양간 위치 확인
  function hasStable(r: number, c: number) {
    return board.stables.some(([sr, sc]) => sr === r && sc === c);
  }

  // 씨 뿌린 밭 확인
  function sownFieldAt(r: number, c: number) {
    return board.sownFields.find((f) => f.row === r && f.col === c);
  }

  // 울타리 스타일 (새 좌표계: v[r][c] = c열 왼쪽 경계)
  function borderClasses(r: number, c: number): string {
    const borders: string[] = [];
    if (board.fences.horizontal[r]?.[c]) borders.push('border-t-[3px] border-t-amber-800');
    if (board.fences.horizontal[r + 1]?.[c]) borders.push('border-b-[3px] border-b-amber-800');
    if (board.fences.vertical[r]?.[c]) borders.push('border-l-[3px] border-l-amber-800');
    if (board.fences.vertical[r]?.[c + 1]) borders.push('border-r-[3px] border-r-amber-800');
    return borders.join(' ');
  }

  return (
    <div className="p-2 bg-amber-950/20 rounded-lg border-4 border-amber-900 shadow-xl inline-block">
      {isStartingPlayer && (
        <div className="flex items-center gap-1 mb-1 px-1">
          <span aria-hidden="true" className="text-sm">⭐</span>
          <span className="text-xs font-bold text-yellow-700">선플레이어</span>
        </div>
      )}
      <div className="relative inline-block">
      {/* 메인 그리드 */}
      <div
        className="grid border-2 border-amber-900"
        style={{ gridTemplateColumns: `repeat(${COLS}, 3.5rem)`, gridTemplateRows: `repeat(${ROWS}, 3.5rem)` }}
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const pasture = pastureForCell(r, c);
            const fmState = familyMemberMap.get(`${r}-${c}`) ?? 'none';
            const isRoom = fmState !== 'none';
            const isFirstRoom = roomCells[0]?.[0] === r && roomCells[0]?.[1] === c;

            // 클릭 핸들러: 방의 available/selected → 가족 선택, 그 외 → 셀 클릭
            function handleClick() {
              if (isRoom && (fmState === 'available' || fmState === 'selected')) {
                onFamilyMemberClick?.(r, c);
              } else {
                onCellClick?.(r, c);
              }
            }

            return (
              <div key={`${r}-${c}`} className={borderClasses(r, c)}>
                <FarmCell
                  row={r}
                  col={c}
                  cellType={board.grid[r]?.[c] ?? 'empty'}
                  sownField={sownFieldAt(r, c)}
                  pasture={pasture}
                  isSelected={isSelected}
                  hasStable={hasStable(r, c)}
                  familyMemberState={fmState}
                  playerColor={playerColor}
                  houseAnimals={isFirstRoom && board.animalsInHouse.length > 0 ? board.animalsInHouse : undefined}
                  onClick={handleClick}
                />
              </div>
            );
          })
        )}
      </div>

      {/* 울타리 모드 오버레이 */}
      {fencingMode && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* ── 수평 울타리 버튼 (r=0..3, 외벽 포함) ── */}
          {Array.from({ length: ROWS + 1 }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const built   = board.fences.horizontal[r]?.[c] ?? false;
              const pending = pendingFenceSegments.some((s) => s.type === 'h' && s.row === r && s.col === c);
              return (
                <button
                  key={`h-${r}-${c}`}
                  aria-label={`수평 울타리 (${r},${c})`}
                  onClick={() => onFenceClick?.('horizontal', r, c)}
                  className={[
                    'pointer-events-auto absolute w-14 h-3 -translate-y-1.5 rounded-sm transition-all',
                    built   ? 'bg-amber-800 opacity-100' :
                    pending ? 'bg-orange-500 opacity-90 ring-1 ring-orange-300' :
                              'bg-amber-400 opacity-40 hover:opacity-80 cursor-pointer',
                  ].join(' ')}
                  style={{ top: `${r * 3.5}rem`, left: `${c * 3.5}rem` }}
                />
              );
            })
          )}
          {/* ── 수직 울타리 버튼 (c=0..5, 외벽 포함; v[r][c] = c열 왼쪽) ── */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS + 1 }, (_, c) => {
              const built   = board.fences.vertical[r]?.[c] ?? false;
              const pending = pendingFenceSegments.some((s) => s.type === 'v' && s.row === r && s.col === c);
              return (
                <button
                  key={`v-${r}-${c}`}
                  aria-label={`수직 울타리 (${r},${c})`}
                  onClick={() => onFenceClick?.('vertical', r, c)}
                  className={[
                    'pointer-events-auto absolute h-14 w-3 -translate-x-1.5 rounded-sm transition-all',
                    built   ? 'bg-amber-800 opacity-100' :
                    pending ? 'bg-orange-500 opacity-90 ring-1 ring-orange-300' :
                              'bg-amber-400 opacity-40 hover:opacity-80 cursor-pointer',
                  ].join(' ')}
                  style={{ top: `${r * 3.5}rem`, left: `${c * 3.5}rem` }}
                />
              );
            })
          )}
        </div>
      )}

      {/* 가축 배치 모드 오버레이 */}
      {animalPlacementType && onAnimalPlace && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 목장별 배치 버튼 — 각 목장의 첫 번째 셀 위에 표시 */}
          {board.pastures.map((pasture, idx) => {
            const firstCell = pasture.cells[0];
            if (!firstCell) return null;
            const [pr, pc] = firstCell;
            const wrongType = pasture.animals !== null && pasture.animals.type !== animalPlacementType;
            const full      = (pasture.animals?.count ?? 0) >= pasture.capacity;
            if (wrongType || full) return null;
            const remaining = pasture.capacity - (pasture.animals?.count ?? 0);
            return (
              <button
                key={`place-${idx}`}
                aria-label={`목장 ${idx + 1}에 ${ANIMAL_NAME[animalPlacementType]} 배치`}
                onClick={() => onAnimalPlace(idx)}
                className="pointer-events-auto absolute flex flex-col items-center justify-center
                  w-14 h-14 bg-green-500/70 hover:bg-green-400/80 border-2 border-green-300
                  rounded text-xs font-bold text-white transition-all z-10"
                style={{ top: `${pr * 3.5}rem`, left: `${pc * 3.5}rem` }}
              >
                <span>{ANIMAL_ICON[animalPlacementType]}</span>
                <span className="text-[9px]">+{remaining}</span>
              </button>
            );
          })}
          {/* 집 배치 버튼 — 방이 있는 첫 번째 셀 */}
          {(() => {
            const houseTotal = board.animalsInHouse.reduce((s, a) => s + a.count, 0);
            if (houseTotal >= 1) return null;
            // 집 첫 번째 방 셀 찾기
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                const cell = board.grid[r]?.[c];
                if (cell === 'room_wood' || cell === 'room_clay' || cell === 'room_stone') {
                  return (
                    <button
                      key="place-house"
                      aria-label={`집에 ${ANIMAL_NAME[animalPlacementType]} 배치 (애완)`}
                      onClick={() => onAnimalPlace('house')}
                      className="pointer-events-auto absolute flex flex-col items-center justify-center
                        w-14 h-14 bg-blue-500/70 hover:bg-blue-400/80 border-2 border-blue-300
                        rounded text-xs font-bold text-white transition-all z-10"
                      style={{ top: `${r * 3.5}rem`, left: `${c * 3.5}rem` }}
                    >
                      <span>{ANIMAL_ICON[animalPlacementType]}</span>
                      <span className="text-[9px]">집 안</span>
                    </button>
                  );
                }
              }
            }
            return null;
          })()}
        </div>
      )}

      {/* 가축 제거(교체) 모드 오버레이 */}
      {animalRemovalMode && onAnimalRemove && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 동물이 있는 목장 위에 ❌ 버튼 */}
          {board.pastures.map((pasture, idx) => {
            if (!pasture.animals) return null;
            const firstCell = pasture.cells[0];
            if (!firstCell) return null;
            const [pr, pc] = firstCell;
            return (
              <button
                key={`remove-${idx}`}
                aria-label={`목장 ${idx + 1}의 동물 제거`}
                onClick={() => onAnimalRemove({ type: 'pasture', index: idx })}
                className="pointer-events-auto absolute flex flex-col items-center justify-center
                  w-14 h-14 bg-red-500/70 hover:bg-red-400/80 border-2 border-red-300
                  rounded text-xs font-bold text-white transition-all z-10"
                style={{ top: `${pr * 3.5}rem`, left: `${pc * 3.5}rem` }}
              >
                <span aria-hidden="true">❌</span>
                <span className="text-[9px]">
                  {ANIMAL_ICON[pasture.animals.type]}×{pasture.animals.count}
                </span>
              </button>
            );
          })}
          {/* 집 안 동물이 있으면 ❌ 버튼 */}
          {(() => {
            if (board.animalsInHouse.length === 0) return null;
            const house = board.animalsInHouse[0];
            if (!house) return null;
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                const cell = board.grid[r]?.[c];
                if (cell === 'room_wood' || cell === 'room_clay' || cell === 'room_stone') {
                  return (
                    <button
                      key="remove-house"
                      aria-label="집 안 동물 제거"
                      onClick={() => onAnimalRemove({ type: 'house' })}
                      className="pointer-events-auto absolute flex flex-col items-center justify-center
                        w-14 h-14 bg-red-500/70 hover:bg-red-400/80 border-2 border-red-300
                        rounded text-xs font-bold text-white transition-all z-10"
                      style={{ top: `${r * 3.5}rem`, left: `${c * 3.5}rem` }}
                    >
                      <span aria-hidden="true">❌</span>
                      <span className="text-[9px]">
                        {ANIMAL_ICON[house.type]}×{house.count}
                      </span>
                    </button>
                  );
                }
              }
            }
            return null;
          })()}
        </div>
      )}
      </div>
    </div>
  );
}
