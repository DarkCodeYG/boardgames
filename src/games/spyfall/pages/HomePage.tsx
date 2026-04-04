import { useSpyfallStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import { t } from '../../codenames/lib/i18n';
import type { WordPack } from '../../codenames/lib/words';
import { sfxToggle, sfxClick, sfxGameStart } from '../../../lib/sound';
import JWIcon from '../../../components/JWIcon';

const PACKS: { value: WordPack; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'jw', label: 'JW' },
];

const TEXTS = {
  ko: {
    title: '🔍 스파이폴',
    subtitle: '스파이를 찾아라!',
    start: '게임 만들기',
    howToPlay: '📋 게임 방법',
    rule1: '호스트 화면의 QR코드를 각자 스캔하고 이름을 입력하여 방에 입장합니다',
    rule2: '한 명만 스파이! 스파이는 장소를 모릅니다',
    rule3: '순서대로 다른 플레이어 한 명을 지목해 장소 관련 질문을 합니다',
    rule4: '직전에 자신에게 질문한 사람은 바로 지목할 수 없습니다. 너무 구체적인 질문은 스파이에게 힌트가 됩니다!',
    rule5: '시간 종료 후 투표로 스파이를 지목하거나, 스파이가 장소를 맞추면 스파이 승리!',
    tipTitle: '💡 팁',
    tip1: '스파이는 장소를 모르지만 질문에 자연스럽게 답해야 합니다.',
    tip2: '너무 구체적인 단서는 스파이를 도울 수 있으니 적당한 수준으로 질문하세요.',
  },
  en: {
    title: '🔍 Spyfall',
    subtitle: 'Find the spy!',
    start: 'Create Game',
    howToPlay: '📋 How to Play',
    rule1: 'Scan the host QR code and enter your name to join',
    rule2: 'One player is the spy! The spy doesn\'t know the location',
    rule3: 'Take turns designating one player to ask a location-related question',
    rule4: 'You cannot immediately question the player who just questioned you. Too specific = clues for the spy!',
    rule5: 'After time runs out, vote to identify the spy. If the spy guesses the location, the spy wins!',
    tipTitle: '💡 Tips',
    tip1: 'The spy must answer naturally without knowing the location.',
    tip2: 'Keep your questions vague enough not to help the spy figure out the location.',
  },
  zh: {
    title: '🔍 间谍危机',
    subtitle: '找出间谍！',
    start: '创建游戏',
    howToPlay: '📋 游戏规则',
    rule1: '扫描主机QR码并输入名字加入游戏',
    rule2: '其中一人是间谍！间谍不知道地点',
    rule3: '依次指定一名玩家提出与地点相关的问题',
    rule4: '不能立即指定刚问过自己的玩家。太具体的问题会给间谍提示！',
    rule5: '时间结束后投票指认间谍。如果间谍猜出地点，间谍获胜！',
    tipTitle: '💡 技巧',
    tip1: '间谍不知道地点，但必须自然地回答问题。',
    tip2: '问题不要太具体，否则会给间谍提供线索。',
  },
};

interface HomePageProps {
  onStartGame: () => void;
  onBack?: () => void;
}

export default function HomePage({ onStartGame, onBack }: HomePageProps) {
  const { pack, setPack } = useSpyfallStore();
  const lang = useGameStore((s) => s.lang);
  const txt = TEXTS[lang];

  const getPackButtonClass = (value: WordPack) => {
    const isJW = value === 'jw';
    const isActive = pack === value;
    if (isJW) {
      return `inline-flex items-center justify-center w-14 h-14 rounded-2xl transition-all ${isActive ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-90'}`;
    }
    return `px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${isActive ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`;
  };

  const handleStart = () => {
    sfxGameStart();
    onStartGame();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="text-center max-w-md w-full">
        {onBack && (
          <button onClick={() => { sfxClick(); onBack?.(); }} className="mb-4 text-stone-500 hover:text-stone-700 font-bold text-sm">
            ← {t(lang, 'goHome')}
          </button>
        )}

        {/* 단어팩 선택 */}
        <div className="flex justify-center gap-2 mb-6">
          {PACKS.map((p) => (
            <button
              key={p.value}
              onClick={() => { sfxToggle(); setPack(p.value); }}
              className={getPackButtonClass(p.value)}
            >
              {p.value === 'jw' ? <JWIcon active={pack === 'jw'} /> : p.label}
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
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="font-bold text-stone-600 text-sm mb-2">{txt.tipTitle}</p>
            <ul className="text-sm text-stone-400 space-y-1">
              <li>• {txt.tip1}</li>
              <li>• {txt.tip2}</li>
            </ul>
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
