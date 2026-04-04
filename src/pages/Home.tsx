import { useGameStore } from '../games/codenames/store/game-store';
import { LANG_LABELS, type Lang } from '../games/codenames/lib/i18n';
import { sfxToggle, sfxGameSelect } from '../lib/sound';

const LANGS: Lang[] = ['ko', 'en', 'zh'];

const TEXTS = {
  ko: { title: '🎲 보드게임', subtitle: '플레이할 게임을 선택하세요', more: '더 많은 게임이 곧 추가됩니다!',
        codenames: '코드네임', codenamesDesc: '단서를 주고 요원을 찾아라!', codenamesPlayers: '4+ 명',
        spyfall: '스파이폴', spyfallDesc: '스파이를 찾아라! 질문으로 정체를 밝혀내세요', spyfallPlayers: '3+ 명',
        witnesses: '중국의 증인들', witnessesDesc: '증인과 공안의 심리전! 봉사구역을 완수하라', witnessesPlayers: '5~12 명',
        fakeart: '가짜 화가', fakeartDesc: '가짜 화가를 찾아라! 그림으로 숨어라', fakeartPlayers: '4+ 명' },
  en: { title: '🎲 Board Games', subtitle: 'Choose a game to play', more: 'More games coming soon!',
        codenames: 'Codenames', codenamesDesc: 'Give clues, find your agents!', codenamesPlayers: '4+ players',
        spyfall: 'Spyfall', spyfallDesc: 'Find the spy! Ask questions to reveal them', spyfallPlayers: '3+ players',
        witnesses: 'Witnesses of China', witnessesDesc: 'Witnesses vs Agents! Complete service territories', witnessesPlayers: '5-12 players',
        fakeart: 'Fake Painter', fakeartDesc: 'Find the fake painter! Hide with your strokes', fakeartPlayers: '4+ players' },
  zh: { title: '🎲 桌游', subtitle: '选择要玩的游戏', more: '更多游戏即将推出！',
        codenames: '代号', codenamesDesc: '给出线索，找到特工！', codenamesPlayers: '4+ 人',
        spyfall: '间谍危机', spyfallDesc: '找出间谍！用提问揭露身份', spyfallPlayers: '3+ 人',
        witnesses: '中国的见证人', witnessesDesc: '见证人与公安的心理战！完成服务区域', witnessesPlayers: '5-12 人',
        fakeart: '假画家', fakeartDesc: '找出假画家！用画笔隐藏身份', fakeartPlayers: '4+ 人' },
};

interface HomeProps {
  onSelectGame: (gameId: string) => void;
}

export default function Home({ onSelectGame }: HomeProps) {
  const { lang, setLang } = useGameStore();
  const txt = TEXTS[lang];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-stone-100 to-stone-200 p-6 flex flex-col items-center justify-center">
      {/* 언어 선택 */}
      <div className="flex gap-2 mb-6">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => { sfxToggle(); setLang(l); }}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors
              ${lang === l
                ? 'bg-stone-800 text-white'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      <h1 className="text-5xl font-black text-stone-800 mb-2">{txt.title}</h1>
      <p className="text-stone-500 mb-8">{txt.subtitle}</p>

      <div className="grid gap-4 max-w-md w-full">
        <button
          onClick={() => { sfxGameSelect(); onSelectGame('codenames'); }}
          className="bg-white rounded-2xl p-5 shadow-md text-left
                     hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🕵️</span>
            <div>
              <h2 className="text-xl font-bold text-stone-800">{txt.codenames}</h2>
              <p className="text-sm text-stone-500">{txt.codenamesDesc}</p>
              <p className="text-xs text-stone-400 mt-1">{txt.codenamesPlayers}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { sfxGameSelect(); onSelectGame('spyfall'); }}
          className="bg-white rounded-2xl p-5 shadow-md text-left
                     hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔍</span>
            <div>
              <h2 className="text-xl font-bold text-stone-800">{txt.spyfall}</h2>
              <p className="text-sm text-stone-500">{txt.spyfallDesc}</p>
              <p className="text-xs text-stone-400 mt-1">{txt.spyfallPlayers}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { sfxGameSelect(); onSelectGame('witnesses'); }}
          className="bg-white rounded-2xl p-5 shadow-md text-left
                     hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📖</span>
            <div>
              <h2 className="text-xl font-bold text-stone-800">{txt.witnesses}</h2>
              <p className="text-sm text-stone-500">{txt.witnessesDesc}</p>
              <p className="text-xs text-stone-400 mt-1">{txt.witnessesPlayers}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { sfxGameSelect(); onSelectGame('fakeart'); }}
          className="bg-white rounded-2xl p-5 shadow-md text-left
                     hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎨</span>
            <div>
              <h2 className="text-xl font-bold text-stone-800">{txt.fakeart}</h2>
              <p className="text-sm text-stone-500">{txt.fakeartDesc}</p>
              <p className="text-xs text-stone-400 mt-1">{txt.fakeartPlayers}</p>
            </div>
          </div>
        </button>
      </div>

      <p className="text-stone-400 text-xs mt-8">{txt.more}</p>
    </div>
  );
}
