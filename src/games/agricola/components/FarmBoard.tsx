/**
 * 농장 보드 컴포넌트 — 3×5 그리드 + 울타리 오버레이
 * Phase 1 구현.
 */

import type { FarmBoard as FarmBoardType } from '../lib/types.js';
import FarmCell from './FarmCell.js';

interface FarmBoardProps {
  board: FarmBoardType;
  onCellClick?: (row: number, col: number) => void;
  onFenceClick?: (orientation: 'horizontal' | 'vertical', r: number, c: number) => void;
  fencingMode?: boolean;
  selectedCell?: [number, number] | null;
}

const ROWS = 3;
const COLS = 5;

export default function FarmBoard({
  board,
  onCellClick,
  onFenceClick,
  fencingMode = false,
  selectedCell = null,
}: FarmBoardProps) {
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

  // 울타리 스타일: horizontal[r][c] = true → 셀 (r-1,c)과 (r,c) 사이 경계선 표시
  function borderClasses(r: number, c: number): string {
    const borders: string[] = [];
    // 위 경계선
    if (r > 0 && board.fences.horizontal[r]?.[c]) borders.push('border-t-[3px] border-t-amber-800');
    // 아래 경계선
    if (r < ROWS - 1 && board.fences.horizontal[r + 1]?.[c]) borders.push('border-b-[3px] border-b-amber-800');
    // 왼쪽 경계선
    if (c > 0 && board.fences.vertical[r]?.[c - 1]) borders.push('border-l-[3px] border-l-amber-800');
    // 오른쪽 경계선
    if (c < COLS - 1 && board.fences.vertical[r]?.[c]) borders.push('border-r-[3px] border-r-amber-800');
    return borders.join(' ');
  }

  return (
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
                  onClick={() => onCellClick?.(r, c)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* 울타리 모드 오버레이 — 클릭 가능한 울타리 세그먼트 */}
      {fencingMode && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 수평 울타리 버튼 (rows 0~3, cols 0~4) */}
          {Array.from({ length: ROWS + 1 }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              if (r === 0 || r === ROWS) return null; // 외벽
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
          {/* 수직 울타리 버튼 (rows 0~2, cols 0~3) */}
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
  );
}
