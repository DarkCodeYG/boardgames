/**
 * 동물 → 음식 변환 모달 (화로/화덕 소유 시 언제든 사용)
 */

import Modal from '../../../components/Modal.js';
import type { AnimalSource } from '../lib/game-engine.js';
import { ANIMAL_TO_FOOD_RATES } from '../lib/cards/major-improvements.js';

const ANIMAL_ICON: Record<string, string> = { sheep: '🐑', boar: '🐷', cattle: '🐄' };
const ANIMAL_NAME: Record<string, string> = { sheep: '양', boar: '멧돼지', cattle: '소' };

function sourceLabel(source: AnimalSource): string {
  if (source.kind === 'resources') return '임시 보관';
  if (source.kind === 'house') return '집 안';
  return `목장 ${source.index + 1}`;
}

interface CookAnimalModalProps {
  sources: AnimalSource[];
  onCook: (source: AnimalSource) => void;
  onClose: () => void;
}

export default function CookAnimalModal({ sources, onCook, onClose }: CookAnimalModalProps) {
  return (
    <Modal titleId="cook-animal-title" onClose={onClose} maxWidth="max-w-md">
      <h2 id="cook-animal-title" className="text-lg font-bold text-amber-900 mb-2">
        🔥 동물 요리
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        변환할 동물을 선택하세요 (1마리 → 음식)
      </p>

      {sources.length === 0 ? (
        <p className="text-sm text-gray-500 py-6">변환할 동물이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {sources.map((s, i) => {
            const rate = ANIMAL_TO_FOOD_RATES[s.animalType] ?? 0;
            return (
              <button
                key={`${s.kind}-${s.kind === 'pasture' ? s.index : s.animalType}-${i}`}
                onClick={() => onCook(s)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-2 border-amber-300 rounded-lg hover:bg-amber-100 transition-colors duration-150"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span aria-hidden="true" className="text-lg">{ANIMAL_ICON[s.animalType]}</span>
                  <span>{ANIMAL_NAME[s.animalType]}</span>
                  <span className="text-xs text-gray-500">· {sourceLabel(s)} ({s.count}마리)</span>
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-red-700">
                  <span aria-hidden="true">→ 🍖</span>
                  <span>+{rate}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-4 w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors duration-150"
      >
        닫기
      </button>
    </Modal>
  );
}
