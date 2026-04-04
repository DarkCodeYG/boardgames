import { useEffect, useState } from 'react';
import { getPlayerRole } from '../lib/game-engine';
import type { Lang } from '../../codenames/lib/i18n';
import type { WordPack } from '../../codenames/lib/words';
import { sfxClick, sfxSpyReveal, sfxRoleReveal } from '../../../lib/sound';

const TEXTS = {
  ko: {
    spy: '🕵️ 당신은 스파이입니다!', spyHint: '장소를 알아내세요!',
    location: '장소', role: '역할', noSeed: 'QR코드를 스캔해주세요.',
    confirm: '본인이 맞습니까?', yes: '네, 맞습니다', no: '아니요',
    player: '플레이어', selectPlayer: '플레이어 번호를 선택하세요',
    showCard: '카드 확인',
  },
  en: {
    spy: '🕵️ You are the SPY!', spyHint: 'Figure out the location!',
    location: 'Location', role: 'Role', noSeed: 'Please scan the QR code.',
    confirm: 'Is this you?', yes: 'Yes', no: 'No',
    player: 'Player', selectPlayer: 'Select your player number',
    showCard: 'Show Card',
  },
  zh: {
    spy: '🕵️ 你是间谍！', spyHint: '找出地点！',
    location: '地点', role: '角色', noSeed: '请扫描QR码。',
    confirm: '是你吗？', yes: '是的', no: '不是',
    player: '玩家', selectPlayer: '请选择你的玩家编号',
    showCard: '查看卡片',
  },
};

type Step = 'confirm' | 'select' | 'revealed';

export default function PlayerCard() {
  const [data, setData] = useState<{ isSpy: boolean; location: string | null; role: string | null } | null>(null);
  const [lang, setLang] = useState<Lang>('ko');
  const [step, setStep] = useState<Step>('confirm');
  const [playerIndex, setPlayerIndex] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [seed, setSeed] = useState<string>('');
  const [pack, setPack] = useState<WordPack>('standard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('seed');
    const player = params.get('player');
    const count = params.get('count');
    const l = params.get('lang') as Lang | null;
    const p = params.get('pack') as WordPack | null;

    if (l && ['ko', 'en', 'zh'].includes(l)) setLang(l);
    if (s) setSeed(s);
    if (count) setPlayerCount(parseInt(count, 10));
    if (player) setPlayerIndex(parseInt(player, 10));
    if (p && ['standard', 'jw'].includes(p)) setPack(p);
  }, []);

  const txt = TEXTS[lang];

  const revealCard = (idx: number) => {
    if (!seed || !playerCount) return;
    const role = getPlayerRole(seed, idx, playerCount, lang, pack);
    setData(role);
    setPlayerIndex(idx);
    setStep('revealed');
    // 스파이/일반 역할에 따라 다른 효과음
    if (role.isSpy) {
      sfxSpyReveal();
    } else {
      sfxRoleReveal();
    }
  };

  // 시드 없음
  if (!seed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-100">
        <p className="text-stone-500 text-lg">{txt.noSeed}</p>
      </div>
    );
  }

  // 1단계: 본인 확인
  if (step === 'confirm') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center shadow-lg">
          <div className="text-6xl mb-4">🎴</div>
          <h2 className="text-2xl font-black text-stone-800 mb-2">
            {txt.player} {playerIndex + 1}
          </h2>
          <p className="text-stone-500 mb-6">{txt.confirm}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { sfxClick(); setStep('select'); }}
              className="bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold
                         hover:bg-stone-300 transition-colors"
            >
              {txt.no}
            </button>
            <button
              onClick={() => revealCard(playerIndex)}
              className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold
                         hover:bg-stone-700 transition-colors"
            >
              {txt.yes}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2단계: 플레이어 번호 직접 선택
  if (step === 'select') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-4">{txt.selectPlayer}</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Array.from({ length: playerCount }, (_, i) => (
              <button
                key={i}
                onClick={() => revealCard(i)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold
                           py-3 rounded-xl text-lg transition-colors"
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3단계: 카드 공개
  if (!data) return null;

  if (data.isSpy) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-lg">
          <div className="text-8xl mb-4">🕵️</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <h1 className="text-3xl font-black text-stone-800">{txt.spy}</h1>
          </div>
          <p className="text-stone-500 text-lg">{txt.spyHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
      <div className="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-lg">
        <div className="text-8xl mb-4">📍</div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
          <p className="text-stone-400 text-sm">{txt.location}</p>
        </div>
        <h1 className="text-3xl font-black text-stone-800 mb-4">{data.location}</h1>
        {data.role && (
          <>
            <p className="text-stone-400 text-sm mb-1">{txt.role}</p>
            <h2 className="text-xl font-bold text-stone-700">{data.role}</h2>
          </>
        )}
      </div>
    </div>
  );
}
