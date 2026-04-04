import { useState } from 'react';
import { useSpyfallStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import { t } from '../../codenames/lib/i18n';
import type { WordPack } from '../../codenames/lib/words';

const PACKS: { value: WordPack; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'jw', label: 'JW' },
];

const TEXTS = {
  ko: {
    title: '🔍 스파이폴',
    subtitle: '스파이를 찾아라!',
    players: '플레이어 수',
    minutes: '라운드 시간(분)',
    start: '게임 만들기',
    howToPlay: '📋 게임 방법',
    rule1: '모든 플레이어가 각자 QR코드를 스캔하여 자기 카드를 확인합니다',
    rule2: '한 명만 스파이! 스파이는 장소를 모릅니다',
    rule3: '돌아가며 다른 플레이어에게 장소와 관련된 질문을 합니다',
    rule4: '질문과 답변으로 스파이를 추리하세요. 너무 구체적이면 스파이에게 힌트를 줍니다!',
    rule5: '시간 종료 후 투표로 스파이를 지목하거나, 스파이가 장소를 맞추면 스파이 승리!',
  },
  en: {
    title: '🔍 Spyfall',
    subtitle: 'Find the spy!',
    players: 'Players',
    minutes: 'Round (min)',
    start: 'Create Game',
    howToPlay: '📋 How to Play',
    rule1: 'Each player scans their QR code to see their card',
    rule2: 'One player is the spy! The spy doesn\'t know the location',
    rule3: 'Take turns asking other players questions about the location',
    rule4: 'Use Q&A to figure out who the spy is. Be careful — too specific and you give the spy a clue!',
    rule5: 'After time runs out, vote to identify the spy. If the spy guesses the location, the spy wins!',
  },
  zh: {
    title: '🔍 间谍危机',
    subtitle: '找出间谍！',
    players: '玩家人数',
    minutes: '回合时间(分)',
    start: '创建游戏',
    howToPlay: '📋 游戏规则',
    rule1: '每位玩家扫描自己的QR码查看卡片',
    rule2: '其中一人是间谍！间谍不知道地点',
    rule3: '轮流向其他玩家提出与地点相关的问题',
    rule4: '通过问答推理谁是间谍。太具体的话会给间谍线索！',
    rule5: '时间结束后投票指认间谍。如果间谍猜出地点，间谍获胜！',
  },
};

interface HomePageProps {
  onStartGame: () => void;
  onBack?: () => void;
}

export default function HomePage({ onStartGame, onBack }: HomePageProps) {
  const { pack, setPack, newGame } = useSpyfallStore();
  const lang = useGameStore((s) => s.lang);
  const txt = TEXTS[lang];
  const [playerCount, setPlayerCount] = useState(6);
  const [roundMinutes, setRoundMinutes] = useState(8);

  const handleStart = () => {
    newGame(playerCount, roundMinutes);
    onStartGame();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="text-center max-w-md w-full">
        {onBack && (
          <button onClick={onBack} className="mb-4 text-stone-500 hover:text-stone-700 font-bold text-sm">
            ← {t(lang, 'goHome')}
          </button>
        )}

        {/* 단어팩 선택 */}
        <div className="flex justify-center gap-2 mb-6">
          {PACKS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPack(p.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors
                ${pack === p.value ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <h1 className="text-5xl font-black text-stone-800 mb-2">{txt.title}</h1>
        <p className="text-stone-500 text-lg mb-6">{txt.subtitle}</p>

        {/* 게임 설명 */}
        <div className="text-left bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-bold text-stone-700 mb-3">{txt.howToPlay}</h3>
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
          <div>
            <label className="text-sm font-bold text-stone-600">{txt.players}</label>
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => setPlayerCount(Math.max(3, playerCount - 1))}
                className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300">-</button>
              <span className="text-3xl font-black w-12 text-center">{playerCount}</span>
              <button onClick={() => setPlayerCount(Math.min(12, playerCount + 1))}
                className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300">+</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-stone-600">{txt.minutes}</label>
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => setRoundMinutes(Math.max(3, roundMinutes - 1))}
                className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300">-</button>
              <span className="text-3xl font-black w-12 text-center">{roundMinutes}</span>
              <button onClick={() => setRoundMinutes(Math.min(15, roundMinutes + 1))}
                className="w-10 h-10 rounded-full bg-stone-200 font-bold text-lg hover:bg-stone-300">+</button>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all"
        >
          {txt.start}
        </button>
      </div>
    </div>
  );
}
