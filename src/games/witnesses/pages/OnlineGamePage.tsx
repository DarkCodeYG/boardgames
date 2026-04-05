import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { wt, TEXTS } from '../lib/i18n';
import { createRoom, setGameState, subscribeRoom, submitAction, deleteRoom, resetRoomForNewGame, cleanupOldRooms, updateGameState } from '../lib/firebase-room';
import { startGame as startGameEngine, getPlayerInfo, proceedAfterVote, nextRound, assassinate } from '../lib/game-engine';
import { createGame, addPlayer } from '../lib/game-engine';
import type { GameState, SpecialRole } from '../lib/types';
import { sfxGameStart, sfxVictory, sfxDefeat, sfxAssassin, sfxClick, sfxModalOpen, sfxTurnEnd, sfxToggle, sfxCardFlip } from '../../../lib/sound';

interface Props {
  onGoHome: () => void;
  enabledRoles: SpecialRole[];
  playerCount: number;
}

// 효과음은 공유 모듈 사용 (src/lib/sound.ts)

type HostPhase =
  | 'lobby'
  | 'role-reveal'
  | 'map'
  | 'waiting-team'
  | 'team-announced'
  | 'waiting-vote'
  | 'vote-result'
  | 'confirm-mission'
  | 'waiting-mission'
  | 'confirm-mission-result'
  | 'mission-result'
  | 'assassinate'
  | 'finished';

export default function OnlineGamePage({ onGoHome, enabledRoles, playerCount }: Props) {
  const globalLang = useGameStore((s) => s.lang);
  const setLang = useGameStore((s) => s.setLang);
  const lang = globalLang;
  const txt = TEXTS[lang];
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<Record<string, unknown> | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [hostPhase, setHostPhase] = useState<HostPhase>('lobby');
  const [countdown, setCountdown] = useState(30);
  const [manualName, setManualName] = useState('');
  const [revealRoles, setRevealRoles] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const hostPhaseRef = useRef(hostPhase);

  // ref 동기화
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { hostPhaseRef.current = hostPhase; }, [hostPhase]);

  // 탭 닫기 / 페이지 이동 시 방 삭제
  useEffect(() => {
    const handleUnload = () => {
      if (roomCodeRef.current) {
        navigator.sendBeacon?.(`https://boardgame-373fb-default-rtdb.firebaseio.com/rooms/${roomCodeRef.current}.json`, '');
        deleteRoom(roomCodeRef.current).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (roomCodeRef.current) deleteRoom(roomCodeRef.current).catch(() => {});
    };
  }, []);

  // 방 생성
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!roomCode) setRoomError('Firebase 연결 시간 초과. 네트워크를 확인하거나 Firebase 보안 규칙을 갱신하세요.');
    }, 8000);
    createRoom(enabledRoles, playerCount, globalLang).then((code) => {
      clearTimeout(timer);
      setRoomCode(code);
    }).catch((err) => {
      clearTimeout(timer);
      setRoomError(`방 생성 실패: ${err.message}`);
    });
    // 1시간 이상 된 오래된 방 정리 (백그라운드)
    cleanupOldRooms().catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  // 방 구독
  useEffect(() => {
    if (!roomCode) return;
    return subscribeRoom(roomCode, (data) => {
      setRoomData(data);

      // Firebase에서 phase 변경 감지 → 호스트 phase 전환
      if (data) {
        const serverPhase = data.phase as string;

        // 인도자가 팀 확정 → 알림음 + 안내 + Firebase teamIds를 로컬 game에 동기화
        if (prevPhaseRef.current === 'team-build' && serverPhase === 'vote') {
          sfxModalOpen();
          // Firebase에서 teamIds를 읽어 로컬 game에 반영
          const fbMissions = data.missions as Record<string, unknown>[] | undefined;
          setGame(prev => {
            if (!prev) return prev;
            const round = prev.currentRound;
            if (fbMissions?.[round]) {
              const fbTeamIds = (fbMissions[round] as Record<string, unknown>).teamIds as string[] | undefined;
              if (fbTeamIds && fbTeamIds.length > 0) {
                const missions = [...prev.missions];
                missions[round] = { ...missions[round], teamIds: fbTeamIds };
                return { ...prev, missions };
              }
            }
            return prev;
          });
          setHostPhase('team-announced');
          setTimeout(() => setHostPhase('waiting-vote'), 3000);
        }

        // 투표 완료
        if (serverPhase === 'vote') {
          const missions = data.missions as Record<string, unknown>[] | undefined;
          const currentRound = data.currentRound as number;
          if (missions?.[currentRound]) {
            const votes = (missions[currentRound] as Record<string, unknown>).votes as Record<string, boolean> | undefined;
            const totalPlayers = game?.players.length || 0;
            if (votes && Object.keys(votes).length === totalPlayers && hostPhaseRef.current === 'waiting-vote') {
              sfxModalOpen();
              setHostPhase('vote-result');
            }
          }
        }

        // 봉사 완료
        if (serverPhase === 'mission') {
          const missions = data.missions as Record<string, unknown>[] | undefined;
          const currentRound = data.currentRound as number;
          if (missions?.[currentRound]) {
            const m = missions[currentRound] as Record<string, unknown>;
            const submissions = m.submissions as Record<string, boolean> | undefined;
            const teamIds = (m.teamIds as string[]) || [];
            if (submissions && Object.keys(submissions).length === teamIds.length && hostPhaseRef.current === 'waiting-mission') {
              sfxModalOpen();
              setHostPhase('confirm-mission-result');
            }
          }
        }

        prevPhaseRef.current = serverPhase;
      }
    });
  }, [roomCode, game?.players.length]);

  // 카운트다운
  useEffect(() => {
    if (hostPhase !== 'role-reveal') return;
    const endAt = Date.now() + 30000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setCountdown(left);
    }, 200);
    return () => clearInterval(timer);
  }, [hostPhase]);

  const players = roomData?.players as Record<string, { name: string }> | undefined;
  const playerList = players ? Object.entries(players).map(([id, p]) => ({ id, name: p.name })) : [];
  const joinUrl = roomCode ? `${window.location.origin}${window.location.pathname}?game=witnesses-online&room=${roomCode}&lang=${lang}` : '';

  const currentMission = game?.missions[game.currentRound];
  const leader = currentMission ? game?.players.find(p => p.id === currentMission.leaderId) : null;

  // 봉사 결과 카드 셔플 (memoize — 렌더마다 재셔플 방지)
  const missionCards = useMemo(() => {
    if (!currentMission?.submissions) return [];
    return [...Object.values(currentMission.submissions)].sort(() => Math.random() - 0.5);
  }, [currentMission?.result]);

  // confetti 위치 (memoize)
  const confettiPositions = useMemo(() =>
    Array.from({ length: 30 }, () => ({
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
    })), [hostPhase]);

  // Firebase 동기화
  const syncGame = async (newGame: GameState, extraPhase?: string) => {
    if (!roomCode) return;
    setGame(newGame);
    const playerInfos: Record<string, { team: string; specialRole: string | null; info: string[] }> = {};
    for (const p of newGame.players) {
      playerInfos[p.id] = { team: p.team, specialRole: p.specialRole, info: getPlayerInfo(newGame, p.id, lang) };
    }
    await setGameState(roomCode, {
      ...serializeGame(newGame),
      phase: extraPhase || newGame.phase,
      playerInfos,
      playerMapping: roomData?.playerMapping || {},
      players: roomData?.players || {},
    });
  };

  function serializeGame(g: GameState): Record<string, unknown> {
    return {
      phase: g.phase,
      currentRound: g.currentRound,
      currentLeaderIndex: g.currentLeaderIndex,
      consecutiveRejects: g.consecutiveRejects,
      witnessWins: g.witnessWins,
      agentWins: g.agentWins,
      winner: g.winner,
      winReason: g.winReason,
      assassinTarget: g.assassinTarget,
      seed: g.seed,
      roleRevealEndAt: g.roleRevealEndAt,
      enabledRoles: g.enabledRoles.filter(r => r !== null),
      commanderIsAlsoCleric: g.commanderIsAlsoCleric || false,
      gamePlayers: Object.fromEntries(g.players.map(p => [p.id, { name: p.name, team: p.team, specialRole: p.specialRole }])),
      missions: g.missions.map(m => ({
        round: m.round, requiredSize: m.requiredSize, needsTwoFails: m.needsTwoFails,
        leaderId: m.leaderId, teamIds: m.teamIds || [], votes: m.votes || {},
        approved: m.approved, submissions: m.submissions || {}, result: m.result,
      })),
    };
  }

  // 수동 이름 추가
  const handleManualAdd = async () => {
    if (!roomCode || !manualName.trim()) return;
    const trimmed = manualName.trim();
    // 중복 이름 체크
    if (playerList.some(p => p.name === trimmed)) {
      alert(wt(lang, 'duplicateName'));
      return;
    }
    // 초과 인원 체크
    if (playerList.length >= playerCount) {
      alert(wt(lang, 'roomFull'));
      return;
    }
    const pid = `manual_${Date.now().toString(36)}`;
    await submitAction(roomCode, `players/${pid}`, { name: trimmed, manual: true });
    setManualName('');
  };

  const handleLangChange = (newLang: typeof globalLang) => {
    sfxClick();
    setLang(newLang);
    if (roomCode) updateGameState(roomCode, { lang: newLang }).catch(() => {});
  };

  const LangToggle = () => (
    <div className="flex gap-0.5 bg-stone-200 rounded-lg p-0.5">
      {(['ko', 'en', 'zh'] as const).map((l) => (
        <button key={l} onClick={() => handleLangChange(l)}
          className={`px-2 py-1 rounded-md text-xs font-black transition-all ${
            lang === l ? 'bg-white text-stone-800 shadow' : 'text-stone-500 hover:text-stone-700'
          }`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  // 게임 시작
  const handleStart = async () => {
    if (!roomCode || playerList.length !== playerCount) return;
    sfxGameStart();

    // playerCount 인원만큼만 사용 (초과 참가 방지)
    const activePlayers = playerList.slice(0, playerCount);

    let gameState = createGame(enabledRoles);
    for (const p of activePlayers) {
      gameState = addPlayer(gameState, p.name);
    }
    gameState = startGameEngine(gameState);

    // 플레이어 매핑: Firebase pid → game pid
    const mapping: Record<string, string> = {};
    activePlayers.forEach((p, i) => { mapping[p.id] = `p${i}`; });

    const playerInfos: Record<string, { team: string; specialRole: string | null; info: string[] }> = {};
    for (const p of gameState.players) {
      playerInfos[p.id] = { team: p.team, specialRole: p.specialRole, info: getPlayerInfo(gameState, p.id, lang) };
    }

    await setGameState(roomCode, {
      ...serializeGame(gameState),
      playerInfos,
      playerMapping: mapping,
      players: roomData?.players || {},
    });

    setGame(gameState);
    setHostPhase('role-reveal');
  };

  // 역할 확인 후 맵으로
  const handleProceedToMap = async () => {
    if (!game || !roomCode) return;
    sfxModalOpen();
    const newGame = { ...game, phase: 'team-build' as const };
    await syncGame(newGame);
    setHostPhase('waiting-team');
  };

  // 투표 결과 처리 후
  const handleAfterVoteResult = async () => {
    if (!game || !roomCode || !roomData) return;
    // Firebase에서 현재 미션 데이터 읽기 (teamIds, votes 포함)
    const fbMissions = (roomData.missions as Record<string, unknown>[]) || [];
    const fbm = fbMissions[game.currentRound] as Record<string, unknown> | undefined;
    if (!fbm) return;
    const votes = (fbm.votes || {}) as Record<string, boolean>;
    const fbTeamIds = (fbm.teamIds as string[]) || game.missions[game.currentRound].teamIds;
    const approveCount = Object.values(votes).filter(v => v).length;
    const approved = approveCount > game.players.length / 2;

    const updatedMissions = [...game.missions];
    updatedMissions[game.currentRound] = { ...updatedMissions[game.currentRound], teamIds: fbTeamIds, votes, approved };

    let newGame: GameState = { ...game, missions: updatedMissions };

    if (approved) {
      newGame = { ...newGame, phase: 'mission' as const, consecutiveRejects: 0 };
      await syncGame(newGame, 'vote-result'); // 클라이언트는 호스트가 봉사 시작 확인할 때까지 대기
      setHostPhase('confirm-mission');
    } else {
      const rejects = game.consecutiveRejects + 1;
      if (rejects >= 5) {
        newGame = { ...newGame, phase: 'finished' as const, winner: 'agent', winReason: 'winReason5Rejects', consecutiveRejects: rejects };
        await syncGame(newGame);
        setHostPhase('finished'); newGame.winner === 'witness' ? sfxVictory() : sfxDefeat();
      } else {
        newGame = proceedAfterVote({ ...newGame, consecutiveRejects: rejects });
        await syncGame(newGame);
        setHostPhase('waiting-team');
      }
    }
  };

  // 봉사 시작
  const handleStartMission = async () => {
    if (!game || !roomCode) return;
    sfxModalOpen();
    await submitAction(roomCode, 'phase', 'mission');
    setHostPhase('waiting-mission');
  };

  // 봉사 결과 확인
  const handleRevealMissionResult = async () => {
    if (!game || !roomCode || !roomData) return;
    sfxAssassin();
    const fbMissions = (roomData.missions as Record<string, unknown>[]) || [];
    const fbm = fbMissions[game.currentRound] as Record<string, unknown> | undefined;
    if (!fbm) return;
    const submissions = (fbm.submissions || {}) as Record<string, boolean>;

    const failCount = Object.values(submissions).filter(v => !v).length;
    const mission = game.missions[game.currentRound];
    const isFail = mission.needsTwoFails ? failCount >= 2 : failCount >= 1;
    const result = isFail ? 'fail' as const : 'success' as const;

    const updatedMissions = [...game.missions];
    updatedMissions[game.currentRound] = { ...mission, submissions, result };

    const newWW = game.witnessWins + (result === 'success' ? 1 : 0);
    const newAW = game.agentWins + (result === 'fail' ? 1 : 0);

    let newGame: GameState = { ...game, missions: updatedMissions, witnessWins: newWW, agentWins: newAW };

    if (newAW >= 3) {
      newGame = { ...newGame, phase: 'finished' as const, winner: 'agent', winReason: 'winReason3Fail' };
      await syncGame(newGame);
      setHostPhase('finished'); newGame.winner === 'witness' ? sfxVictory() : sfxDefeat();
    } else if (newWW >= 3) {
      const hasCmd = game.players.some(p => p.specialRole === 'commander');
      if (hasCmd) {
        newGame = { ...newGame, phase: 'assassinate' as const };
        await syncGame(newGame);
        setHostPhase('assassinate');
      } else {
        newGame = { ...newGame, phase: 'finished' as const, winner: 'witness', winReason: 'winReason3Success' };
        await syncGame(newGame);
        setHostPhase('finished'); newGame.winner === 'witness' ? sfxVictory() : sfxDefeat();
      }
    } else {
      await syncGame(newGame, 'mission-result');
      setHostPhase('mission-result');
    }
  };

  // 다음 라운드
  const handleNextRound = async () => {
    if (!game) return;
    sfxModalOpen();
    const newGame = nextRound(game);
    await syncGame(newGame);
    setHostPhase('waiting-team');
  };

  // 당간부 지목
  const handleAssassinate = async (targetId: string) => {
    if (!game) return;
    sfxAssassin();
    const newGame = assassinate(game, targetId);
    await syncGame(newGame);
    setHostPhase('finished'); newGame.winner === 'witness' ? sfxVictory() : sfxDefeat();
  };

  // 에러 화면
  if (roomError) return (
    <div className="h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-700 font-bold mb-4">{roomError}</p>
        <button onClick={() => { sfxClick(); onGoHome(); }} className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold">{wt(lang, 'goHome')}</button>
      </div>
    </div>
  );

  if (!roomCode) return (
    <div className="h-dvh flex flex-col items-center justify-center bg-stone-100">
      <div className="animate-spin w-8 h-8 border-4 border-stone-300 border-t-stone-800 rounded-full mb-4" />
      <p className="text-stone-500 font-bold">{wt(lang, 'creatingRoom')}</p>
    </div>
  );

  // ===== 재접속 QR + 다시하기 (하단 고정) =====
  const ReconnectQR = () => (
    <div className="fixed bottom-4 right-4 flex items-end gap-2">
      {hostPhase === 'role-reveal' && (
        <button
          onClick={() => { sfxClick(); handleProceedToMap(); }}
          className="bg-white rounded-xl px-3 py-2 shadow-lg opacity-80 hover:opacity-100 transition-opacity text-stone-500 hover:text-amber-500 text-xs font-bold"
        >
          ⏭ {txt.skipBtn}
        </button>
      )}
      <button
        onClick={() => { if (confirm(wt(lang, 'confirmRestart'))) { if (roomCode) resetRoomForNewGame(roomCode).catch(() => {}); setHostPhase('lobby'); } }}
        className="bg-white rounded-xl px-3 py-2 shadow-lg opacity-80 hover:opacity-100 transition-opacity text-stone-500 hover:text-red-500 text-xs font-bold"
      >
        🔄 {wt(lang, 'playAgain')}
      </button>
      <button
        onClick={() => { if (confirm(txt.confirmGoHome)) { if (roomCode) deleteRoom(roomCode).catch(() => {}); onGoHome(); } }}
        className="bg-white rounded-xl px-3 py-2 shadow-lg opacity-80 hover:opacity-100 transition-opacity text-stone-500 hover:text-blue-500 text-xs font-bold"
      >
        🏠 {txt.goHomeBtn}
      </button>
      <div className="bg-white rounded-xl p-1 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
        <LangToggle />
      </div>
      <div className="bg-white rounded-xl p-2 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
        <QRCodeSVG value={joinUrl} size={80} />
        <p className="text-[10px] text-stone-400 text-center mt-1">{wt(lang, 'reconnect')}</p>
      </div>
    </div>
  );

  // ===== 구역 맵 컴포넌트 (파워그리드 스타일 중국 지도) =====
  const MissionMap = () => {
    if (!game) return null;
    const { missions, currentRound } = game;

    const getNodeStyle = (i: number) => {
      const m = missions[i];
      if (m.result === 'success') return { fill: '#3b82f6', ring: '#1d4ed8', text: '#ffffff' };
      if (m.result === 'fail')    return { fill: '#ef4444', ring: '#b91c1c', text: '#ffffff' };
      if (i === currentRound)     return { fill: '#f59e0b', ring: '#b45309', text: '#1c1917' };
      return { fill: '#e7e5e4', ring: '#a8a29e', text: '#78716c' };
    };

    // 구역 위치 (viewBox 400×240 기준 — 중국 지도 상 대략적 지역)
    const zones = [
      { x: 88,  y: 70  },  // 1: 서북 (신장·내몽골)
      { x: 295, y: 52  },  // 2: 동북 (만주·베이징)
      { x: 198, y: 130 },  // 3: 중원 (허난·후베이)
      { x: 108, y: 192 },  // 4: 서남 (윈난·쓰촨)
      { x: 282, y: 182 },  // 5: 동남 (광둥·푸젠)
    ];

    const roads: [number, number][] = [
      [0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4],
    ];

    return (
      <div className="mb-6 w-full max-w-lg mx-auto px-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">📍</span>
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{txt.currentTerritory}</span>
          <span className="bg-amber-400 text-stone-800 text-sm font-black px-3 py-0.5 rounded-full shadow-sm">{currentRound + 1}번</span>
        </div>
        <div className="rounded-xl overflow-hidden drop-shadow-md">
          <svg viewBox="0 0 400 240" className="w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wSeaBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#bfdbfe" />
              </linearGradient>
              <linearGradient id="wLandFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4e6b5" />
                <stop offset="100%" stopColor="#c2d99f" />
              </linearGradient>
              <filter id="wGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* 바다 배경 (동·남 해안만 보임) */}
            <rect width="400" height="240" fill="url(#wSeaBg)" />
            {/* 파도 라인 */}
            {[40, 80, 120, 160, 200].map(y => (
              <path key={y}
                d={`M 0,${y} Q 50,${y - 6} 100,${y} Q 150,${y + 6} 200,${y} Q 250,${y - 6} 300,${y} Q 350,${y + 6} 400,${y}`}
                stroke="#93c5fd" strokeWidth="0.9" fill="none" opacity="0.4"
              />
            ))}

            {/* 중국 본토 — fill만, stroke 없음 (내륙 국경에 선 안 그림) */}
            <path
              d="M 0,0
                 L 75,3 L 155,0 L 235,4 L 308,2 L 368,7 L 392,22
                 L 390,52 L 376,80 L 360,106 L 346,130 L 338,153
                 L 318,172 L 293,188 L 263,200 L 228,210
                 L 193,212 L 170,206 L 145,219 L 94,240
                 L 0,240 Z"
              fill="url(#wLandFill)"
            />
            {/* 해안선만 별도 stroke — 동·동남 해안(황해~남중국해)만 표시 */}
            <path
              d="M 392,22
                 L 390,52 L 376,80 L 360,106 L 346,130 L 338,153
                 L 318,172 L 293,188 L 263,200 L 228,210
                 L 193,212 L 170,206 L 145,219 L 94,240"
              fill="none" stroke="#7a9c52" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* 청장고원 (서북 고지대 음영) */}
            <path
              d="M 0,0 L 75,3 L 105,24 L 122,56 L 124,88
                 L 108,114 L 86,138 L 64,165 L 45,148 L 20,125 L 0,100 Z"
              fill="#c4d898" opacity="0.52"
            />

            {/* 지형 격자선 */}
            {[60, 120, 180].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#a8c470" strokeWidth="0.4" opacity="0.28" />
            ))}
            {[100, 200, 300].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" stroke="#a8c470" strokeWidth="0.4" opacity="0.28" />
            ))}

            {/* 도로 연결선 */}
            {roads.map(([a, b], i) => (
              <line key={i}
                x1={zones[a].x} y1={zones[a].y}
                x2={zones[b].x} y2={zones[b].y}
                stroke="#57534e" strokeWidth="2.5" strokeDasharray="8,5"
                strokeLinecap="round" opacity="0.5"
              />
            ))}

            {/* 구역 노드 */}
            {zones.map((z, i) => {
              const s = getNodeStyle(i);
              const active = i === currentRound;
              return (
                <g key={i}>
                  {active && (
                    <circle cx={z.x} cy={z.y} r="28" fill={s.fill} opacity="0.22" filter="url(#wGlow)" />
                  )}
                  <circle cx={z.x} cy={z.y} r="21" fill={s.ring} />
                  <circle cx={z.x} cy={z.y} r="17" fill={s.fill} />
                  <text
                    x={z.x} y={z.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="16" fontWeight="900" fill={s.text}
                    fontFamily="'Helvetica Neue', Arial, sans-serif"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* 나침반 */}
            <g transform="translate(375, 28)">
              <circle cx="0" cy="0" r="12" fill="white" opacity="0.72" />
              <polygon points="0,-9 -2.5,0 2.5,0" fill="#374151" />
              <polygon points="0,9 -2.5,0 2.5,0" fill="#9ca3af" />
              <polygon points="-9,0 0,-2.5 0,2.5" fill="#9ca3af" />
              <polygon points="9,0 0,-2.5 0,2.5" fill="#374151" />
              <text x="0" y="-5" textAnchor="middle" dominantBaseline="central"
                fontSize="5.5" fontWeight="800" fill="#111827">N</text>
            </g>

            {/* 中国 레이블 */}
            <text x="14" y="234" fontSize="9" fill="#4b5563" opacity="0.55"
              fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="600">中国</text>
          </svg>
        </div>
        <div className="mt-2 text-center">
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-sm px-4 py-1.5 rounded-full transition-colors"
          >
            방 코드: {roomCode} 🔗
          </a>
        </div>
      </div>
    );
  };

  // ===== 로비 =====
  if (hostPhase === 'lobby') {
    const allJoined = playerList.length === playerCount;
    const overCapacity = playerList.length > playerCount;
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center p-6 overflow-auto">
        <div className="w-full max-w-sm flex justify-end mb-2"><LangToggle /></div>
        <h2 className="text-2xl font-black text-stone-800 mb-4">{wt(lang, 'title')}</h2>

        <div className="bg-white rounded-2xl p-6 shadow-md text-center max-w-sm w-full mb-4">
          <p className="text-stone-500 text-sm mb-3">{wt(lang, 'scanToJoin')}</p>
          <QRCodeSVG value={joinUrl} size={200} className="mx-auto mb-3" />
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-sm text-stone-500">방 코드:</span>
            <span className="text-3xl font-black text-stone-800 tracking-widest">{roomCode}</span>
          </div>
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-block text-center bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-2 px-4 rounded-xl transition-colors"
          >
            🔗 {joinUrl.replace(/^https?:\/\//, '')}
          </a>
        </div>

        {/* 참가자 현황 */}
        <div className="bg-white rounded-xl p-4 shadow-sm max-w-sm w-full mb-4">
          <h3 className="font-bold text-stone-700 mb-2">
            {wt(lang, 'participants')} <span className={`${allJoined ? 'text-green-600' : 'text-amber-600'}`}>{playerList.length}/{playerCount}</span>
          </h3>

          {/* 수동 입력 */}
          {!allJoined && (
            <div className="flex gap-2 mb-3">
              <input
                type="text" value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                placeholder={wt(lang, 'manualInput')}
                className="flex-1 border-2 border-stone-300 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-stone-500"
                maxLength={10}
              />
              <button onClick={() => { sfxClick(); handleManualAdd(); }} disabled={!manualName.trim()}
                className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-40">{wt(lang, 'addPlayer')}</button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {playerList.map((p, i) => (
              <span key={p.id} className="bg-stone-100 px-3 py-1 rounded-full text-sm font-bold animate-pop-in"
                style={{ animationDelay: `${i * 0.1}s` }}>
                {i + 1}. {p.name}
              </span>
            ))}
            {!allJoined && Array.from({ length: playerCount - playerList.length }).map((_, i) => (
              <span key={`empty-${i}`} className="bg-stone-50 border-2 border-dashed border-stone-300 px-3 py-1 rounded-full text-sm text-stone-300">
                {wt(lang, 'waiting')}
              </span>
            ))}
          </div>
        </div>

        {overCapacity && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 max-w-sm w-full text-center mb-4">
            <p className="text-red-600 font-bold text-sm">⚠️ {wt(lang, 'overCapacity')}</p>
          </div>
        )}

        <button onClick={handleStart} disabled={!allJoined || overCapacity}
          className={`w-full max-w-sm text-xl font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all
            ${allJoined && !overCapacity ? 'bg-green-600 text-white hover:bg-green-500 animate-pulse' : 'bg-stone-300 text-stone-500 cursor-not-allowed'}`}>
          {allJoined && !overCapacity ? `🎮 ${wt(lang, 'startGame')}` : `${playerList.length}/${playerCount} ${wt(lang, 'needPlayers')}`}
        </button>
      </div>
    );
  }

  // ===== 역할 확인 30초 =====
  if (hostPhase === 'role-reveal') {
    return (
      <div className="h-dvh bg-stone-900 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold text-white mb-2">{wt(lang, 'roleReveal')}</h2>
        <p className="text-stone-400 mb-1">{wt(lang, 'checkRoleOnPhone')}</p>
        <p className="text-stone-500 text-sm mb-4">{wt(lang, 'manualScanGuide')}</p>

        <div className="text-5xl font-mono font-black text-amber-400 mb-4">
          {countdown}{wt(lang, 'seconds')}
        </div>

        {/* QR (수동 참가자용) */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <QRCodeSVG value={joinUrl} size={120} bgColor="transparent" fgColor="white" />
        </div>

        <button
          onClick={() => { sfxClick(); handleProceedToMap(); }}
          disabled={countdown > 0}
          className={`px-8 py-3 rounded-xl font-bold text-lg transition-all
            ${countdown > 0 ? 'bg-stone-700 text-stone-500 cursor-not-allowed' : 'bg-amber-400 text-stone-800 hover:bg-amber-300 active:scale-95'}`}
        >
          {wt(lang, 'proceed')}
        </button>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 인도자가 팀 구성 중 =====
  if (hostPhase === 'waiting-team' && game && currentMission) {
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <p className="text-stone-500 text-sm mb-1">{wt(lang, 'round')} {game.currentRound + 1} · {wt(lang, 'required')}: {currentMission.requiredSize}명
            {currentMission.needsTwoFails ? ` (${wt(lang, 'needsTwoFails')})` : ''}</p>
          <h2 className="text-2xl font-black text-stone-800 mb-2">{wt(lang, 'leader')}: {leader?.name}</h2>
          <p className="text-stone-500">{wt(lang, 'selectTeamMembers')}</p>
          <div className="mt-4 animate-pulse text-4xl">📱</div>
        </div>

        <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow mt-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏠</span>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{txt.memberListTitle}</span>
            <span className="ml-auto text-xs text-stone-400 font-semibold">{txt.memberCount(game.players.length)}</span>
            <span className="text-xs font-bold text-red-500">{txt.agentCount(game.players.filter(p => p.team === 'agent').length)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {game.players.map((p, i) => (
              <span key={p.id} className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.id === currentMission.leaderId ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-stone-100 text-stone-600'}`}>
                {i + 1}. {p.name}{p.id === currentMission.leaderId ? ' 👑' : ''}
              </span>
            ))}
          </div>
        </div>

        {game.consecutiveRejects > 0 && (
          <p className="text-red-500 text-sm font-bold mt-4">{wt(lang, 'consecutiveReject')}: {game.consecutiveRejects}/5</p>
        )}
        <ReconnectQR />
      </div>
    );
  }

  // ===== 인도자가 임명 완료 =====
  if (hostPhase === 'team-announced' && currentMission) {
    const teamNames = currentMission.teamIds.map(gid => game?.players.find(p => p.id === gid)?.name || gid);
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="text-4xl mb-3">🔔</div>
          <h2 className="text-xl font-black text-stone-800 mb-2">{wt(lang, 'teamAnnounced')}</h2>
          <p className="text-stone-600 font-bold">{teamNames.join(', ')}</p>
        </div>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 투표 진행 중 =====
  if (hostPhase === 'waiting-vote' && game && currentMission) {
    const votes = (roomData?.missions as Record<string, unknown>[])?.[game.currentRound] as Record<string, unknown>;
    const votedCount = votes?.votes ? Object.keys(votes.votes as object).length : 0;

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <h2 className="text-xl font-black text-stone-800 mb-2">{wt(lang, 'voteTeamGuide')}</h2>
          <div className="text-4xl font-black text-stone-800 mt-4">{votedCount} / {game.players.length}</div>
          <p className="text-stone-400 text-sm mt-2">{wt(lang, 'votingProgress')}</p>
        </div>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 투표 결과 =====
  if (hostPhase === 'vote-result' && game && currentMission) {
    const missionData = (roomData?.missions as Record<string, unknown>[])?.[game.currentRound] as Record<string, unknown>;
    const votes = (missionData?.votes || {}) as Record<string, boolean>;
    const approveCount = Object.values(votes).filter(v => v).length;
    const rejectCount = game.players.length - approveCount;
    const approved = approveCount > game.players.length / 2;



    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="rounded-3xl p-6 max-w-lg w-full bg-white shadow-xl">
          <div className={`rounded-3xl px-5 py-4 mb-5 text-white text-center ${approved ? 'bg-blue-600' : 'bg-red-600'}`}>
            <div className="text-5xl mb-2">{approved ? '✅' : '❌'}</div>
            <h2 className="text-2xl font-black mb-1">{wt(lang, 'voteFinished')}</h2>
            <p className="text-sm opacity-90">{approved ? wt(lang, 'approved') : wt(lang, 'rejected')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 text-center text-stone-800">
            <div className="rounded-3xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-3xl font-black text-blue-700">{approveCount}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-500">{wt(lang, 'voteApproveCount')}</p>
            </div>
            <div className="rounded-3xl bg-red-50 border border-red-100 p-4">
              <p className="text-3xl font-black text-red-700">{rejectCount}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-red-500">{wt(lang, 'voteRejectCount')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {game.players.map((p, i) => {
              const vote = votes[p.id];
              const isApprove = vote === true;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-3xl border px-4 py-3 shadow-sm transition-all ${isApprove ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="font-semibold text-stone-800">{p.name}</span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${isApprove ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                    {isApprove ? 'O' : 'X'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => { sfxClick(); handleAfterVoteResult(); }}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold">{wt(lang, 'proceed')}</button>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 봉사 시작 확인 =====
  if (hostPhase === 'confirm-mission' && game) {
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <h2 className="text-xl font-black text-stone-800 mb-4">
            {wt(lang, 'round')} {game.currentRound + 1} — {wt(lang, 'confirmMission')}
          </h2>
          <button onClick={() => { sfxClick(); handleStartMission(); }}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-600">
            ✅ {wt(lang, 'confirm')}
          </button>
        </div>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 봉사 진행 중 =====
  if (hostPhase === 'waiting-mission' && game && currentMission) {
    const missionData = (roomData?.missions as Record<string, unknown>[])?.[game.currentRound] as Record<string, unknown>;
    const submittedCount = missionData?.submissions ? Object.keys(missionData.submissions as object).length : 0;

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <h2 className="text-xl font-black text-stone-800 mb-2">{wt(lang, 'missionInProgress')}</h2>
          <div className="text-4xl font-black text-stone-800 mt-4">{submittedCount} / {currentMission.teamIds.length}</div>
        </div>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 봉사 결과 확인 버튼 =====
  if (hostPhase === 'confirm-mission-result') {
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <h2 className="text-xl font-black text-stone-800 mb-4 whitespace-pre-line">{wt(lang, 'missionComplete')}</h2>
          <button onClick={() => { sfxCardFlip(); handleRevealMissionResult(); }}
            className="bg-stone-800 text-white px-8 py-3 rounded-xl font-bold text-lg">{wt(lang, 'confirm')}</button>
        </div>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 봉사 결과 =====
  if (hostPhase === 'mission-result' && game && currentMission) {
    const submissions = currentMission.submissions ? Object.values(currentMission.submissions) : [];
    const successCount = submissions.filter(v => v).length;
    const failCount = submissions.filter(v => !v).length;
    const isSuccess = currentMission.result === 'success';

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className={`rounded-2xl p-6 max-w-sm w-full text-center shadow-lg ${isSuccess ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-5xl mb-3">{isSuccess ? '✅' : '❌'}</div>
          <h2 className="text-2xl font-black text-white mb-4">{isSuccess ? wt(lang, 'success') : wt(lang, 'fail')}</h2>
          {/* 카드 시각화 */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {missionCards.map((s, i) => (
              <div key={i}
                className={`w-14 h-20 rounded-lg flex items-center justify-center text-2xl font-black shadow-md
                  ${s ? 'bg-white text-blue-500 border-2 border-blue-300' : 'bg-white text-red-500 border-2 border-red-300'}
                  animate-[flipIn_0.4s_ease-out_both]`}
                style={{ animationDelay: `${i * 0.15}s` }}>
                {s ? '✓' : '✗'}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 text-white/90 text-sm">
            <span>✓ {wt(lang, 'success')}: {successCount}</span>
            <span>✗ {wt(lang, 'fail')}: {failCount}</span>
          </div>
          {currentMission.needsTwoFails && <p className="text-white/60 text-xs mt-1">({wt(lang, 'needsTwoFails')})</p>}
        </div>
        <button onClick={() => { sfxTurnEnd(); handleNextRound(); }}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold">{wt(lang, 'nextRound')}</button>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 당간부 지목 =====
  if (hostPhase === 'assassinate' && game) {
    const commander = game.players.find(p => p.specialRole === 'commander');
    const witnesses = game.players.filter(p => p.team === 'witness');
    return (
      <div className="h-dvh bg-red-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-black text-white mb-1">{wt(lang, 'assassinateTitle')}</h2>
          <p className="text-red-200 text-sm mb-4">{commander?.name}: {wt(lang, 'assassinateGuide')}</p>
          <div className="grid grid-cols-2 gap-2">
            {witnesses.map(p => (
              <button key={p.id} onClick={() => handleAssassinate(p.id)}
                className="bg-white/20 text-white py-3 rounded-xl font-bold hover:bg-white/30">{p.name}</button>
            ))}
          </div>
        </div>
        <ReconnectQR />
      </div>
    );
  }

  // ===== 게임 종료 =====
  if (hostPhase === 'finished' && game) {
    const isWitness = game.winner === 'witness';
    const confettiColors = isWitness ? ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff'] : ['#ef4444', '#f87171', '#fca5a5', '#ffffff'];
    return (
      <div className={`h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden ${isWitness ? 'bg-blue-600' : 'bg-red-600'}`}>
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none">
          {confettiPositions.map((pos, i) => (
            <div key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: pos.left,
                backgroundColor: confettiColors[i % confettiColors.length],
                animation: `confettiFall ${pos.duration}s linear ${pos.delay}s infinite`,
                opacity: 0.8,
              }} />
          ))}
        </div>
        <div className="text-6xl mb-4 animate-pop-in">{isWitness ? '📖' : '🔴'}</div>
        <h1 className="text-3xl font-black text-white mb-2">{isWitness ? wt(lang, 'witnessWin') : wt(lang, 'agentWin')}</h1>
        <p className="text-white/80 mb-4">{game.winReason ? wt(lang, game.winReason as any) : ''}</p>
        <MissionMap />

        <button onClick={() => { sfxToggle(); setRevealRoles(!revealRoles); }} className="text-white/70 text-sm font-bold mb-4 hover:text-white">{wt(lang, 'revealAll')}</button>
        {revealRoles && (
          <div className="bg-white/10 rounded-xl p-4 max-w-sm w-full mb-6">
            {game.players.map(p => (
              <div key={p.id} className="flex justify-between py-1 border-b border-white/10 last:border-0">
                <span className="text-white font-bold">{p.name}</span>
                <span className={`font-bold ${p.team === 'witness' ? 'text-blue-300' : 'text-red-300'}`}>
                  {p.team === 'witness' ? wt(lang, 'witness') : wt(lang, 'agent')}{p.specialRole && ` · ${wt(lang, p.specialRole as any)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { sfxClick(); if (roomCode) deleteRoom(roomCode).catch(() => {}); onGoHome(); }} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30">{wt(lang, 'goHome')}</button>
      </div>
    );
  }

  return null;
}
