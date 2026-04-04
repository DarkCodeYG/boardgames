import { useState } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { I18N } from '../lib/i18n';
import type { Pack } from '../lib/types';
import { generateSeed } from '../lib/game-engine';
import { createFakeartRoom } from '../lib/firebase-room';
import { useFakeartStore } from '../store/game-store';
import { sfxClick, sfxToggle, sfxCountUp, sfxCountDown, sfxGameStart } from '../../../lib/sound';
import JWIcon from '../../../components/JWIcon';

interface HomePageProps {
  onStartGame: () => void;
  onBack?: () => void;
}

export default function HomePage({ onStartGame, onBack }: HomePageProps) {
  const lang = useGameStore((s) => s.lang);
  const txt = I18N[lang];
  const { setRoom } = useFakeartStore();

  const [pack, setPack] = useState<Pack>('standard');
  const [drawTime, setDrawTime] = useState(45);
  const [creating, setCreating] = useState(false);

  const getPackButtonClass = (value: Pack) => {
    const isJW = value === 'jw';
    const isActive = pack === value;
    if (isJW) {
      return `inline-flex items-center justify-center w-14 h-14 rounded-2xl transition-all ${isActive ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-90'}`;
    }
    return `px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${isActive ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`;
  };

  const handleStart = async () => {
    if (creating) return;
    setCreating(true);
    try {
      sfxGameStart();
      const seed = generateSeed();
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      const code = await Promise.race([createFakeartRoom(seed, pack, lang, drawTime), timeout]);
      setRoom(code, seed, pack, lang, drawTime);
      onStartGame();
    } catch (err) {
      console.error('방 생성 실패:', err);
      alert('방 생성에 실패했습니다. 인터넷 연결을 확인해 주세요.');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="text-center max-w-md w-full">
        {onBack && (
          <button
            onClick={() => { sfxClick(); onBack?.(); }}
            className="mb-4 text-stone-500 hover:text-stone-700 font-bold text-sm"
          >
            ← {txt.goHome}
          </button>
        )}

        {/* 팩 선택 */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => { sfxToggle(); setPack('standard'); }}
            className={getPackButtonClass('standard')}
          >
            {txt.standard}
          </button>
          <button
            onClick={() => { sfxToggle(); setPack('jw'); }}
            className={getPackButtonClass('jw')}
          >
            <JWIcon active={pack === 'jw'} />
          </button>
        </div>

        <h1 className="text-5xl font-black text-stone-800 mb-2">🎨 {txt.title}</h1>
        <p className="text-stone-500 text-lg mb-6">{txt.subtitle}</p>

        {/* 게임 설명 */}
        <div className="text-left bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-stone-700 mb-3">📋 {txt.howToPlay}</h3>
          <ol className="text-sm text-stone-500 space-y-2">
            <li><strong>1.</strong> {txt.rule1}</li>
            <li><strong>2.</strong> {txt.rule2}</li>
            <li><strong>3.</strong> {txt.rule3}</li>
            <li><strong>4.</strong> {txt.rule4}</li>
            <li><strong>5.</strong> {txt.rule5}</li>
          </ol>
        </div>

        {/* 설정 */}
        <div className="bg-white rounded-2xl p-6 shadow-md space-y-4 mb-6">
          {/* 그리기 시간 */}
          <div>
            <label className="text-sm font-bold text-stone-600">{txt.drawTime}</label>
            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                onClick={() => { sfxCountDown(); setDrawTime(Math.max(30, drawTime - 5)); }}
                className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300"
              >
                -
              </button>
              <span className="text-3xl font-black w-16 text-center">{drawTime}</span>
              <button
                onClick={() => { sfxCountUp(); setDrawTime(Math.min(60, drawTime + 5)); }}
                className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={creating}
          className="w-full bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {creating ? txt.creatingRoom : txt.start}
        </button>
      </div>
    </div>
  );
}
