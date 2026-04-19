/** FarmCell — 3×5 농장 그리드의 개별 셀 */
import type { CellType, SownField, Pasture, AnimalStack } from '../lib/types.js';

/** 방 셀의 가족 구성원 표시 상태 */
export type FamilyMemberState = 'none' | 'available' | 'deployed' | 'selected';

/** 플레이어 색상별 토큰 스타일 */
const TOKEN_COLORS: Record<string, { available: string; deployed: string; selectedBorder: string }> = {
  red:    { available: 'bg-red-500 border-red-700',       deployed: 'bg-red-300 border-red-500',    selectedBorder: 'border-red-400' },
  blue:   { available: 'bg-blue-500 border-blue-700',     deployed: 'bg-blue-300 border-blue-500',  selectedBorder: 'border-blue-400' },
  green:  { available: 'bg-green-500 border-green-700',   deployed: 'bg-green-300 border-green-500', selectedBorder: 'border-green-400' },
  yellow: { available: 'bg-yellow-400 border-yellow-600', deployed: 'bg-yellow-200 border-yellow-500', selectedBorder: 'border-yellow-400' },
};
const DEFAULT_TOKEN = { available: 'bg-amber-200 border-amber-700', deployed: 'bg-amber-400 border-amber-600', selectedBorder: 'border-amber-500' };

interface FarmCellProps {
  row: number;
  col: number;
  cellType: CellType;
  sownField?: SownField;
  pasture?: Pasture;
  isSelected?: boolean;
  hasStable?: boolean;
  /** 가족 구성원 상태 (바둑 방식 가족 말 배치) */
  familyMemberState?: FamilyMemberState;
  /** 플레이어 색상 (red/blue/green/yellow) */
  playerColor?: string;
  /** 집 안 동물 (첫 번째 방 셀에만 전달) */
  houseAnimals?: AnimalStack[];
  onClick?: () => void;
}

const CELL_CONFIG: Record<CellType, { bg: string; icon: string; label: string }> = {
  empty:      { bg: 'bg-amber-100 hover:bg-amber-200',   icon: '',   label: '' },
  room_wood:  { bg: 'bg-amber-900',                      icon: '🏠', label: '나무방' },
  room_clay:  { bg: 'bg-orange-800',                     icon: '🏠', label: '흙방' },
  room_stone: { bg: 'bg-slate-500',                      icon: '🏠', label: '돌방' },
  field:      { bg: 'bg-amber-800/70',                   icon: '',   label: '밭' },
  stable:     { bg: 'bg-green-800',                      icon: '🐄', label: '외양간' },
};

const ANIMAL_ICON: Record<string, string> = { sheep: '🐑', boar: '🐷', cattle: '🐄' };

export default function FarmCell({
  cellType,
  sownField,
  pasture,
  isSelected,
  hasStable,
  familyMemberState = 'none',
  playerColor,
  houseAnimals,
  onClick,
}: FarmCellProps) {
  const tokenColors = TOKEN_COLORS[playerColor ?? ''] ?? DEFAULT_TOKEN;
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
        // 선택된 방: 살짝 어두운 링 (토큰이 "들려간" 상태)
        familyMemberState === 'selected'
          ? 'ring-2 ring-amber-400 ring-inset opacity-75'
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

      {/* 가족 구성원 토큰 — 플레이어 색상 디스크 */}
      {familyMemberState !== 'none' && (
        <span
          aria-hidden="true"
          className={[
            'absolute top-0.5 left-0.5 rounded-full border-2 shadow-sm',
            familyMemberState === 'selected'
              ? `w-5 h-5 bg-transparent border-dashed ${tokenColors.selectedBorder} opacity-50`
              : familyMemberState === 'available'
                ? `w-4 h-4 ${tokenColors.available}`
                : `w-4 h-4 ${tokenColors.deployed} opacity-40`,
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
          {ANIMAL_ICON[pasture.animals.type]}{pasture.animals.count}
        </span>
      )}

      {/* 집 안 동물 (첫 번째 방 셀) */}
      {houseAnimals && houseAnimals.length > 0 && (
        <div className="absolute bottom-0 right-0 flex flex-col items-end gap-0 p-0.5">
          {houseAnimals.map((a) => (
            <span key={a.type} className="text-[9px] leading-tight bg-black/20 rounded px-0.5">
              {ANIMAL_ICON[a.type]}{a.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
