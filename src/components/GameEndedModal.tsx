import { useState } from 'react';

interface GameEndedModalProps {
  emoji: string;
  title: string;
  subtitle?: string;
  closeLabel: string;
  closeHint: string;
}

export default function GameEndedModal({ emoji, title, subtitle, closeLabel, closeHint }: GameEndedModalProps) {
  const [closeTabFailed, setCloseTabFailed] = useState(false);

  const handleClose = () => {
    window.close();
    setTimeout(() => setCloseTabFailed(true), 300);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-900 p-6 text-center">
      <div className="text-7xl mb-6">{emoji}</div>
      <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
      {subtitle && <p className="text-stone-400 text-sm mb-4">{subtitle}</p>}
      <button
        onClick={handleClose}
        className="mt-6 bg-white text-stone-800 font-black px-8 py-3 rounded-2xl hover:bg-stone-100 active:scale-95 transition-all"
      >
        {closeLabel}
      </button>
      {closeTabFailed && (
        <p className="text-stone-400 text-sm mt-3">{closeHint}</p>
      )}
    </div>
  );
}
