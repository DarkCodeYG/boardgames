/**
 * 동물 배치 공간 부족 시 선택 모달 — 교체 / 요리 / 버림
 */

import Modal from '../../../components/Modal.js';
import type { AnimalType } from '../lib/types.js';

const ANIMAL_ICON: Record<AnimalType, string> = { sheep: '🐑', boar: '🐷', cattle: '🐄' };
const ANIMAL_NAME: Record<AnimalType, string> = { sheep: '양', boar: '멧돼지', cattle: '소' };

interface AnimalOverflowModalProps {
  animalType: AnimalType;
  foodRate: number;
  canCook: boolean;
  onReplace: () => void;
  onCook: () => void;
  onDiscard: () => void;
}

export default function AnimalOverflowModal({
  animalType,
  foodRate,
  canCook,
  onReplace,
  onCook,
  onDiscard,
}: AnimalOverflowModalProps) {
  const name = ANIMAL_NAME[animalType];
  const icon = ANIMAL_ICON[animalType];
  return (
    <Modal titleId="animal-overflow-title" onClose={onDiscard} maxWidth="max-w-sm">
      <h2 id="animal-overflow-title" className="text-lg font-bold text-red-700 mb-2">
        배치 공간 없음
      </h2>
      <p className="text-sm text-gray-700 mb-4">
        <span aria-hidden="true">{icon}</span> {name} 1마리를 어떻게 할까요?
      </p>
      <div className="space-y-2">
        <button
          onClick={onReplace}
          className="w-full py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-150"
        >
          기존 동물 교체 (버릴 대상 직접 선택)
        </button>
        {canCook && (
          <button
            onClick={onCook}
            className="w-full py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors duration-150"
          >
            🔥 요리하여 음식 +{foodRate}
          </button>
        )}
        <button
          onClick={onDiscard}
          className="w-full py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-150"
        >
          버림 (새 {name} 1마리 유실)
        </button>
      </div>
    </Modal>
  );
}
