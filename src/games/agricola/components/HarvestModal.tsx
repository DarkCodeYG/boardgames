/**
 * HarvestModal — 수확 단계 1인씩 처리
 * harvestFields 적용 후 상태 기준으로 플레이어별 표시:
 *   ① 밭 수확 결과 확인  ② 빵 굽기 (보유 설비)  ③ 식량 공급 확인
 */
import type { GameState, PlayerId } from '../lib/types.js';
import { BEGGING_FOOD_PER_PERSON, BEGGING_FOOD_NEWBORN, SOLO_FOOD_PER_PERSON } from '../lib/constants.js';

const COLOR_HEADER: Record<string, string> = {
  red:    'bg-red-700',
  blue:   'bg-blue-700',
  green:  'bg-green-700',
  yellow: 'bg-yellow-600',
};
const COLOR_BORDER: Record<string, string> = {
  red:    'border-red-400',
  blue:   'border-blue-400',
  green:  'border-green-400',
  yellow: 'border-yellow-400',
};

interface HarvestModalProps {
  /** harvestFields() 이미 적용된 상태 */
  state: GameState;
  harvestingPlayerId: PlayerId;
  playerNumber: number;
  totalPlayers: number;
  /** 보유 설비 ID로 빵 굽기 (곡식 1 → 음식 N) */
  onBakeBread: (improvementId: string) => void;
  /** 식량 공급 확인 (feedFamily + breedAnimals 실행) */
  onConfirmFeed: () => void;
}

export default function HarvestModal({
  state,
  harvestingPlayerId,
  playerNumber,
  totalPlayers,
  onBakeBread,
  onConfirmFeed,
}: HarvestModalProps) {
  const player = state.players[harvestingPlayerId];
  if (!player) return null;

  // 1인 플레이: 성인 3식, 다인: 성인 2식. 신생아(hasGrown)는 항상 1식
  const isSolo      = state.playerOrder.length === 1;
  const foodPerAdult = isSolo ? SOLO_FOOD_PER_PERSON : BEGGING_FOOD_PER_PERSON;
  const adults      = player.hasGrown ? player.familySize - 1 : player.familySize;
  const newborns    = player.hasGrown ? 1 : 0;
  const foodNeeded  = adults * foodPerAdult + newborns * BEGGING_FOOD_NEWBORN;
  const foodNow     = player.resources.food;
  const deficit     = Math.max(0, foodNeeded - foodNow);
  const surplus     = Math.max(0, foodNow - foodNeeded);

  // 이 플레이어가 보유한 BAKE_BREAD 가능 설비
  const bakingImps = state.majorImprovements.filter(
    (m) => m.ownerId === harvestingPlayerId && m.effects.some((e) => e.trigger === 'BAKE_BREAD'),
  );
  const canBake = player.resources.grain >= 1 && bakingImps.length > 0;

  const headerColor = COLOR_HEADER[player.color] ?? 'bg-amber-700';
  const borderColor = COLOR_BORDER[player.color] ?? 'border-amber-400';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`bg-stone-50 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border-2 ${borderColor}`}>
        {/* 헤더 */}
        <div className={`${headerColor} text-white px-5 py-3`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              <span aria-hidden="true">🌾</span> {state.round}라운드 수확
            </h2>
            <span className="text-xs text-white/70 font-mono">
              {playerNumber} / {totalPlayers}
            </span>
          </div>
          <p className="text-sm font-semibold mt-0.5 text-white/90">{player.name}</p>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          {/* ① 밭 수확 결과 (이미 적용됨) */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="text-xs font-semibold text-amber-800 mb-1">① 밭 수확 (적용 완료)</div>
            <div className="flex gap-3 text-xs text-gray-600">
              {player.resources.grain > 0 || player.resources.vegetable > 0 ? (
                <>
                  {player.resources.grain > 0 && (
                    <span><span aria-hidden="true">🌾</span> 곡식 {player.resources.grain}개 보유</span>
                  )}
                  {player.resources.vegetable > 0 && (
                    <span><span aria-hidden="true">🥕</span> 채소 {player.resources.vegetable}개 보유</span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">수확 없음</span>
              )}
            </div>
          </div>

          {/* ② 빵 굽기 (선택사항) */}
          <div className={`rounded-lg px-3 py-2 border ${canBake ? 'bg-orange-50 border-orange-200' : 'bg-stone-50 border-stone-200 opacity-60'}`}>
            <div className="text-xs font-semibold text-orange-800 mb-1">
              ② 빵 굽기 <span className="font-normal text-gray-500">(선택, 곡식 1 → 음식 N)</span>
            </div>
            {canBake ? (
              <div className="flex flex-wrap gap-1.5">
                {bakingImps.map((m) => {
                  const eff = m.effects.find((e) => e.trigger === 'BAKE_BREAD');
                  return (
                    <button
                      key={m.id}
                      onClick={() => onBakeBread(m.id)}
                      disabled={player.resources.grain < 1}
                      className="text-xs px-2 py-1 bg-orange-100 border border-orange-300 rounded hover:bg-orange-200 text-orange-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {m.nameKo}
                      <span className="ml-1 text-orange-600">
                        ({eff?.description ?? '빵 굽기'})
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-gray-400">
                {bakingImps.length === 0 ? '보유한 화로/화덕 없음' : '곡식 없음'}
              </span>
            )}
            {/* 현재 곡식/음식 현황 */}
            <div className="mt-1.5 flex gap-3 text-xs text-gray-500">
              <span><span aria-hidden="true">🌾</span> 곡식 {player.resources.grain}</span>
              <span><span aria-hidden="true">🍖</span> 음식 {player.resources.food}</span>
            </div>
          </div>

          {/* ③ 식량 공급 미리보기 */}
          <div className={`rounded-lg px-3 py-2 border ${deficit > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs font-semibold text-gray-700 mb-1">
              ③ 식량 공급 —{' '}
              {player.hasGrown
                ? `성인 ${adults}명 × ${foodPerAdult}식 + 신생아 1명 × 1식`
                : `가족 ${player.familySize}명 × ${foodPerAdult}식`}
              {' '}= <span className="font-bold">{foodNeeded}식</span> 필요
            </div>
            <div className="text-sm font-bold">
              {deficit > 0 ? (
                <span className="text-red-600">
                  ⚠ {foodNeeded - foodNow}식 부족 → 구걸 토큰 {deficit}개 (-{deficit * 3}점)
                </span>
              ) : (
                <span className="text-green-700">
                  ✓ 음식 {foodNow} → {surplus} (여유 {surplus}식)
                </span>
              )}
            </div>
          </div>

          {/* ④ 번식 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="text-xs font-semibold text-blue-800 mb-0.5">④ 번식 (자동 처리)</div>
            <div className="text-xs text-gray-500">
              같은 종 가축 2마리 이상 + 공간 있으면 새끼 1마리 추가 (확인 시 자동 적용)
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={onConfirmFeed}
            className={`w-full py-2.5 text-white font-medium rounded-lg text-sm transition-colors duration-150 ${
              deficit > 0
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {deficit > 0
              ? `식량 공급 + 구걸 토큰 ${deficit}개 받기`
              : '식량 공급 완료 →'}
          </button>
          {playerNumber < totalPlayers && (
            <p className="text-center text-xs text-gray-400 mt-1.5">
              다음: {state.players[state.playerOrder[playerNumber] ?? '']?.name ?? ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
