/** FarmCell — 3×5 농장 그리드의 개별 셀 */
import type { CellType, SownField, Pasture } from '../lib/types.js';

/** 방 셀의 가족 구성원 표시 상태 */
export type FamilyMemberState = 'none' | 'available' | 'deployed' | 'selected';

interface FarmCellProps {
  row: number;
  col: number;
  cellType: CellType;
  sownField?: SownField;
  pasture?: Pasture;
  isSelected?: boolean;
  hasStable?: boolean;
  /** 가족 구성원 상태 (바둑 방식 워커 배치) */
  familyMemberState?: FamilyMemberState;
  onClick?: () => void;
}

const CELL_CONFIG: Record<CellType, { bg: string; icon: string; label: string }> = {
  empty:      { bg: 'bg-amber-100 hover:bg-amber-200',   icon: '',   label: '' },
  room_wood:  { bg: 'bg-amber-900',                      icon: '🏠', label: '나무방' },
  room_clay:  { bg: 'bg-orange-800',                     icon: '🏠', label: '흙방' },
  room_stone: { bg: 'bg-slate-500',                      icon: '🏠', label: '돌방' },
  field:      { bg: 'bg-yellow-600/60',                  icon: '🌾', label: '밭' },
  stable:     { bg: 'bg-green-800',                      icon: '🐄', label: '외양간' },
};

export default function FarmCell({
  cellType,
  sownField,
  pasture,
  isSelected,
  hasStable,
  familyMemberState = 'none',
  onClick,
}: FarmCellProps) {
  const cfg = CELL_CONFIG[cellType] ?? CELL_CONFIG.empty;

  // 가족 구성원 클릭 가능 여부 — 'available' 또는 'selected' 상태의 방 셀
  const isClickable = familyMemberState === 'available' || familyMemberState === 'selected';

  return (
    <div
      onClick={onClick}
      className={[
        'relative w-14 h-14 border border-amber-400 flex flex-col items-center justify-center',
        'text-xs transition-all duration-150 select-none',
        cfg.bg,
        isClickable ? 'cursor-pointer' : 'cursor-default',
        // 선택된 방: 호박색 두꺼운 링 (체스 선택 표시)
        familyMemberState === 'selected'
          ? 'ring-4 ring-amber-500 ring-inset shadow-inner z-10 scale-105'
          : familyMemberState === 'available'
            ? 'hover:ring-2 hover:ring-amber-400 hover:ring-inset'
            : isSelected ? 'ring-2 ring-amber-300 ring-inset' : '',
        pasture ? 'bg-green-700/25' : '',
      ].join(' ')}
    >
      {/* 셀 아이콘 */}
      {cfg.icon && <span aria-hidden="true" className="text-base leading-none">{cfg.icon}</span>}

      {/* 씨앗 표시 */}
      {sownField && (
        <span className="text-[9px] font-bold bg-amber-800/80 text-amber-100 px-1 rounded leading-tight">
          {sownField.resource === 'grain' ? '🌾' : '🥕'}{sownField.count}
        </span>
      )}

      {/* 가족 구성원 토큰 — 나무 디스크 느낌 */}
      {familyMemberState !== 'none' && (
        <span
          aria-hidden="true"
          className={[
            'absolute top-0.5 left-0.5 rounded-full border-2 shadow-sm',
            familyMemberState === 'selected'
              ? 'w-5 h-5 bg-amber-100 border-amber-600 shadow-md animate-pulse'
              : familyMemberState === 'available'
                ? 'w-4 h-4 bg-amber-200 border-amber-700'
                : 'w-4 h-4 bg-amber-400 border-amber-600 opacity-40',
          ].join(' ')}
        />
      )}

      {/* 외양간 오버레이 */}
      {hasStable && cellType !== 'stable' && (
        <span aria-hidden="true" className="absolute top-0 right-0 text-[10px]">🐄</span>
      )}

      {/* 목장 동물 */}
      {pasture?.animals && (
        <span className="text-[10px] text-green-900">
          {pasture.animals.type === 'sheep' ? '🐑' : pasture.animals.type === 'boar' ? '🐷' : '🐄'}
          {pasture.animals.count}
        </span>
      )}
    </div>
  );
}
