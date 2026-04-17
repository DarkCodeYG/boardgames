/**
 * CardDetail — 카드 상세 모달
 */
import type { Card, ResourceCost } from '../lib/types.js';

const RES_ICON: Record<string, string> = {
  wood: '🪵', clay: '🟫', stone: '⬜', reed: '🌿',
  grain: '🌾', vegetable: '🥕', food: '🍖',
  sheep: '🐑', boar: '🐷', cattle: '🐄',
};
const RES_LABEL: Record<string, string> = {
  wood: '나무', clay: '흙', stone: '돌', reed: '갈대',
  grain: '곡식', vegetable: '채소', food: '음식',
  sheep: '양', boar: '돼지', cattle: '소',
};

const TRIGGER_LABEL: Record<string, string> = {
  IMMEDIATE: '즉시 발동',
  PLACE_WORKER: '일꾼 배치 시',
  HARVEST_FIELD: '수확 — 밭 수확 시',
  HARVEST_FEED: '수확 — 식량 공급 시',
  HARVEST_BREED: '수확 — 번식 시',
  BUILD_ROOM: '방 건설 시',
  RENOVATE: '집 개량 시',
  BUILD_FENCE: '울타리 건설 시',
  BUILD_STABLE: '외양간 건설 시',
  PLOW_FIELD: '밭 갈기 시',
  SOW: '씨 뿌리기 시',
  BAKE_BREAD: '빵 굽기 시',
  GET_RESOURCE: '자원 획득 시',
  ROUND_START: '라운드 시작 시',
  GAME_END: '게임 종료 — 점수 계산 시',
  PASSIVE: '지속 효과',
  ANYTIME: '언제든지',
};

function CostRow({ cost, label }: { cost: ResourceCost; label: string }) {
  const entries = Object.entries(cost).filter(([, v]) => (v ?? 0) > 0);
  if (entries.length === 0) return <div className="text-sm text-amber-700">{label}: 무료</div>;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-500">{label}:</span>
      {entries.map(([res, amt]) => (
        <span
          key={res}
          className={[
            'inline-flex items-center gap-0.5 text-xs border rounded px-1.5 py-0.5',
            res === 'reed' ? 'bg-white border-stone-300 text-stone-600' : 'bg-amber-100 border-amber-300',
          ].join(' ')}
          title={`${RES_LABEL[res] ?? res}`}
        >
          <span aria-hidden="true">{RES_ICON[res] ?? res}</span>
          <span>{amt}</span>
          <span className="text-gray-500">{RES_LABEL[res] ?? res}</span>
        </span>
      ))}
    </div>
  );
}

interface CardDetailProps {
  card: Card;
  canPlay: boolean;
  playReason?: string;
  occupationFoodCost?: number;
  onPlay?: () => void;
  onClose: () => void;
}

export default function CardDetail({
  card,
  canPlay,
  playReason,
  occupationFoodCost,
  onPlay,
  onClose,
}: CardDetailProps) {
  const isOcc = card.type === 'occupation';
  const headerBg = isOcc ? 'bg-amber-700' : 'bg-green-800';
  const typeLabel = isOcc ? '직업' : '보조 설비';

  const playCost: ResourceCost =
    isOcc
      ? occupationFoodCost != null && occupationFoodCost > 0 ? { food: occupationFoodCost } : {}
      : (card.cost ?? {});

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 rounded-xl w-full max-w-xs shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`${headerBg} text-white px-4 py-3`}>
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-75">{card.deck}덱 · {typeLabel} · {card.id}</span>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-lg leading-none"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <h2 className="text-lg font-bold mt-0.5">{card.nameKo}</h2>
          <p className="text-sm opacity-75">{card.nameEn}</p>
        </div>

        {/* 본문 */}
        <div className="p-4 flex flex-col gap-3">
          {/* 비용 */}
          <CostRow cost={playCost} label="비용" />

          {/* 전제 조건 */}
          {card.prerequisites && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              <span className="font-medium text-amber-800">조건:</span>{' '}
              <span className="text-amber-700">{card.prerequisites}</span>
            </div>
          )}

          {/* 효과 목록 */}
          {card.effects.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">효과</span>
              {card.effects.map((eff, i) => (
                <div key={i} className="bg-white border border-stone-200 rounded px-2 py-1.5">
                  <div className="text-[10px] font-medium text-blue-600 mb-0.5">
                    {TRIGGER_LABEL[eff.trigger] ?? eff.trigger}
                  </div>
                  <div className="text-xs text-gray-700">
                    {eff.description ?? '(효과 텍스트 준비 중)'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-center">
              효과 구현 예정
            </div>
          )}

          {/* VP */}
          {card.victoryPoints != null && typeof card.victoryPoints === 'number' && (
            <div className={[
              'text-sm font-bold text-center rounded py-1',
              card.victoryPoints > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800',
            ].join(' ')}>
              <span aria-hidden="true">⭐</span>{' '}
              {card.victoryPoints > 0 ? '+' : ''}{card.victoryPoints} 승리 점수
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="px-4 pb-4 flex gap-2">
          {onPlay && (
            <button
              onClick={canPlay ? onPlay : undefined}
              disabled={!canPlay}
              title={!canPlay ? playReason : undefined}
              className={[
                'flex-1 py-2 rounded-lg font-medium text-sm transition-colors duration-150',
                canPlay
                  ? `${isOcc ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-700 hover:bg-green-800'} text-white`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              ].join(' ')}
            >
              {canPlay ? '카드 플레이' : (playReason ?? '플레이 불가')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 text-sm hover:bg-stone-100 transition-colors duration-150"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
