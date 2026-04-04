import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../codenames/store/game-store';
import { wt } from '../lib/i18n';
import { createRoom, setGameState, subscribeRoom, submitAction } from '../lib/firebase-room';
import { startGame as startGameEngine, getPlayerInfo, proceedAfterVote, nextRound, assassinate } from '../lib/game-engine';
import { createGame, addPlayer } from '../lib/game-engine';
import type { GameState, SpecialRole } from '../lib/types';

interface Props {
  onGoHome: () => void;
  enabledRoles: SpecialRole[];
}

// 알림음
function playSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.connect(gain);
      osc2.frequency.value = 1000;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    }, 180);
  } catch {}
}

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

export default function OnlineGamePage({ onGoHome, enabledRoles }: Props) {
  const lang = useGameStore((s) => s.lang);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<Record<string, unknown> | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [hostPhase, setHostPhase] = useState<HostPhase>('lobby');
  const [countdown, setCountdown] = useState(30);
  const [manualName, setManualName] = useState('');
  const [revealRoles, setRevealRoles] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);

  // 방 생성
  useEffect(() => {
    createRoom(enabledRoles).then(setRoomCode);
  }, []);

  // 방 구독
  useEffect(() => {
    if (!roomCode) return;
    return subscribeRoom(roomCode, (data) => {
      setRoomData(data);

      // Firebase에서 phase 변경 감지 → 호스트 phase 전환
      if (data) {
        const serverPhase = data.phase as string;

        // 인도자가 팀 확정 → 알림음 + 안내
        if (prevPhaseRef.current === 'team-build' && serverPhase === 'vote') {
          playSound();
          setHostPhase('team-announced');
          setTimeout(() => setHostPhase('waiting-vote'), 3000);
        }

        // 투표 완료
        if (serverPhase === 'vote') {
          const missions = data.missions as Record<string, unknown>[] | undefined;
          const currentRound = data.currentRound as number;
          if (missions?.[currentRound]) {
            const votes = (missions[currentRound] as Record<string, unknown>).votes as Record<string, boolean> | undefined;
            const playerCount = game?.players.length || 0;
            if (votes && Object.keys(votes).length === playerCount && hostPhase === 'waiting-vote') {
              playSound();
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
            if (submissions && Object.keys(submissions).length === teamIds.length && hostPhase === 'waiting-mission') {
              playSound();
              setHostPhase('confirm-mission-result');
            }
          }
        }

        prevPhaseRef.current = serverPhase;
      }
    });
  }, [roomCode, game?.players.length, hostPhase]);

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

  // Firebase 동기화
  const syncGame = async (newGame: GameState, extraPhase?: string) => {
    if (!roomCode) return;
    setGame(newGame);
    const playerInfos: Record<string, { team: string; specialRole: string | null; info: string[] }> = {};
    for (const p of newGame.players) {
      playerInfos[p.id] = { team: p.team, specialRole: p.specialRole, info: getPlayerInfo(newGame, p.id) };
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
    const pid = `manual_${Date.now().toString(36)}`;
    await submitAction(roomCode, `players/${pid}`, { name: manualName.trim(), manual: true });
    setManualName('');
  };

  // 게임 시작
  const handleStart = async () => {
    if (!roomCode || playerList.length < 5) return;

    let gameState = createGame(enabledRoles);
    for (const p of playerList) {
      gameState = addPlayer(gameState, p.name);
    }
    gameState = startGameEngine(gameState);

    // 플레이어 매핑: Firebase pid → game pid
    const mapping: Record<string, string> = {};
    playerList.forEach((p, i) => { mapping[p.id] = `p${i}`; });

    const playerInfos: Record<string, { team: string; specialRole: string | null; info: string[] }> = {};
    for (const p of gameState.players) {
      playerInfos[p.id] = { team: p.team, specialRole: p.specialRole, info: getPlayerInfo(gameState, p.id) };
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
    const newGame = { ...game, phase: 'team-build' as const };
    await syncGame(newGame);
    setHostPhase('waiting-team');
  };

  // 투표 결과 처리 후
  const handleAfterVoteResult = async () => {
    if (!game || !roomCode) return;
    // 현재 미션의 투표 결과 반영
    const missions = (roomData?.missions as Record<string, unknown>[]) || [];
    const m = missions[game.currentRound] as Record<string, unknown>;
    const votes = (m?.votes || {}) as Record<string, boolean>;
    const approveCount = Object.values(votes).filter(v => v).length;
    const approved = approveCount > game.players.length / 2;

    const updatedMissions = [...game.missions];
    updatedMissions[game.currentRound] = { ...updatedMissions[game.currentRound], votes, approved };

    let newGame: GameState = { ...game, missions: updatedMissions };

    if (approved) {
      newGame = { ...newGame, phase: 'mission' as const, consecutiveRejects: 0 };
      await syncGame(newGame);
      setHostPhase('confirm-mission');
    } else {
      const rejects = game.consecutiveRejects + 1;
      if (rejects >= 5) {
        newGame = { ...newGame, phase: 'finished' as const, winner: 'agent', winReason: 'winReason5Rejects', consecutiveRejects: rejects };
        await syncGame(newGame);
        setHostPhase('finished');
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
    await submitAction(roomCode, 'phase', 'mission');
    setHostPhase('waiting-mission');
  };

  // 봉사 결과 확인
  const handleRevealMissionResult = async () => {
    if (!game || !roomCode) return;
    const missions = (roomData?.missions as Record<string, unknown>[]) || [];
    const m = missions[game.currentRound] as Record<string, unknown>;
    const submissions = (m?.submissions || {}) as Record<string, boolean>;

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
      setHostPhase('finished');
    } else if (newWW >= 3) {
      const hasCmd = game.players.some(p => p.specialRole === 'commander');
      if (hasCmd) {
        newGame = { ...newGame, phase: 'assassinate' as const };
        await syncGame(newGame);
        setHostPhase('assassinate');
      } else {
        newGame = { ...newGame, phase: 'finished' as const, winner: 'witness', winReason: 'winReason3Success' };
        await syncGame(newGame);
        setHostPhase('finished');
      }
    } else {
      await syncGame(newGame, 'mission-result');
      setHostPhase('mission-result');
    }
  };

  // 다음 라운드
  const handleNextRound = async () => {
    if (!game) return;
    const newGame = nextRound(game);
    await syncGame(newGame);
    setHostPhase('waiting-team');
  };

  // 당간부 지목
  const handleAssassinate = async (targetId: string) => {
    if (!game) return;
    const newGame = assassinate(game, targetId);
    await syncGame(newGame);
    setHostPhase('finished');
  };

  if (!roomCode) return <div className="h-dvh flex items-center justify-center"><p>방 생성 중...</p></div>;

  const currentMission = game?.missions[game.currentRound];
  const leader = currentMission ? game?.players.find(p => p.id === currentMission.leaderId) : null;

  // ===== 구역 맵 컴포넌트 =====
  const MissionMap = () => (
    <div className="flex justify-center gap-3 mb-6">
      {(game?.missions || []).map((m, i) => (
        <div
          key={i}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md transition-all
            ${m.result === 'success' ? 'bg-blue-500 text-white' :
              m.result === 'fail' ? 'bg-red-500 text-white' :
              i === game?.currentRound ? 'bg-amber-400 text-stone-800 scale-110' :
              'bg-stone-200 text-stone-400'}`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );

  // ===== 로비 =====
  if (hostPhase === 'lobby') {
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center p-6 overflow-auto">
        <h2 className="text-2xl font-black text-stone-800 mb-4">📖 {wt(lang, 'title')}</h2>

        <div className="bg-white rounded-2xl p-6 shadow-md text-center max-w-sm w-full mb-4">
          <p className="text-stone-500 text-sm mb-3">QR을 스캔해서 참가하세요</p>
          <QRCodeSVG value={joinUrl} size={180} className="mx-auto mb-3" />
          <p className="text-xs text-stone-400">방 코드: <strong className="font-mono text-lg text-stone-800">{roomCode}</strong></p>
        </div>

        {/* 수동 입력 */}
        <div className="bg-white rounded-xl p-4 shadow-sm max-w-sm w-full mb-4">
          <h3 className="font-bold text-stone-700 mb-2">참가자 ({playerList.length}/12)</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text" value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
              placeholder="이름 직접 입력"
              className="flex-1 border-2 border-stone-300 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-stone-500"
              maxLength={10}
            />
            <button onClick={handleManualAdd} disabled={!manualName.trim() || playerList.length >= 12}
              className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-40">{wt(lang, 'addPlayer')}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {playerList.map((p) => (
              <span key={p.id} className="bg-stone-100 px-3 py-1 rounded-full text-sm font-bold">{p.name}</span>
            ))}
          </div>
        </div>

        <button onClick={handleStart} disabled={playerList.length < 5}
          className="w-full max-w-sm bg-stone-800 text-white text-xl font-bold py-4 rounded-2xl shadow-lg hover:bg-stone-700 active:scale-95 disabled:opacity-40">
          {playerList.length >= 5 ? wt(lang, 'startGame') : wt(lang, 'needPlayers')}
        </button>
      </div>
    );
  }

  // ===== 역할 확인 30초 =====
  if (hostPhase === 'role-reveal') {
    return (
      <div className="h-dvh bg-stone-900 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold text-white mb-2">{wt(lang, 'roleReveal')}</h2>
        <p className="text-stone-400 mb-1">폰에서 역할을 확인하세요</p>
        <p className="text-stone-500 text-sm mb-4">수동 입력된 참가자는 QR을 스캔하세요</p>

        <div className="text-5xl font-mono font-black text-amber-400 mb-4">
          {countdown}{wt(lang, 'seconds')}
        </div>

        {/* QR (수동 참가자용) */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <QRCodeSVG value={joinUrl} size={120} bgColor="transparent" fgColor="white" />
        </div>

        <button
          onClick={handleProceedToMap}
          disabled={countdown > 0}
          className={`px-8 py-3 rounded-xl font-bold text-lg transition-all
            ${countdown > 0 ? 'bg-stone-700 text-stone-500 cursor-not-allowed' : 'bg-amber-400 text-stone-800 hover:bg-amber-300 active:scale-95'}`}
        >
          {wt(lang, 'proceed')}
        </button>
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
            {currentMission.needsTwoFails ? ' (실패 2개 필요)' : ''}</p>
          <h2 className="text-2xl font-black text-stone-800 mb-2">{wt(lang, 'leader')}: {leader?.name}</h2>
          <p className="text-stone-500">봉사 팀원을 선택해주세요</p>
          <div className="mt-4 animate-pulse text-4xl">📱</div>
        </div>
        {game.consecutiveRejects > 0 && (
          <p className="text-red-500 text-sm font-bold mt-4">{wt(lang, 'consecutiveReject')}: {game.consecutiveRejects}/5</p>
        )}
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
          <h2 className="text-xl font-black text-stone-800 mb-2">인도자가 봉사임명을 완료했습니다</h2>
          <p className="text-stone-600 font-bold">{teamNames.join(', ')}</p>
        </div>
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
          <h2 className="text-xl font-black text-stone-800 mb-2">봉사팀 임명을 찬성 또는 이의를 제기해 주세요</h2>
          <div className="text-4xl font-black text-stone-800 mt-4">{votedCount} / {game.players.length}</div>
          <p className="text-stone-400 text-sm mt-2">투표 진행 중...</p>
        </div>
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
        <div className={`rounded-2xl p-8 max-w-sm w-full text-center shadow-lg ${approved ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-5xl mb-3">{approved ? '✅' : '❌'}</div>
          <h2 className="text-2xl font-black text-white mb-2">투표가 끝났습니다</h2>
          <h3 className="text-xl font-bold text-white mb-4">{approved ? wt(lang, 'approved') : wt(lang, 'rejected')}</h3>
          <div className="flex justify-center gap-6 text-white mb-4">
            <div><p className="text-2xl font-black">{approveCount}</p><p className="text-sm opacity-80">{wt(lang, 'voteApproveCount')}</p></div>
            <div><p className="text-2xl font-black">{rejectCount}</p><p className="text-sm opacity-80">{wt(lang, 'voteRejectCount')}</p></div>
          </div>
          <div className="border-t border-white/20 pt-3 space-y-1">
            {game.players.map(p => {
              // Firebase pid → game pid 역매핑으로 투표 찾기
              const vote = votes[p.id];
              return (
                <div key={p.id} className="flex justify-between text-sm text-white/80">
                  <span>{p.name}</span>
                  <span>{vote === true ? '👍' : vote === false ? '👎' : '...'}</span>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={handleAfterVoteResult}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold">{wt(lang, 'proceed')}</button>
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
            {game.currentRound + 1}번 구역 봉사를 시작하시겠습니까?
          </h2>
          <button onClick={handleStartMission}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-600">
            ✅ {wt(lang, 'confirm')}
          </button>
        </div>
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
          <h2 className="text-xl font-black text-stone-800 mb-2">봉사 진행 중...</h2>
          <div className="text-4xl font-black text-stone-800 mt-4">{submittedCount} / {currentMission.teamIds.length}</div>
        </div>
      </div>
    );
  }

  // ===== 봉사 결과 확인 버튼 =====
  if (hostPhase === 'confirm-mission-result') {
    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <h2 className="text-xl font-black text-stone-800 mb-4">봉사를 완료했습니다.<br/>결과를 확인하시겠습니까?</h2>
          <button onClick={handleRevealMissionResult}
            className="bg-stone-800 text-white px-8 py-3 rounded-xl font-bold text-lg">{wt(lang, 'confirm')}</button>
        </div>
      </div>
    );
  }

  // ===== 봉사 결과 =====
  if (hostPhase === 'mission-result' && game && currentMission) {
    const failCount = currentMission.submissions ? Object.values(currentMission.submissions).filter(v => !v).length : 0;
    const isSuccess = currentMission.result === 'success';

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <MissionMap />
        <div className={`rounded-2xl p-8 max-w-xs w-full text-center shadow-lg ${isSuccess ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-6xl mb-4">{isSuccess ? '✅' : '❌'}</div>
          <h2 className="text-3xl font-black text-white mb-2">{isSuccess ? wt(lang, 'success') : wt(lang, 'fail')}</h2>
          <p className="text-white/80">{wt(lang, 'failCount')}: {failCount}{currentMission.needsTwoFails ? ' (2개 필요)' : ''}</p>
        </div>
        <button onClick={handleNextRound}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold">{wt(lang, 'nextRound')}</button>
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
      </div>
    );
  }

  // ===== 게임 종료 =====
  if (hostPhase === 'finished' && game) {
    const isWitness = game.winner === 'witness';
    return (
      <div className={`h-dvh flex flex-col items-center justify-center p-6 ${isWitness ? 'bg-blue-600' : 'bg-red-600'}`}>
        <div className="text-6xl mb-4">{isWitness ? '📖' : '🔴'}</div>
        <h1 className="text-3xl font-black text-white mb-2">{isWitness ? wt(lang, 'witnessWin') : wt(lang, 'agentWin')}</h1>
        <p className="text-white/80 mb-4">{game.winReason ? wt(lang, game.winReason as any) : ''}</p>
        <MissionMap />

        <button onClick={() => setRevealRoles(!revealRoles)} className="text-white/70 text-sm font-bold mb-4 hover:text-white">{wt(lang, 'revealAll')}</button>
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

        <button onClick={onGoHome} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30">{wt(lang, 'goHome')}</button>
      </div>
    );
  }

  return null;
}
