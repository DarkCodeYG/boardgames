import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../games/codenames/store/game-store';
import { LANG_LABELS, type Lang } from '../games/codenames/lib/i18n';
import Modal from '../components/Modal';
import { sfxToggle, sfxGameSelect, sfxClick } from '../lib/sound';
import { incrementPlayCount, fetchMonthlyStats } from '../lib/play-stats';

const LANGS: Lang[] = ['ko', 'en', 'zh'];

const TEXTS = {
  ko: { title: '🎲 보드게임', subtitle: '플레이할 게임을 선택하세요', more: '더 많은 게임이 곧 추가됩니다!',
        codenames: '코드네임', codenamesDesc: '단서를 주고 요원을 찾아라!', codenamesPlayers: '4+ 명',
        spyfall: '스파이폴', spyfallDesc: '스파이를 찾아라! 질문으로 정체를 밝혀내세요', spyfallPlayers: '3+ 명',
        witnesses: '중국의 증인들', witnessesDesc: '증인과 공안의 심리전! 봉사구역을 완수하라', witnessesPlayers: '5~12 명',
        fakeart: '가짜 화가', fakeartDesc: '가짜 화가를 찾아라! 그림으로 숨어라', fakeartPlayers: '4+ 명',
        set: 'Set', setDesc: '속성이 모두 같거나 모두 다르면 Set! 결합을 찾아라', setPlayers: '2+ 명',
        gomoku: '오목', gomokuDesc: '가로·세로·대각선으로 5개를 먼저 연결하면 승리!', gomokuPlayers: '2 명',
        go: '바둑', goDesc: '집을 더 많이 차지하면 승리! 따냄과 전략의 심리전', goPlayers: '2 명',
        davinci: '다빈치 코드', davinciDesc: '상대의 비밀 타일을 추리하라!', davinciPlayers: '2~6 명',
        agricola: '아그리콜라', agricolaDesc: '농장을 키우고 가족을 부양하라! 2016 개정판', agricolaPlayers: '2~4 명' },
  en: { title: '🎲 Board Games', subtitle: 'Choose a game to play', more: 'More games coming soon!',
        codenames: 'Codenames', codenamesDesc: 'Give clues, find your agents!', codenamesPlayers: '4+ players',
        spyfall: 'Spyfall', spyfallDesc: 'Find the spy! Ask questions to reveal them', spyfallPlayers: '3+ players',
        witnesses: 'Witnesses of China', witnessesDesc: 'Witnesses vs Agents! Complete service territories', witnessesPlayers: '5-12 players',
        fakeart: 'Fake Painter', fakeartDesc: 'Find the fake painter! Hide with your strokes', fakeartPlayers: '4+ players',
        set: 'Set', setDesc: 'All same or all different = Set! Find the combinations', setPlayers: '2+ players',
        gomoku: 'Gomoku', gomokuDesc: 'Connect 5 in a row horizontally, vertically, or diagonally!', gomokuPlayers: '2 players',
        go: 'Go', goDesc: 'Surround more territory to win! Strategy and capture', goPlayers: '2 players',
        davinci: 'Da Vinci Code', davinciDesc: "Deduce your opponent's secret tiles!", davinciPlayers: '2-6 players',
        agricola: 'Agricola', agricolaDesc: 'Build your farm and feed your family! 2016 Revised Edition', agricolaPlayers: '2-4 players' },
  zh: { title: '🎲 桌游', subtitle: '选择要玩的游戏', more: '更多游戏即将推出！',
        codenames: '代号', codenamesDesc: '给出线索，找到特工！', codenamesPlayers: '4+ 人',
        spyfall: '间谍危机', spyfallDesc: '找出间谍！用提问揭露身份', spyfallPlayers: '3+ 人',
        witnesses: '中国的见证人', witnessesDesc: '见证人与公安的心理战！完成服务区域', witnessesPlayers: '5-12 人',
        fakeart: '假画家', fakeartDesc: '找出假画家！用画笔隐藏身份', fakeartPlayers: '4+ 人',
        set: '集合', setDesc: '全相同或全不同即为集合！快速找到组合', setPlayers: '2+ 人',
        gomoku: '五子棋', gomokuDesc: '横、竖、斜方向率先连成五子者获胜！', gomokuPlayers: '2 人',
        go: '围棋', goDesc: '占领更多地盘即获胜！提子与策略的博弈', goPlayers: '2 人',
        davinci: '达芬奇密码', davinciDesc: '推理对手的秘密牌！', davinciPlayers: '2-6 人',
        agricola: '农家乐', agricolaDesc: '发展农场，养活家人！2016修订版', agricolaPlayers: '2-4 人' },
};

type GameId = keyof typeof TEXTS.ko;

interface GameEntry {
  id: GameId;
  icon: string;
  hidden?: boolean;
}

// 새 게임 추가 시 이 배열에만 항목 추가 → 집계·정렬·표시 자동 적용
const GAME_REGISTRY: GameEntry[] = [
  { id: 'codenames', icon: '🕵️' },
  { id: 'fakeart',   icon: '🎨' },
  { id: 'spyfall',   icon: '🔍' },
  { id: 'set',       icon: '🃏' },
  { id: 'gomoku',    icon: '⚫' },
  { id: 'go',        icon: '🪨' },
  { id: 'davinci',   icon: '🔢' },
  { id: 'witnesses', icon: '📖', hidden: true },
  { id: 'agricola',  icon: '🌾' },
];

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
  const [showHiddenWarning, setShowHiddenWarning] = useState<string | null>(null);
  const hiddenWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

  const sortedGames = useMemo(
    () => [...GAME_REGISTRY].sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0)),
    [playCounts],
  );

  useEffect(() => {
    fetchMonthlyStats()
      .then(setPlayCounts)
      .catch(() => {/* Firebase 실패 시 기본 순서 유지 */});
    return () => { if (hiddenWarningTimerRef.current) clearTimeout(hiddenWarningTimerRef.current); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQuiz) { setShowQuiz(false); setAnswer(''); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuiz]);

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
    if (answer.trim() === quiz.a) setHiddenMode(true);
    setShowQuiz(false);
    setAnswer('');
  };

  const handleSelectGame = (gameId: string) => {
    sfxGameSelect();
    incrementPlayCount(gameId).catch((err) => console.error('[play-stats] increment failed:', err));
    onSelectGame(gameId);
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
        {sortedGames.map((game) => {
          const isLocked = game.hidden && !hiddenMode;
          const count = playCounts[game.id] ?? 0;

          return (
            <button
              key={game.id}
              onClick={() => {
                if (isLocked) {
                  sfxClick();
                  if (hiddenWarningTimerRef.current) clearTimeout(hiddenWarningTimerRef.current);
                  setShowHiddenWarning(game.id);
                  hiddenWarningTimerRef.current = setTimeout(() => setShowHiddenWarning(null), 2500);
                } else {
                  handleSelectGame(game.id);
                }
              }}
              className="bg-white rounded-2xl p-5 shadow-md text-left
                         hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all relative"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`text-4xl ${isLocked ? 'grayscale opacity-50' : ''}`}
                  aria-hidden="true"
                >
                  {game.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className={`text-xl font-bold ${isLocked ? 'text-stone-400' : 'text-stone-800'}`}>
                    {txt[game.id]}
                  </h2>
                  <p className={`text-sm ${isLocked ? 'text-stone-300' : 'text-stone-500'}`}>
                    {txt[`${game.id}Desc` as GameId]}
                  </p>
                  <p className={`text-xs mt-1 ${isLocked ? 'text-stone-300' : 'text-stone-400'}`}>
                    {txt[`${game.id}Players` as GameId]}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isLocked && <span className="text-stone-300 text-xl" aria-hidden="true">🔒</span>}
                  {count > 0 && (
                    <span className={`text-xs font-medium ${isLocked ? 'text-stone-300' : 'text-stone-400'}`}>
                      ✦ {count}
                    </span>
                  )}
                </div>
              </div>
              {isLocked && showHiddenWarning === game.id && (
                <div className="absolute inset-0 bg-stone-800/90 rounded-2xl flex items-center justify-center">
                  <p className="text-white font-bold text-sm">
                    {{ ko: '🔒 히든모드를 해제하세요', en: '🔒 Unlock hidden mode first', zh: '🔒 请先解锁隐藏模式' }[lang]}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-stone-400 text-xs mt-8">{txt.more}</p>

      <p className="text-stone-500 text-xs mt-3 text-center">
        {{ ko: '📱 홈 화면에 추가: Safari → 공유(⬆) → 홈 화면에 추가', en: '📱 Add to Home Screen: Safari → Share(⬆) → Add to Home Screen', zh: '📱 添加到主屏幕：Safari → 分享(⬆) → 添加到主屏幕' }[lang]}
      </p>

      {/* 히든모드 토글 */}
      <button
        onClick={handleHiddenToggle}
        className="mt-4 text-stone-300 hover:text-stone-400 transition-colors"
      >
        {hiddenMode
          ? <span className="text-sm"><span aria-hidden="true">🔓</span> 히든모드</span>
          : <span className="text-2xl" aria-hidden="true">🔒</span>}
      </button>

      {/* 퀴즈 모달 */}
      {showQuiz && (
        <Modal titleId="quiz-question" onClose={() => { setShowQuiz(false); setAnswer(''); }}>
          <p id="quiz-question" className="text-stone-700 font-bold text-lg mb-4">{quiz.q[lang]}</p>
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
        </Modal>
      )}
    </div>
  );
}
