/** FenceGrid — Phase 1 구현 예정 */
import type { FenceGrid as FenceGridType } from '../lib/types.js';

interface FenceGridProps {
  fences: FenceGridType;
  onFenceClick?: (orientation: 'horizontal' | 'vertical', r: number, c: number) => void;
  interactive?: boolean;
}

export default function FenceGrid({ fences: _fences, onFenceClick: _onFenceClick, interactive: _interactive }: FenceGridProps) {
  return <div className="absolute inset-0 pointer-events-none" />;
}
