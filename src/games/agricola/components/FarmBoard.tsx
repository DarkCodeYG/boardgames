/**
 * 농장 보드 컴포넌트 — 3×5 그리드 + 울타리 오버레이
 * Phase 1 구현. v3: 바둑 방식 워커 배치 (가족 구성원 선택→행동칸 드롭)
 */

import type { FarmBoard as FarmBoardType } from '../lib/types.js';
import FarmCell, { type FamilyMemberState } from './FarmCell.js';

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

  // 울타리 스타일
  function borderClasses(r: number, c: number): string {
    const borders: string[] = [];
    if (r > 0 && board.fences.horizontal[r]?.[c]) borders.push('border-t-[3px] border-t-amber-800');
    if (r < ROWS - 1 && board.fences.horizontal[r + 1]?.[c]) borders.push('border-b-[3px] border-b-amber-800');
    if (c > 0 && board.fences.vertical[r]?.[c - 1]) borders.push('border-l-[3px] border-l-amber-800');
    if (c < COLS - 1 && board.fences.vertical[r]?.[c]) borders.push('border-r-[3px] border-r-amber-800');
    return borders.join(' ');
  }

  return (
    <div className="p-2 bg-amber-950/20 rounded-lg border-4 border-amber-900 shadow-xl inline-block">
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
                  onClick={handleClick}
                />
              </div>
            );
          })
        )}
      </div>

      {/* 울타리 모드 오버레이 */}
      {fencingMode && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 수평 울타리 버튼 */}
          {Array.from({ length: ROWS + 1 }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              if (r === 0 || r === ROWS) return null;
              const active = board.fences.horizontal[r]?.[c] ?? false;
              return (
                <button
                  key={`h-${r}-${c}`}
                  aria-label={`수평 울타리 (${r},${c})`}
                  onClick={() => onFenceClick?.('horizontal', r, c)}
                  className={[
                    'pointer-events-auto absolute w-14 h-2 -translate-y-1',
                    active ? 'bg-amber-800 opacity-100' : 'bg-amber-400 opacity-30 hover:opacity-60',
                  ].join(' ')}
                  style={{ top: `${r * 3.5}rem`, left: `${c * 3.5}rem` }}
                />
              );
            })
          )}
          {/* 수직 울타리 버튼 */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS - 1 }, (_, c) => {
              const active = board.fences.vertical[r]?.[c] ?? false;
              return (
                <button
                  key={`v-${r}-${c}`}
                  aria-label={`수직 울타리 (${r},${c})`}
                  onClick={() => onFenceClick?.('vertical', r, c)}
                  className={[
                    'pointer-events-auto absolute h-14 w-2 -translate-x-1',
                    active ? 'bg-amber-800 opacity-100' : 'bg-amber-400 opacity-30 hover:opacity-60',
                  ].join(' ')}
                  style={{ top: `${r * 3.5}rem`, left: `${(c + 1) * 3.5}rem` }}
                />
              );
            })
          )}
        </div>
      )}
      </div>
    </div>
  );
}
