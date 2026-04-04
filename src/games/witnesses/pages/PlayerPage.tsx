import { useEffect, useState } from 'react';
import { subscribeRoom, joinRoom, submitAction } from '../lib/firebase-room';
import type { Lang } from '../../codenames/lib/i18n';
import { wt } from '../lib/i18n';

type PlayerPhase = 'join' | 'lobby' | 'role-reveal' | 'waiting' | 'team-build' | 'vote' | 'mission' | 'vote-result' | 'mission-result' | 'finished';

const TEAM_NAMES: Record<Lang, Record<string, string>> = {
  ko: { witness: '증인', agent: '공안' },
  en: { witness: 'Witness', agent: 'Agent' },
  zh: { witness: '见证人', agent: '公安' },
};
const ROLE_NAMES: Record<Lang, Record<string, string>> = {
  ko: { overseer: '순회감독자', elder: '장로', commander: '당간부', cleric: '교직자', apostate: '배교자' },
  en: { overseer: 'Overseer', elder: 'Elder', commander: 'Commander', cleric: 'Cleric', apostate: 'Apostate' },
  zh: { overseer: '巡回监督', elder: '长老', commander: '指挥官', cleric: '教职者', apostate: '叛教者' },
};

export default function PlayerPage() {
  const [lang, setLang] = useState<Lang>('ko');
  const [roomCode, setRoomCode] = useState<string>('');
  const [myPid, setMyPid] = useState<string | null>(null);
  const [myGameId, setMyGameId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [room, setRoom] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>('join');
  const [selectedTeam, setSelectedTeam] = useState<Set<string>>(new Set());

  // URL 파라미터
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    const l = params.get('lang') as Lang | null;
    if (r) setRoomCode(r);
    if (l && ['ko', 'en', 'zh'].includes(l)) setLang(l);
  }, []);

  // 방 구독
  useEffect(() => {
    if (!roomCode || !myPid) return;
    const unsub = subscribeRoom(roomCode, (data) => {
      setRoom(data);

      if (!data) return;
      const serverPhase = data.phase as string;

      // playerMapping에서 내 gameId 찾기
      const mapping = data.playerMapping as Record<string, string> | undefined;
      if (mapping && !myGameId) {
        const gid = mapping[myPid];
        if (gid) setMyGameId(gid);
      }

      // phase 전환
      if (serverPhase === 'lobby') setPhase('lobby');
      else if (serverPhase === 'role-reveal') setPhase('role-reveal');
      else if (serverPhase === 'team-build') {
        // 내가 인도자인지 확인
        const missions = data.missions as Record<string, unknown>[] | undefined;
        const currentRound = data.currentRound as number;
        if (missions && missions[currentRound]) {
          const mission = missions[currentRound] as Record<string, unknown>;
          if (mission.leaderId === myGameId) {
            setPhase('team-build');
          } else {
            setPhase('waiting');
          }
        }
      }
      else if (serverPhase === 'vote') setPhase('vote');
      else if (serverPhase === 'vote-result') setPhase('vote-result');
      else if (serverPhase === 'mission') {
        const missions = data.missions as Record<string, unknown>[] | undefined;
        const currentRound = data.currentRound as number;
        if (missions && missions[currentRound]) {
          const teamIds = (missions[currentRound] as Record<string, unknown>).teamIds as string[] | undefined;
          if (teamIds && myGameId && teamIds.includes(myGameId)) {
            setPhase('mission');
          } else {
            setPhase('waiting');
          }
        }
      }
      else if (serverPhase === 'mission-result') setPhase('mission-result');
      else if (serverPhase === 'finished') setPhase('finished');
    });
    return unsub;
  }, [roomCode, myPid, myGameId]);

  // 이름 입력 후 참가
  const handleJoin = async () => {
    if (!name.trim() || !roomCode) return;
    const pid = await joinRoom(roomCode, name.trim());
    if (pid) {
      setMyPid(pid);
      setPhase('lobby');
    }
  };

  const myInfo = room?.playerInfos && myGameId
    ? (room.playerInfos as Record<string, { team: string; specialRole: string | null; info: string[] }>)[myGameId]
    : null;

  const players = room?.players as Record<string, { name: string; team?: string }> | undefined;
  const gamePlayers = players ? Object.entries(players).map(([id, p]) => ({ id, name: p.name })) : [];

  // ===== 이름 입력 =====
  if (phase === 'join') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-2xl font-black text-stone-800 mb-4">📖 {wt(lang, 'title')}</h2>
          <p className="text-stone-500 text-sm mb-4">방 코드: <strong>{roomCode}</strong></p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder={wt(lang, 'namePlaceholder')}
            className="w-full border-2 border-stone-300 rounded-lg px-3 py-3 text-center font-bold text-lg
                       focus:outline-none focus:border-stone-500 mb-4"
            maxLength={10}
            autoFocus
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold disabled:opacity-40"
          >
            참가하기
          </button>
        </div>
      </div>
    );
  }

  // ===== 대기실 =====
  if (phase === 'lobby') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-2">대기 중...</h2>
          <p className="text-stone-500 mb-4">호스트가 게임을 시작하면 자동으로 진행됩니다</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {gamePlayers.map(p => (
              <span key={p.id} className="bg-stone-100 px-3 py-1 rounded-full text-sm font-bold">{p.name}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== 역할 확인 =====
  if (phase === 'role-reveal' && myInfo) {
    const teamName = TEAM_NAMES[lang][myInfo.team];
    const roleName = myInfo.specialRole ? ROLE_NAMES[lang][myInfo.specialRole] : null;
    const bg = myInfo.team === 'witness' ? 'bg-blue-600' : 'bg-red-600';

    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center ${bg} p-6`}>
        <div className="text-6xl mb-4">{myInfo.team === 'witness' ? '📖' : '🔴'}</div>
        <div className="bg-white/20 rounded-2xl p-6 text-center max-w-xs w-full">
          <h1 className="text-3xl font-black text-white mb-2">{teamName}</h1>
          {roleName && <h2 className="text-xl font-bold text-white/90 mb-4">{roleName}</h2>}
          {myInfo.info.length > 0 && (
            <div className="mt-4 border-t border-white/20 pt-4">
              {myInfo.info.map((line, i) => (
                <p key={i} className="text-white/80 text-sm mb-1">{line}</p>
              ))}
            </div>
          )}
        </div>
        <p className="text-white/50 text-xs mt-4">이 화면을 다른 사람에게 보여주지 마세요!</p>
      </div>
    );
  }

  // ===== 인도자: 팀원 선택 =====
  if (phase === 'team-build' && room) {
    const missions = room.missions as Record<string, unknown>[];
    const currentRound = room.currentRound as number;
    const mission = missions[currentRound] as Record<string, unknown>;
    const requiredSize = mission.requiredSize as number;

    const gamePlayersList = room.players
      ? Object.entries(room.players as Record<string, { name: string }>)
      : [];

    // playerMapping으로 gameId 얻기
    const mapping = room.playerMapping as Record<string, string>;
    const allGamePlayers = gamePlayersList.map(([pid]) => ({
      pid,
      gameId: mapping[pid],
      name: (room.players as Record<string, { name: string }>)[pid].name,
    }));

    const toggleMember = (gameId: string) => {
      const next = new Set(selectedTeam);
      if (next.has(gameId)) next.delete(gameId); else next.add(gameId);
      setSelectedTeam(next);
    };

    const handleConfirm = async () => {
      const teamIds = [...selectedTeam];
      await submitAction(roomCode, `missions/${currentRound}/teamIds`, teamIds);
      await submitAction(roomCode, 'phase', 'vote');
      setSelectedTeam(new Set());
    };

    return (
      <div className="min-h-dvh bg-stone-100 flex flex-col p-4">
        <h2 className="text-lg font-bold text-stone-800 text-center mb-1">{wt(lang, 'teamBuild')}</h2>
        <p className="text-stone-500 text-sm text-center mb-4">{wt(lang, 'required')}: {requiredSize}명</p>

        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-4">
          {allGamePlayers.map(p => (
            <button
              key={p.gameId}
              onClick={() => toggleMember(p.gameId)}
              className={`p-3 rounded-xl font-bold text-sm transition-all
                ${selectedTeam.has(p.gameId) ? 'bg-amber-400 text-stone-800 scale-105' : 'bg-white text-stone-600 shadow-sm'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedTeam.size !== requiredSize}
          className="w-full max-w-sm mx-auto bg-stone-800 text-white py-3 rounded-xl font-bold disabled:opacity-40"
        >
          {wt(lang, 'confirm')} ({selectedTeam.size}/{requiredSize})
        </button>
      </div>
    );
  }

  // ===== 투표 =====
  if (phase === 'vote' && room && myGameId) {
    const missions = room.missions as Record<string, unknown>[];
    const currentRound = room.currentRound as number;
    const mission = missions[currentRound] as Record<string, unknown>;
    const votes = (mission.votes || {}) as Record<string, boolean>;
    const alreadyVoted = myGameId in votes;

    const teamIds = (mission.teamIds || []) as string[];
    const gamePlayers2 = room.players ? Object.entries(room.players as Record<string, { name: string }>) : [];
    const mapping = room.playerMapping as Record<string, string>;
    const teamNames = teamIds.map(gid => {
      const entry = gamePlayers2.find(([pid]) => mapping[pid] === gid);
      return entry ? entry[1].name : gid;
    });

    const handleVote = async (approve: boolean) => {
      await submitAction(roomCode, `missions/${currentRound}/votes/${myGameId}`, approve);
    };

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-2">{wt(lang, 'voting')}</h2>
          <p className="text-stone-500 text-sm mb-3">팀원: {teamNames.join(', ')}</p>
          <p className="text-stone-500 mb-4">{wt(lang, 'voteGuide')}</p>

          {alreadyVoted ? (
            <p className="text-stone-400 font-bold">투표 완료. 대기 중...</p>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={() => handleVote(false)}
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600">{wt(lang, 'reject')}</button>
              <button onClick={() => handleVote(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600">{wt(lang, 'approve')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 봉사 카드 제출 =====
  if (phase === 'mission' && room && myGameId) {
    const missions = room.missions as Record<string, unknown>[];
    const currentRound = room.currentRound as number;
    const mission = missions[currentRound] as Record<string, unknown>;
    const submissions = (mission.submissions || {}) as Record<string, boolean>;
    const alreadySubmitted = myGameId in submissions;

    const isWitness = myInfo?.team === 'witness';

    const handleSubmit = async (success: boolean) => {
      const finalValue = isWitness ? true : success;
      await submitAction(roomCode, `missions/${currentRound}/submissions/${myGameId}`, finalValue);
    };

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-2">{wt(lang, 'mission')}</h2>
          <p className="text-stone-500 mb-6">{wt(lang, 'missionGuide')}</p>

          {alreadySubmitted ? (
            <p className="text-stone-400 font-bold">제출 완료. 대기 중...</p>
          ) : isWitness ? (
            <button onClick={() => handleSubmit(true)}
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg">✅ {wt(lang, 'success')}</button>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={() => handleSubmit(false)}
                className="bg-red-500 text-white px-6 py-4 rounded-xl font-bold text-lg">❌ {wt(lang, 'fail')}</button>
              <button onClick={() => handleSubmit(true)}
                className="bg-blue-500 text-white px-6 py-4 rounded-xl font-bold text-lg">✅ {wt(lang, 'success')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 투표 결과 / 봉사 결과 / 대기 / 게임 종료 =====
  if (phase === 'vote-result' || phase === 'mission-result') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <p className="text-stone-500 text-lg font-bold">아이패드 화면을 확인하세요</p>
      </div>
    );
  }

  if (phase === 'finished' && room) {
    const winner = room.winner as string;
    const isWitness = winner === 'witness';
    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center p-6 ${isWitness ? 'bg-blue-600' : 'bg-red-600'}`}>
        <div className="text-6xl mb-4">{isWitness ? '📖' : '🔴'}</div>
        <h1 className="text-3xl font-black text-white">{isWitness ? wt(lang, 'witnessWin') : wt(lang, 'agentWin')}</h1>
        <p className="text-white/80 mt-2">{room.winReason ? wt(lang, room.winReason as any) : ''}</p>
      </div>
    );
  }

  // 대기
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
      <div className="text-4xl mb-4">⏳</div>
      <p className="text-stone-500 font-bold">대기 중...</p>
    </div>
  );
}
