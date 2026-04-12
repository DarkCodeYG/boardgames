import type { ReactNode } from 'react';

interface ModalProps {
  /** aria-labelledby에 연결될 제목 요소의 id */
  titleId: string;
  /** 배경 클릭 시 호출 */
  onClose: () => void;
  children: ReactNode;
  /** 최대 너비 (기본값: max-w-xs) */
  maxWidth?: string;
}

export default function Modal({ titleId, onClose, children, maxWidth = 'max-w-xs' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-2xl p-6 ${maxWidth} w-full text-center shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
