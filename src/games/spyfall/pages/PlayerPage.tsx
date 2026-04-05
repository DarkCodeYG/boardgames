import { useState, useEffect, useRef } from 'react';
import GameEndedModal from '../../../components/GameEndedModal';
import { getPlayerRole } from '../lib/game-engine';
import {
  joinSpyfallRoom,
  subscribeSpyfallRoom,
  sanitizeName,
  type SpyfallRoom,
} from '../lib/firebase-spyfall';
import type { Lang } from '../../codenames/lib/i18n';
import { sfxRoleReveal } from '../../../lib/sound';

const TEXTS = {
  ko: {
    enterName: '이름을 입력하세요',
    namePlaceholder: '이름',
    join: '입장하기',
    joining: '입장 중...',
    waiting: '호스트가 게임을 시작하길 기다리는 중...',
    players: '참가자',
    spy: '당신은 스파이입니다!',
    spyHint: '장소를 알아내세요!',
    location: '장소',
    role: '역할',
    notFound: '방을 찾을 수 없습니다.',
    duplicate: '이미 사용 중인 이름입니다.',
    alreadyPlaying: '이미 게임이 진행 중입니다.',
    roomCode: '방 코드',
    me: '나',
    error: '오류가 발생했습니다.',
    invalidRoom: '잘못된 접근입니다.',
    loading: '로딩 중...',
    gameEnded: '게임이 종료되었습니다',
    closeTab: '탭 닫기',
    closeTabHint: '탭을 직접 닫아주세요',
  },
  en: {
    enterName: 'Enter your name',
    namePlaceholder: 'Name',
    join: 'Join',
    joining: 'Joining...',
    waiting: 'Waiting for host to start...',
    players: 'Players',
    spy: 'You are the SPY!',
    spyHint: 'Figure out the location!',
    location: 'Location',
    role: 'Role',
    notFound: 'Room not found.',
    duplicate: 'Name already taken.',
    alreadyPlaying: 'Game already in progress.',
    roomCode: 'Room',
    me: 'me',
    error: 'An error occurred.',
    invalidRoom: 'Invalid access.',
    loading: 'Loading...',
    gameEnded: 'Game has ended',
    closeTab: 'Close Tab',
    closeTabHint: 'Please close this tab manually',
  },
  zh: {
    enterName: '请输入您的名字',
    namePlaceholder: '名字',
    join: '加入',
    joining: '加入中...',
    waiting: '等待主机开始游戏...',
    players: '玩家',
    spy: '你是间谍！',
    spyHint: '找出地点！',
    location: '地点',
    role: '角色',
    notFound: '找不到房间。',
    duplicate: '名字已被使用。',
    alreadyPlaying: '游戏已经开始。',
    roomCode: '房间',
    me: '我',
    error: '发生错误。',
    invalidRoom: '访问无效。',
    loading: '加载中...',
    gameEnded: '游戏已结束',
    closeTab: '关闭标签页',
    closeTabHint: '请手动关闭此标签页',
  },
};

type Step = 'join' | 'lobby' | 'card' | 'ended';

export default function SpyfallPlayerPage() {
  const [roomCode, setRoomCode] = useState('');
  const [lang, setLang] = useState<Lang>('ko');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('join');
  const [room, setRoom] = useState<SpyfallRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [prevSeed, setPrevSeed] = useState<string | null>(null);
  const [revealedSeed, setRevealedSeed] = useState<string | null>(null);
  const justJoinedRef = useRef(false);
  const roomNullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room') || '';
    setRoomCode(code);
    const urlLang = params.get('lang') as Lang | null;
    if (urlLang && ['ko', 'en', 'zh'].includes(urlLang)) setLang(urlLang);

    if (code) {
      // sessionStorage: 이 탭에서 직접 참가한 경우만 자동 재접속 (새 탭·새 스캔은 빈 sessionStorage)
      const sessionName = sessionStorage.getItem(`spyfall_session_${code}`);
      if (sessionName) {
        setName(sessionName);
        joinSpyfallRoom(code, sessionName).then((result) => {
          if (result.ok) { justJoinedRef.current = true; setStep('lobby'); }
          // 실패 시 join 화면 (이름은 pre-fill됨)
        }).catch(() => {});
        return;
      }

      // localStorage: 이름 pre-fill만 (join 화면 유지)
      const savedName = localStorage.getItem(`spyfall_name_${code}`);
      if (savedName) setName(savedName);
    }
  }, []);

  // Subscribe to room when not in join step
  useEffect(() => {
    if (!roomCode || step === 'join') return;
    const unsub = subscribeSpyfallRoom(roomCode, (data) => {
      if (!data) {
      if (!roomNullTimerRef.current) {
        roomNullTimerRef.current = setTimeout(() => setStep('ended'), 3000);
      }
      return;
    }
    if (roomNullTimerRef.current) {
      clearTimeout(roomNullTimerRef.current);
      roomNullTimerRef.current = null;
    }
      setRoom(data);
      if (data.lang) setLang(data.lang);
    });
    return () => unsub();
  }, [roomCode, step]);

  // Handle phase transitions
  useEffect(() => {
    if (!room) return;
    if (room.phase === 'playing' && room.seed && room.seed !== prevSeed) {
      setPrevSeed(room.seed);
      setStep('card');
    }
    if (room.phase === 'lobby') {
      setStep('lobby');
    }
  }, [room?.phase, room?.seed]);

  // Check if reconnecting player is still in the room
  useEffect(() => {
    if (step !== 'lobby' || !room || !name) return;
    const safeKey = sanitizeName(name);
    const inRoom = !!(room.players && room.players[safeKey]);
    if (inRoom) {
      justJoinedRef.current = false; // 방에 확인됨
      return;
    }
    if (justJoinedRef.current) return; // 방금 가입 — Firebase 반영 대기 중
    if (room.phase === 'lobby') {
      setStep('join');
      setName('');
    }
  }, [step, room, name, roomCode]);

  // Sound effect on card reveal (once per seed)
  useEffect(() => {
    if (step !== 'card' || !room?.seed || !room.playerCount || !name) return;
    if (room.seed === revealedSeed) return;
    const safeKey = sanitizeName(name);
    const sorted = Object.entries(room.players || {}).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
    const myIdx = sorted.findIndex(([k]) => k === safeKey);
    if (myIdx === -1) return;
    sfxRoleReveal();
    setRevealedSeed(room.seed);
  }, [step, room?.seed, room?.playerCount]);

  const txt = TEXTS[lang];

  // 이름 배너 (join 제외 모든 화면 상단 고정)
  const NameBanner = () => {
    if (!name || step === 'join') return null;
    return (
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-stone-200 py-2 px-4 flex items-center justify-center gap-2 z-50">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
        <span className="font-bold text-stone-800 text-sm">{name}</span>
      </div>
    );
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode) return;
    setJoining(true);
    setError(null);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      const result = await Promise.race([joinSpyfallRoom(roomCode, name.trim()), timeout]);
      if (result.ok) {
        justJoinedRef.current = true;
        sessionStorage.setItem(`spyfall_session_${roomCode}`, name.trim());
        localStorage.setItem(`spyfall_name_${roomCode}`, name.trim());
        setStep('lobby');
      } else {
        switch (result.error) {
          case 'not_found': setError(txt.notFound); break;
          case 'duplicate': setError(txt.duplicate); break;
          case 'already_playing': setError(txt.alreadyPlaying); break;
        }
      }
    } catch {
      setError('연결에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setJoining(false);
    }
  };

  if (!roomCode) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-100">
        <p className="text-stone-500">{txt.invalidRoom}</p>
      </div>
    );
  }

  // Ended step
  if (step === 'ended') {
    return <GameEndedModal emoji="🔍" title={txt.gameEnded} closeLabel={txt.closeTab} closeHint={txt.closeTabHint} />;
  }

  // Join step
  if (step === 'join') {
    return (
      <div className="min-h-dvh flex flex-col bg-gradient-to-b from-stone-100 to-stone-200">
        <div className="p-4">
          <a href="/" className="text-stone-400 hover:text-stone-600 text-sm font-bold">← 홈</a>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-xs w-full shadow-lg">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-stone-400 text-sm">
              {txt.roomCode}: <span className="font-black text-stone-800 text-lg">{roomCode}</span>
            </p>
          </div>
          <p className="text-stone-600 font-bold mb-3 text-center">{txt.enterName}</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder={txt.namePlaceholder}
            maxLength={20}
            autoFocus
            className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-lg font-bold text-stone-800
                       focus:outline-none focus:border-stone-400 mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={!name.trim() || joining}
            className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-lg
                       hover:bg-stone-700 active:scale-95 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {joining ? txt.joining : txt.join}
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Lobby step
  if (step === 'lobby') {
    const safeKey = sanitizeName(name);
    const players = room?.players
      ? Object.entries(room.players).sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
      : [];
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
        <NameBanner />
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-lg text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-stone-400 text-sm mb-5">{txt.waiting}</p>
          <div className="text-left">
            <p className="text-xs font-bold text-stone-400 uppercase mb-2">
              {txt.players} ({players.length})
            </p>
            <div className="space-y-1">
              {players.map(([k], i) => (
                <div
                  key={k}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${k === safeKey ? 'bg-stone-100' : ''}`}
                >
                  <span className="text-xs text-stone-400 w-4">{i + 1}</span>
                  <span className={`flex-1 font-medium ${k === safeKey ? 'text-stone-800 font-bold' : 'text-stone-600'}`}>
                    {k}
                  </span>
                  {k === safeKey && <span className="text-xs text-stone-400">{txt.me}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card step
  if (step === 'card' && room?.seed && room.playerCount) {
    const safeKey = sanitizeName(name);
    const sorted = Object.entries(room.players || {}).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
    const myIdx = sorted.findIndex(([k]) => k === safeKey);

    if (myIdx === -1) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-stone-100">
          <p className="text-stone-500">{txt.error}</p>
        </div>
      );
    }

    const myRole = getPlayerRole(room.seed, myIdx, room.playerCount, lang, room.pack);

    if (myRole.isSpy) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
          <NameBanner />
          <div className="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-lg">
            <div className="text-8xl mb-4">🕵️</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <h1 className="text-2xl font-black text-stone-800">{txt.spy}</h1>
            </div>
            <p className="text-stone-500 text-lg">{txt.spyHint}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <NameBanner />
        <div className="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-lg">
          <div className="text-8xl mb-4">📍</div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            <p className="text-stone-400 text-sm">{txt.location}</p>
          </div>
          <h1 className="text-3xl font-black text-stone-800 mb-4">{myRole.location}</h1>
          {myRole.role && (
            <>
              <p className="text-stone-400 text-sm mb-1">{txt.role}</p>
              <h2 className="text-xl font-bold text-stone-700">{myRole.role}</h2>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-100">
      <p className="text-stone-400">{txt.loading}</p>
    </div>
  );
}
