import { useState } from 'react';
import { useGameStore } from '../games/codenames/store/game-store';
import { LANG_LABELS, type Lang } from '../games/codenames/lib/i18n';
import { sfxToggle, sfxGameSelect, sfxClick } from '../lib/sound';

const LANGS: Lang[] = ['ko', 'en', 'zh'];

const TEXTS = {
  ko: { title: '🎲 보드게임', subtitle: '플레이할 게임을 선택하세요', more: '더 많은 게임이 곧 추가됩니다!',
        codenames: '코드네임', codenamesDesc: '단서를 주고 요원을 찾아라!', codenamesPlayers: '4+ 명',
        spyfall: '스파이폴', spyfallDesc: '스파이를 찾아라! 질문으로 정체를 밝혀내세요', spyfallPlayers: '3+ 명',
        witnesses: '중국의 증인들', witnessesDesc: '증인과 공안의 심리전! 봉사구역을 완수하라', witnessesPlayers: '5~12 명',
        fakeart: '가짜 화가', fakeartDesc: '가짜 화가를 찾아라! 그림으로 숨어라', fakeartPlayers: '4+ 명',
        set: 'SET', setDesc: '속성이 모두 같거나 모두 다르면 SET! 결합을 찾아라', setPlayers: '2+ 명' },
  en: { title: '🎲 Board Games', subtitle: 'Choose a game to play', more: 'More games coming soon!',
        codenames: 'Codenames', codenamesDesc: 'Give clues, find your agents!', codenamesPlayers: '4+ players',
        spyfall: 'Spyfall', spyfallDesc: 'Find the spy! Ask questions to reveal them', spyfallPlayers: '3+ players',
        witnesses: 'Witnesses of China', witnessesDesc: 'Witnesses vs Agents! Complete service territories', witnessesPlayers: '5-12 players',
        fakeart: 'Fake Painter', fakeartDesc: 'Find the fake painter! Hide with your strokes', fakeartPlayers: '4+ players',
        set: 'Set', setDesc: 'All same or all different = Set! Find the combinations', setPlayers: '2+ players' },
  zh: { title: '🎲 桌游', subtitle: '选择要玩的游戏', more: '更多游戏即将推出！',
        codenames: '代号', codenamesDesc: '给出线索，找到特工！', codenamesPlayers: '4+ 人',
        spyfall: '间谍危机', spyfallDesc: '找出间谍！用提问揭露身份', spyfallPlayers: '3+ 人',
        witnesses: '中国的见证人', witnessesDesc: '见证人与公安的心理战！完成服务区域', witnessesPlayers: '5-12 人',
        fakeart: '假画家', fakeartDesc: '找出假画家！用画笔隐藏身份', fakeartPlayers: '4+ 人',
        set: '集合', setDesc: '全相同或全不同即为集合！快速找到组合', setPlayers: '2+ 人' },
};

const QUIZ_POOL = [
  { q: { ko: '왕국설립년도?', en: 'Year the Kingdom was established?', zh: '王国建立年份？' }, a: '1914' },
  { q: { ko: 'RP의 1년 요구시간?', en: 'Annual hours required for RP?', zh: 'RP年度时间要求？' }, a: '600' },
  { q: { ko: '큰무리발표년도?', en: 'Year the Great Crowd was identified?', zh: '大群人宣布年份？' }, a: '1935' },
];

interface HomeProps {
  onSelectGame: (gameId: string) => void;
}

export default function Home({ onSelectGame }: HomeProps) {
  const { lang, setLang, hiddenMode, setHiddenMode } = useGameStore();
  const txt = TEXTS[lang];

  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz] = useState(() => QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)]);
  const [answer, setAnswer] = useState('');
  const [showHiddenWarning, setShowHiddenWarning] = useState(false);

  const handleHiddenToggle = () => {
    sfxClick();
    if (hiddenMode) {
      setHiddenMode(false);
    } else {
      setShowQuiz(true);
      setAnswer('');
    }
  };

  const handleQuizSubmit = () => {
    if (answer.trim() === quiz.a) {
      setHiddenMode(true);
    }
    setShowQuiz(false);
    setAnswer('');
  };

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
          onClick={() => { sfxGameSelect(); onSelectGame('set'); }}
          className="bg-white rounded-2xl p-5 shadow-md text-left
                     hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🃏</span>
            <div>
              <h2 className="text-xl font-bold text-stone-800">{txt.set}</h2>
              <p className="text-sm text-stone-500">{txt.setDesc}</p>
              <p className="text-xs text-stone-400 mt-1">{txt.setPlayers}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            if (!hiddenMode) {
              sfxClick();
              setShowHiddenWarning(true);
              setTimeout(() => setShowHiddenWarning(false), 2500);
            } else {
              sfxGameSelect();
              onSelectGame('witnesses');
            }
          }}
          className="bg-white rounded-2xl p-5 shadow-md text-left
                     hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative"
        >
          <div className="flex items-center gap-4">
            <span className={`text-4xl ${!hiddenMode ? 'grayscale opacity-50' : ''}`}>📖</span>
            <div>
              <h2 className={`text-xl font-bold ${!hiddenMode ? 'text-stone-400' : 'text-stone-800'}`}>{txt.witnesses}</h2>
              <p className={`text-sm ${!hiddenMode ? 'text-stone-300' : 'text-stone-500'}`}>{txt.witnessesDesc}</p>
              <p className={`text-xs mt-1 ${!hiddenMode ? 'text-stone-300' : 'text-stone-400'}`}>{txt.witnessesPlayers}</p>
            </div>
            {!hiddenMode && <span className="ml-auto text-stone-300 text-xl">🔒</span>}
          </div>
          {showHiddenWarning && (
            <div className="absolute inset-0 bg-stone-800/90 rounded-2xl flex items-center justify-center">
              <p className="text-white font-bold text-sm">
                {{ ko: '🔒 히든모드를 해제하세요', en: '🔒 Unlock hidden mode first', zh: '🔒 请先解锁隐藏模式' }[lang]}
              </p>
            </div>
          )}
        </button>
      </div>

      <p className="text-stone-400 text-xs mt-8">{txt.more}</p>

      {/* 히든모드 토글 */}
      <button
        onClick={handleHiddenToggle}
        className="mt-4 text-stone-300 hover:text-stone-400 transition-colors"
      >
        {hiddenMode ? <span className="text-sm">🔓 히든모드</span> : <span className="text-2xl">🔒</span>}
      </button>

      {/* 퀴즈 모달 */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <p className="text-stone-700 font-bold text-lg mb-4 text-center">{quiz.q[lang]}</p>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuizSubmit()}
              className="w-full border-2 border-stone-300 focus:border-stone-500 rounded-xl px-4 py-2 text-center text-lg font-bold outline-none transition-colors"
              placeholder={{ ko: '답을 입력하세요', en: 'Enter answer', zh: '请输入答案' }[lang]}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowQuiz(false)}
                className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-500 font-bold hover:bg-stone-200"
              >
                {{ ko: '취소', en: 'Cancel', zh: '取消' }[lang]}
              </button>
              <button
                onClick={handleQuizSubmit}
                className="flex-1 py-2 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700"
              >
                {{ ko: '확인', en: 'OK', zh: '确认' }[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
