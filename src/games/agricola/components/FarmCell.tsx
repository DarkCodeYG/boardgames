/** FarmCell — 3×5 농장 그리드의 개별 셀 */
import type { CellType, SownField, Pasture } from '../lib/types.js';

interface FarmCellProps {
  row: number;
  col: number;
  cellType: CellType;
  sownField?: SownField;
  pasture?: Pasture;
  isSelected?: boolean;
  hasStable?: boolean;
  onClick?: () => void;
}

const CELL_CONFIG: Record<CellType, { bg: string; icon: string; label: string }> = {
  empty:      { bg: 'bg-amber-50 hover:bg-amber-100',    icon: '',   label: '' },
  room_wood:  { bg: 'bg-yellow-700',                     icon: '🏠', label: '나무방' },
  room_clay:  { bg: 'bg-orange-600',                     icon: '🏠', label: '점토방' },
  room_stone: { bg: 'bg-gray-500',                       icon: '🏠', label: '돌방' },
  field:      { bg: 'bg-yellow-100',                     icon: '🌾', label: '밭' },
  stable:     { bg: 'bg-green-700',                      icon: '🐄', label: '외양간' },
};

export default function FarmCell({
  cellType,
  sownField,
  pasture,
  isSelected,
  hasStable,
  onClick,
}: FarmCellProps) {
  const cfg = CELL_CONFIG[cellType] ?? CELL_CONFIG.empty;

  return (
    <div
      onClick={onClick}
      className={[
        'relative w-14 h-14 border border-amber-400 flex flex-col items-center justify-center',
        'text-xs cursor-pointer transition-colors duration-150 select-none',
        cfg.bg,
        isSelected ? 'ring-2 ring-blue-400 ring-inset' : '',
        pasture ? 'bg-green-50' : '',
      ].join(' ')}
    >
      {/* 셀 아이콘 */}
      {cfg.icon && <span aria-hidden="true" className="text-base leading-none">{cfg.icon}</span>}

      {/* 씨앗 표시 */}
      {sownField && (
        <span className="text-[10px] font-bold text-green-800">
          {sownField.resource === 'grain' ? '밀' : '채소'}{sownField.count}
        </span>
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
