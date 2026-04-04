import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { wt } from '../lib/i18n';
import { createRoom, setGameState, subscribeRoom } from '../lib/firebase-room';
import { startGame as startGameEngine, proceedAfterVote, nextRound, assassinate, getPlayerInfo } from '../lib/game-engine';
import { createGame, addPlayer } from '../lib/game-engine';
import type { GameState, SpecialRole } from '../lib/types';

interface Props {
  onGoHome: () => void;
  enabledRoles: SpecialRole[];
  playerNames?: string[];
}

export default function OnlineGamePage({ onGoHome, enabledRoles }: Props) {
  const lang = useGameStore((s) => s.lang);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<Record<string, unknown> | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [revealRoles, setRevealRoles] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // 1. 방 생성
  useEffect(() => {
    createRoom(enabledRoles).then((code) => {
      setRoomCode(code);
    });
  }, []);

  // 2. 방 상태 구독
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeRoom(roomCode, (data) => {
      setRoomData(data);
    });
    return unsub;
  }, [roomCode]);

  // 카운트다운
  useEffect(() => {
    if (!game || game.phase !== 'role-reveal' || !game.roleRevealEndAt) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((game.roleRevealEndAt! - Date.now()) / 1000));
      setCountdown(left);
    }, 200);
    return () => clearInterval(timer);
  }, [game?.phase, game?.roleRevealEndAt]);

  const players = roomData?.players as Record<string, { name: string }> | undefined;
  const playerList = players ? Object.entries(players).map(([id, p]) => ({ id, name: p.name })) : [];
  const joinUrl = roomCode ? `${window.location.origin}${window.location.pathname}?game=witnesses-online&room=${roomCode}&lang=${lang}` : '';

  // 게임 시작
  const handleStart = async () => {
    if (!roomCode || playerList.length < 5) return;

    let gameState = createGame(enabledRoles);
    for (const p of playerList) {
      gameState = addPlayer(gameState, p.name);
    }
    gameState = startGameEngine(gameState);

    // 플레이어 정보 매핑 (폰에서 볼 수 있도록)
    const playerInfos: Record<string, { team: string; specialRole: string | null; info: string[] }> = {};
    for (const p of gameState.players) {
      playerInfos[p.id] = {
        team: p.team,
        specialRole: p.specialRole,
        info: getPlayerInfo(gameState, p.id),
      };
    }

    // Firebase에 전체 상태 저장
    await setGameState(roomCode, {
      ...serializeGame(gameState),
      playerInfos,
      playerMapping: Object.fromEntries(playerList.map((p, i) => [p.id, `p${i}`])),
    });

    setGame(gameState);
  };

  // 게임 상태 변경 시 Firebase 동기화
  const syncGame = async (newGame: GameState) => {
    if (!roomCode) return;
    setGame(newGame);
    await setGameState(roomCode, {
      ...serializeGame(newGame),
      playerInfos: roomData?.playerInfos,
      playerMapping: roomData?.playerMapping,
    });
  };

  // GameState → Firebase 직렬화
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
      players: Object.fromEntries(g.players.map(p => [p.id, { name: p.name, team: p.team, specialRole: p.specialRole }])),
      missions: g.missions.map(m => ({
        round: m.round,
        requiredSize: m.requiredSize,
        needsTwoFails: m.needsTwoFails,
        leaderId: m.leaderId,
        teamIds: m.teamIds || [],
        votes: m.votes || {},
        approved: m.approved,
        submissions: m.submissions || {},
        result: m.result,
      })),
    };
  }

  // Firebase에서 투표/봉사 결과 감시
  useEffect(() => {
    if (!game || !roomCode || !roomData) return;
    const missions = roomData.missions as Record<string, unknown>[] | undefined;
    if (!missions) return;

    const currentMission = missions[game.currentRound] as Record<string, unknown> | undefined;
    if (!currentMission) return;

    // 투표 완료 확인
    if (game.phase === 'vote') {
      const votes = currentMission.votes as Record<string, boolean> | undefined;
      if (votes && Object.keys(votes).length === game.players.length) {
        const approveCount = Object.values(votes).filter(v => v).length;
        const approved = approveCount > game.players.length / 2;
        const updatedMissions = [...game.missions];
        updatedMissions[game.currentRound] = {
          ...updatedMissions[game.currentRound],
          votes,
          approved,
        };
        const newConsecutiveRejects = approved ? 0 : game.consecutiveRejects + 1;

        if (!approved && newConsecutiveRejects >= 5) {
          syncGame({ ...game, missions: updatedMissions, phase: 'finished', winner: 'agent', winReason: 'winReason5Rejects', consecutiveRejects: newConsecutiveRejects });
        } else {
          syncGame({ ...game, missions: updatedMissions, phase: 'vote-result', consecutiveRejects: newConsecutiveRejects });
        }
      }
    }

    // 봉사 완료 확인
    if (game.phase === 'mission') {
      const submissions = currentMission.submissions as Record<string, boolean> | undefined;
      const teamIds = (currentMission.teamIds as string[]) || [];
      if (submissions && Object.keys(submissions).length === teamIds.length) {
        const failCount = Object.values(submissions).filter(v => !v).length;
        const mission = game.missions[game.currentRound];
        const isFail = mission.needsTwoFails ? failCount >= 2 : failCount >= 1;
        const result = isFail ? 'fail' as const : 'success' as const;

        const updatedMissions = [...game.missions];
        updatedMissions[game.currentRound] = { ...mission, submissions, result };

        const newWitnessWins = game.witnessWins + (result === 'success' ? 1 : 0);
        const newAgentWins = game.agentWins + (result === 'fail' ? 1 : 0);

        if (newAgentWins >= 3) {
          syncGame({ ...game, missions: updatedMissions, witnessWins: newWitnessWins, agentWins: newAgentWins, phase: 'finished', winner: 'agent', winReason: 'winReason3Fail' });
        } else if (newWitnessWins >= 3) {
          const hasCommander = game.players.some(p => p.specialRole === 'commander');
          if (hasCommander) {
            syncGame({ ...game, missions: updatedMissions, witnessWins: newWitnessWins, agentWins: newAgentWins, phase: 'assassinate' });
          } else {
            syncGame({ ...game, missions: updatedMissions, witnessWins: newWitnessWins, agentWins: newAgentWins, phase: 'finished', winner: 'witness', winReason: 'winReason3Success' });
          }
        } else {
          syncGame({ ...game, missions: updatedMissions, witnessWins: newWitnessWins, agentWins: newAgentWins, phase: 'mission-result' });
        }
      }
    }
  }, [roomData]);

  if (!roomCode) return <div className="h-dvh flex items-center justify-center"><p>방 생성 중...</p></div>;

  // ===== 로비: QR + 참가자 목록 =====
  if (!game || (roomData?.phase === 'lobby')) {
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center p-6 overflow-auto">
        <h2 className="text-2xl font-black text-stone-800 mb-2">📖 {wt(lang, 'title')}</h2>

        <div className="bg-white rounded-2xl p-6 shadow-md text-center max-w-sm w-full mb-4">
          <p className="text-stone-500 text-sm mb-3">QR을 스캔해서 참가하세요</p>
          <QRCodeSVG value={joinUrl} size={180} className="mx-auto mb-3" />
          <p className="text-xs text-stone-400">방 코드: <strong className="font-mono text-lg text-stone-800">{roomCode}</strong></p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm max-w-sm w-full mb-4">
          <h3 className="font-bold text-stone-700 mb-2">참가자 ({playerList.length}/12)</h3>
          <div className="flex flex-wrap gap-2">
            {playerList.map((p) => (
              <span key={p.id} className="bg-stone-100 px-3 py-1 rounded-full text-sm font-bold">{p.name}</span>
            ))}
            {playerList.length === 0 && <p className="text-stone-400 text-sm">대기 중...</p>}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={playerList.length < 5}
          className="w-full max-w-sm bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-40"
        >
          {playerList.length >= 5 ? wt(lang, 'startGame') : wt(lang, 'needPlayers')}
        </button>
      </div>
    );
  }

  // ===== 역할 확인 =====
  if (game.phase === 'role-reveal') {
    return (
      <div className="h-dvh bg-stone-900 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold text-white mb-2">{wt(lang, 'roleReveal')}</h2>
        <p className="text-stone-400 mb-2">폰에서 역할을 확인하세요</p>
        <div className="text-5xl font-mono font-black text-amber-400 mb-6">
          {countdown}{wt(lang, 'seconds')}
        </div>
        <button
          onClick={() => syncGame({ ...game, phase: 'team-build' })}
          disabled={countdown > 0}
          className="bg-white text-stone-800 px-8 py-3 rounded-xl font-bold disabled:opacity-30"
        >
          {wt(lang, 'proceed')}
        </button>
      </div>
    );
  }

  const currentMission = game.missions[game.currentRound];

  // ===== 팀 구성 (호스트 화면) =====
  if (game.phase === 'team-build' && currentMission) {
    const leader = game.players.find(p => p.id === currentMission.leaderId);

    return (
      <div className="h-dvh bg-stone-100 flex flex-col overflow-hidden">
        {/* 스코어보드 */}
        <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b">
          <div className="flex gap-1">
            {game.missions.map((m, i) => (
              <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${m.result === 'success' ? 'bg-blue-500 text-white' :
                  m.result === 'fail' ? 'bg-red-500 text-white' :
                  i === game.currentRound ? 'bg-amber-400 text-stone-800' : 'bg-stone-200 text-stone-500'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          {game.consecutiveRejects > 0 && (
            <span className="text-red-500 text-sm font-bold">{wt(lang, 'consecutiveReject')}: {game.consecutiveRejects}/5</span>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-stone-500 mb-1">{wt(lang, 'round')} {game.currentRound + 1}</p>
          <p className="text-stone-800 font-bold text-lg mb-1">{wt(lang, 'leader')}: {leader?.name}</p>
          <p className="text-stone-400 text-sm mb-4">{leader?.name}의 폰에서 팀원을 선택합니다</p>
          <p className="text-stone-500">{wt(lang, 'required')}: {currentMission.requiredSize}명 {currentMission.needsTwoFails ? '(실패 2개 필요)' : ''}</p>
        </div>
      </div>
    );
  }

  // ===== 투표 진행 중 (호스트: 대기) =====
  if (game.phase === 'vote' && currentMission) {
    const votedCount = currentMission.votes ? Object.keys(currentMission.votes).length : 0;
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-black text-stone-800 mb-2">{wt(lang, 'voting')}</h2>
        <p className="text-stone-500 mb-4">각 플레이어가 폰에서 투표 중...</p>
        <div className="text-4xl font-black text-stone-800">{votedCount} / {game.players.length}</div>
      </div>
    );
  }

  // ===== 투표 결과 =====
  if (game.phase === 'vote-result' && currentMission) {
    const approveCount = currentMission.votes ? Object.values(currentMission.votes).filter(v => v).length : 0;
    const rejectCount = game.players.length - approveCount;
    const isApproved = currentMission.approved;

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <div className={`rounded-2xl p-8 max-w-xs w-full text-center shadow-lg ${isApproved ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-5xl mb-4">{isApproved ? '✅' : '❌'}</div>
          <h2 className="text-2xl font-black text-white mb-4">{isApproved ? wt(lang, 'approved') : wt(lang, 'rejected')}</h2>
          <div className="flex justify-center gap-6 text-white">
            <div><p className="text-2xl font-black">{approveCount}</p><p className="text-sm opacity-80">{wt(lang, 'voteApproveCount')}</p></div>
            <div><p className="text-2xl font-black">{rejectCount}</p><p className="text-sm opacity-80">{wt(lang, 'voteRejectCount')}</p></div>
          </div>
          <div className="mt-4 border-t border-white/20 pt-3 space-y-1">
            {game.players.map(p => (
              <div key={p.id} className="flex justify-between text-sm text-white/80">
                <span>{p.name}</span>
                <span>{currentMission.votes[p.id] ? '👍' : '👎'}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            const newGame = proceedAfterVote(game);
            syncGame(newGame);
          }}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold"
        >{wt(lang, 'proceed')}</button>
      </div>
    );
  }

  // ===== 봉사 진행 중 (호스트: 대기) =====
  if (game.phase === 'mission' && currentMission) {
    const submittedCount = currentMission.submissions ? Object.keys(currentMission.submissions).length : 0;
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-black text-stone-800 mb-2">{wt(lang, 'mission')}</h2>
        <p className="text-stone-500 mb-4">팀원이 폰에서 봉사 결과를 제출 중...</p>
        <div className="text-4xl font-black text-stone-800">{submittedCount} / {currentMission.teamIds.length}</div>
      </div>
    );
  }

  // ===== 봉사 결과 =====
  if (game.phase === 'mission-result' && currentMission) {
    const failCount = currentMission.submissions ? Object.values(currentMission.submissions).filter(v => !v).length : 0;
    const isSuccess = currentMission.result === 'success';

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <div className={`rounded-2xl p-8 max-w-xs w-full text-center shadow-lg ${isSuccess ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-6xl mb-4">{isSuccess ? '✅' : '❌'}</div>
          <h2 className="text-3xl font-black text-white mb-2">{isSuccess ? wt(lang, 'success') : wt(lang, 'fail')}</h2>
          <p className="text-white/80">{wt(lang, 'failCount')}: {failCount}</p>
        </div>
        <button
          onClick={() => { const newGame = nextRound(game); syncGame(newGame); }}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold"
        >{wt(lang, 'nextRound')}</button>
      </div>
    );
  }

  // ===== 당간부 지목 =====
  if (game.phase === 'assassinate') {
    const commander = game.players.find(p => p.specialRole === 'commander');
    const witnesses = game.players.filter(p => p.team === 'witness');

    return (
      <div className="h-dvh bg-red-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-black text-white mb-1">{wt(lang, 'assassinateTitle')}</h2>
          <p className="text-red-200 text-sm mb-4">{commander?.name}: {wt(lang, 'assassinateGuide')}</p>
          <div className="grid grid-cols-2 gap-2">
            {witnesses.map((p) => (
              <button key={p.id} onClick={() => syncGame(assassinate(game, p.id))}
                className="bg-white/20 text-white py-3 rounded-xl font-bold hover:bg-white/30">{p.name}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== 게임 종료 =====
  if (game.phase === 'finished') {
    const isWitness = game.winner === 'witness';
    return (
      <div className={`h-dvh flex flex-col items-center justify-center p-6 ${isWitness ? 'bg-blue-600' : 'bg-red-600'}`}>
        <div className="text-6xl mb-4">{isWitness ? '📖' : '🔴'}</div>
        <h1 className="text-3xl font-black text-white mb-2">{isWitness ? wt(lang, 'witnessWin') : wt(lang, 'agentWin')}</h1>
        <p className="text-white/80 mb-6">{game.winReason ? wt(lang, game.winReason as any) : ''}</p>

        <div className="flex gap-2 mb-6">
          {game.missions.map((m, i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
              ${m.result === 'success' ? 'bg-blue-400 text-white' : m.result === 'fail' ? 'bg-red-400 text-white' : 'bg-white/20 text-white/50'}`}>{i + 1}</div>
          ))}
        </div>

        <button onClick={() => setRevealRoles(!revealRoles)} className="text-white/70 text-sm font-bold mb-4 hover:text-white">{wt(lang, 'revealAll')}</button>
        {revealRoles && (
          <div className="bg-white/10 rounded-xl p-4 max-w-sm w-full mb-6">
            {game.players.map((p) => (
              <div key={p.id} className="flex justify-between py-1 border-b border-white/10 last:border-0">
                <span className="text-white font-bold">{p.name}</span>
                <span className={`font-bold ${p.team === 'witness' ? 'text-blue-300' : 'text-red-300'}`}>
                  {p.team === 'witness' ? wt(lang, 'witness') : wt(lang, 'agent')}{p.specialRole && ` · ${wt(lang, p.specialRole as any)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onGoHome} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30">{wt(lang, 'goHome')}</button>
        </div>
      </div>
    );
  }

  return null;
}
