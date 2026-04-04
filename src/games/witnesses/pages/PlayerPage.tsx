import { useEffect, useState, useRef } from 'react';
import { subscribeRoom, joinRoom, submitAction } from '../lib/firebase-room';
import type { Lang } from '../../codenames/lib/i18n';
import { wt } from '../lib/i18n';
import { sfxClick, sfxToggle, sfxCorrect, sfxModalOpen, sfxModalClose, sfxRoleReveal } from '../../../lib/sound';

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
  const [joinError, setJoinError] = useState<string | null>(null);
  const [room, setRoom] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>('join');
  const [selectedTeam, setSelectedTeam] = useState<Set<string>>(new Set());
  const [showRole, setShowRole] = useState(false);
  const [joining, setJoining] = useState(false);
  const roleRevealedRef = useRef(false);

  // URL 파라미터
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    const l = params.get('lang') as Lang | null;
    console.log('🔍 URL 파라미터:', { room: r, lang: l });
    if (r) setRoomCode(r);
    if (l && ['ko', 'en', 'zh'].includes(l)) setLang(l);
  }, []);

  // 역할 공개 효과음 (hooks 규칙: 모든 useEffect는 early return 전 최상단에)
  useEffect(() => {
    if (phase === 'role-reveal' && room && myGameId && !roleRevealedRef.current) {
      const playerInfos = room.playerInfos as Record<string, { team: string; specialRole: string | null; info: string[] }> | undefined;
      const myPlayerInfo = playerInfos ? playerInfos[myGameId] : null;
      if (myPlayerInfo) {
        roleRevealedRef.current = true;
        sfxRoleReveal();
      }
    }
  }, [phase, room, myGameId]);

  // 방 구독
  useEffect(() => {
    if (!roomCode || !myPid) return;
    const unsub = subscribeRoom(roomCode, (data) => {
      setRoom(data);

      if (!data) return;
      const serverPhase = data.phase as string;

      // playerMapping에서 내 gameId 찾기 (로컬 변수로 즉시 사용 — setState 타이밍 문제 방지)
      const mapping = data.playerMapping as Record<string, string> | undefined;
      let currentGameId = myGameId;
      if (mapping && myPid) {
        const gid = mapping[myPid];
        if (gid) {
          currentGameId = gid;
          if (gid !== myGameId) setMyGameId(gid);
        }
      }

      // phase 전환 (currentGameId 사용 — myGameId보다 항상 최신)
      if (serverPhase === 'lobby') setPhase('lobby');
      else if (serverPhase === 'role-reveal') setPhase('role-reveal');
      else if (serverPhase === 'team-build') {
        const missions = data.missions as Record<string, unknown>[] | undefined;
        const currentRound = data.currentRound as number;
        if (missions && missions[currentRound]) {
          const mission = missions[currentRound] as Record<string, unknown>;
          if (mission.leaderId === currentGameId) {
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
          if (teamIds && currentGameId && teamIds.includes(currentGameId)) {
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
    if (!name.trim() || !roomCode || joining) return;
    setJoining(true);
    setJoinError(null);
    const trimmed = name.trim();
    const result = await joinRoom(roomCode, trimmed);

    if ('error' in result) {
      if (result.error === 'reconnect' && result.pid) {
        setMyPid(result.pid);
        setPhase('lobby');
        localStorage.setItem(`witnesses_${roomCode}`, JSON.stringify({ pid: result.pid, name: trimmed }));
      } else if (result.error === 'duplicate') {
        setJoinError(wt(lang, 'duplicateName'));
        setJoining(false);
      } else if (result.error === 'full') {
        setJoinError(wt(lang, 'roomFull'));
        setJoining(false);
      } else {
        setJoinError(wt(lang, 'roomNotFound'));
        setJoining(false);
      }
    } else {
      setMyPid(result.pid);
      setPhase('lobby');
      localStorage.setItem(`witnesses_${roomCode}`, JSON.stringify({ pid: result.pid, name: trimmed }));
    }
  };

  const myInfo = room?.playerInfos && myGameId
    ? (room.playerInfos as Record<string, { team: string; specialRole: string | null; info: string[] }>)[myGameId]
    : null;

  const players = room?.players as Record<string, { name: string; team?: string }> | undefined;
  const gamePlayers = players ? Object.entries(players).map(([id, p]) => ({ id, name: p.name })) : [];

  // 역할별 설명
  const ROLE_TIPS: Record<Lang, Record<string, string>> = {
    ko: {
      witness_default: '회중에 침투한 공안 세력을 피해 봉사구역을 완수하세요!',
      agent_default: '증인인 척하면서 봉사를 방해하세요. 동료 공안과 협력하세요!',
      overseer: '공안이 누구인지 볼 수 있습니다 (배교자 제외). 정체를 들키지 않으면서 증인들을 올바른 방향으로 이끌어 주세요. ⚠️ 당신의 신분이 공안(당간부)에게 노출되면 패배합니다!',
      elder: '순회감독자와 교직자의 이름을 알 수 있지만, 누가 누구인지는 모릅니다. 순회감독자를 잘 구분해 그의 인도를 잘 따르길 바랍니다',
      commander: '증인이 봉사구역을 성공시키더라도, 순회감독자를 지목할 기회가 주어집니다. 누가 공안을 피하려 하는지 잘 관찰하세요',
      cleric: '장로에게 순회감독자처럼 보입니다. 장로의 신뢰를 얻어 봉사를 실패로 이끄세요',
      apostate: '순회감독자에게 공안으로 보이지 않습니다. 증인인 척하면서 안에서부터 봉사를 방해하세요',
    },
    en: {
      witness_default: 'Avoid the infiltrated agents and complete the service territories!',
      agent_default: 'Pretend to be a witness and sabotage the missions. Cooperate with fellow agents!',
      overseer: 'You can see who the agents are (except Apostate). Guide the witnesses without revealing your identity. ⚠️ If the Commander identifies you, your team loses!',
      elder: 'You know the names of Overseer and Cleric, but not who is who. Discern the Overseer well and follow his lead',
      commander: 'If witnesses get 3 successes, you can identify the Overseer. Watch closely who tries to avoid the agents',
      cleric: 'You appear as the Overseer to the Elder. Gain their trust and sabotage the missions',
      apostate: 'You are hidden from the Overseer. Pretend to be a witness and undermine missions from within',
    },
    zh: {
      witness_default: '躲避潜入的公安势力，完成服务区域！',
      agent_default: '假装成见证人破坏传道任务。与公安同伴合作！',
      overseer: '你可以看到公安是谁（叛教者除外）。在不暴露身份的情况下引导见证人。⚠️ 如果指挥官识别出你，你的队伍将会失败！',
      elder: '你知道巡回监督和教职者的名字，但不知道谁是谁。请辨别巡回监督并好好跟随他的引导',
      commander: '见证人3区成功时，你可以指认巡回监督。仔细观察谁在试图躲避公安',
      cleric: '在长老眼中你看起来像巡回监督。赢得长老的信任，破坏传道任务',
      apostate: '巡回监督看不到你。假装成见证人，从内部破坏传道任务',
    },
  };

  // 이름 배너 (게임 진행 중 상단 표시 + 역할보기 버튼)
  const NameBanner = () => {
    if (!name) return null;
    const dotColor = myInfo?.team === 'witness' ? 'bg-blue-500' : myInfo?.team === 'agent' ? 'bg-red-500' : 'bg-stone-400';
    return (
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-stone-200 py-2 px-4 flex items-center justify-center gap-2 z-50">
        <span className={`w-3 h-3 rounded-full ${dotColor}`} />
        <span className="font-bold text-stone-800 text-sm">{name}</span>
        {myInfo && (
          <button onClick={() => { sfxModalOpen(); setShowRole(true); }}
            className="ml-2 text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold hover:bg-stone-300">
            {wt(lang, 'yourRole')}
          </button>
        )}
      </div>
    );
  };

  // 당간부+교직자 겸임 여부
  const isDualRole = !!(room?.commanderIsAlsoCleric && myInfo?.specialRole === 'commander');

  // 역할 오버레이
  const RoleOverlay = () => {
    if (!showRole || !myInfo) return null;
    const teamName = TEAM_NAMES[lang][myInfo.team];
    const roleName = myInfo.specialRole ? ROLE_NAMES[lang][myInfo.specialRole] : null;
    const dotColor = myInfo.team === 'witness' ? 'bg-blue-500' : 'bg-red-500';
    const textColor = myInfo.team === 'witness' ? 'text-blue-600' : 'text-red-600';
    const baseTip = ROLE_TIPS[lang][myInfo.team === 'witness' ? 'witness_default' : 'agent_default'];
    const specialTip = myInfo.specialRole ? ROLE_TIPS[lang][myInfo.specialRole] : null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
        onClick={() => { sfxModalClose(); setShowRole(false); }}>
        <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className={`w-4 h-4 rounded-full ${dotColor}`} />
            <span className={`text-sm font-bold ${textColor}`}>{teamName}</span>
          </div>

          {roleName ? (
            <h1 className="text-2xl font-black text-stone-800 mb-1">{roleName}</h1>
          ) : (
            <h1 className="text-2xl font-black text-stone-800 mb-1">{teamName}</h1>
          )}
          {isDualRole && (
            <p className="text-amber-600 text-sm font-bold mb-2">+ {ROLE_NAMES[lang]['cleric']} {wt(lang, 'dualRole')}</p>
          )}

          {/* 기본 임무 (항상 표시) */}
          <p className="text-stone-500 text-sm mb-2">{baseTip}</p>
          {/* 직분별 추가 설명 */}
          {specialTip && <p className="text-stone-600 text-sm font-bold mb-2">📌 {specialTip}</p>}
          {isDualRole && (
            <p className="text-stone-600 text-sm font-bold mb-2">📌 {ROLE_TIPS[lang]['cleric']}</p>
          )}

          {(myInfo.info?.length ?? 0) > 0 && (
            <div className="border-t border-stone-200 pt-3 mt-3">
              {(myInfo.info || []).map((line, i) => (
                <p key={i} className="text-stone-600 text-sm font-bold mb-1">{line}</p>
              ))}
            </div>
          )}

          <button onClick={() => { sfxModalClose(); setShowRole(false); }}
            className="mt-4 w-full bg-stone-800 text-white py-3 rounded-xl font-bold">
            {wt(lang, 'proceed')}
          </button>
        </div>
      </div>
    );
  };

  // ===== 이름 입력 =====
  if (phase === 'join') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-2xl font-black text-stone-800 mb-4">{wt(lang, 'title')}</h2>
          <p className="text-stone-500 text-sm mb-4">방 코드: <strong>{roomCode}</strong></p>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setJoinError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder={wt(lang, 'namePlaceholder')}
            className={`w-full border-2 rounded-lg px-3 py-3 text-center font-bold text-lg
                       focus:outline-none mb-2 ${joinError ? 'border-red-400 focus:border-red-500' : 'border-stone-300 focus:border-stone-500'}`}
            maxLength={10}
            autoFocus
          />
          {joinError && <p className="text-red-500 text-sm font-bold mb-2">{joinError}</p>}
          <button
            onClick={() => { sfxClick(); handleJoin(); }}
            disabled={!name.trim() || joining}
            className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold disabled:opacity-40 mt-2"
          >
            {wt(lang, 'join')}
          </button>
        </div>
      </div>
    );
  }

  // ===== 대기실 =====
  if (phase === 'lobby') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <NameBanner /><RoleOverlay />
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-2">{wt(lang, 'waiting')}</h2>
          <p className="text-stone-500 mb-4">{wt(lang, 'waitingHost')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {gamePlayers.map(p => (
              <span key={p.id} className={`px-3 py-1 rounded-full text-sm font-bold ${p.name === name ? 'bg-amber-200 text-amber-800' : 'bg-stone-100'}`}>{p.name}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== 역할 로딩 중 (myInfo 아직 없음) =====
  if (phase === 'role-reveal' && !myInfo) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
        <NameBanner /><RoleOverlay />
        <div className="animate-spin w-8 h-8 border-4 border-stone-300 border-t-stone-800 rounded-full mb-4" />
        <p className="text-stone-500 font-bold">역할 배정 중...</p>
      </div>
    );
  }

  // ===== 역할 확인 (첫 공개) =====
  if (phase === 'role-reveal' && myInfo) {
    const teamName = TEAM_NAMES[lang][myInfo.team];
    const roleName = myInfo.specialRole ? ROLE_NAMES[lang][myInfo.specialRole] : null;
    const dotColor = myInfo.team === 'witness' ? 'bg-blue-500' : 'bg-red-500';
    const textColor = myInfo.team === 'witness' ? 'text-blue-600' : 'text-red-600';
    const baseTip = ROLE_TIPS[lang][myInfo.team === 'witness' ? 'witness_default' : 'agent_default'];
    const specialTip = myInfo.specialRole ? ROLE_TIPS[lang][myInfo.specialRole] : null;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6 pt-14">
        <NameBanner /><RoleOverlay />
        <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full shadow-lg animate-flip-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className={`w-4 h-4 rounded-full ${dotColor} inline-block`} />
            <span className={`text-sm font-bold ${textColor}`}>{teamName}</span>
          </div>

          {roleName ? (
            <h1 className="text-2xl font-black text-stone-800 mb-1">{roleName}</h1>
          ) : (
            <h1 className="text-2xl font-black text-stone-800 mb-1">{teamName}</h1>
          )}
          {isDualRole && (
            <p className="text-amber-600 text-sm font-bold mb-2">+ {ROLE_NAMES[lang]['cleric']} {wt(lang, 'dualRole')}</p>
          )}

          {/* 기본 임무 (항상 표시) */}
          <p className="text-stone-500 text-sm mb-2">{baseTip}</p>
          {/* 직분별 추가 설명 */}
          {specialTip && <p className="text-stone-600 text-sm font-bold mb-2">📌 {specialTip}</p>}
          {isDualRole && (
            <p className="text-stone-600 text-sm font-bold mb-2">📌 {ROLE_TIPS[lang]['cleric']}</p>
          )}

          {(myInfo.info?.length ?? 0) > 0 && (
            <div className="border-t border-stone-200 pt-3 mt-3">
              {(myInfo.info || []).map((line, i) => (
                <p key={i} className="text-stone-600 text-sm font-bold mb-1">{line}</p>
              ))}
            </div>
          )}
        </div>
        <p className="text-stone-400 text-xs mt-4">{wt(lang, 'doNotShow')}</p>
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
      <div className="min-h-dvh bg-stone-100 flex flex-col p-4 pt-14">
        <NameBanner /><RoleOverlay />
        <h2 className="text-lg font-bold text-stone-800 text-center mb-1">{wt(lang, 'teamBuild')}</h2>
        <p className="text-stone-500 text-sm text-center mb-4">{wt(lang, 'required')}: {requiredSize}명</p>

        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-4">
          {allGamePlayers.map(p => (
            <button
              key={p.gameId}
              onClick={() => { sfxToggle(); toggleMember(p.gameId); }}
              className={`p-3 rounded-xl font-bold text-sm transition-all
                ${selectedTeam.has(p.gameId) ? 'bg-amber-400 text-stone-800 scale-105' : 'bg-white text-stone-600 shadow-sm'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => { sfxCorrect(); handleConfirm(); }}
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
        <NameBanner /><RoleOverlay />
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-2">{wt(lang, 'voting')}</h2>
          <p className="text-stone-500 text-sm mb-3">{wt(lang, 'teamMembers')}: {teamNames.join(', ')}</p>
          <p className="text-stone-500 mb-2">{wt(lang, 'voteGuide')}</p>
          <p className="text-stone-400 text-xs mb-4">{wt(lang, 'votePublic')}</p>

          {alreadyVoted ? (
            <p className="text-stone-400 font-bold">{wt(lang, 'voteComplete')}</p>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={() => { sfxClick(); handleVote(false); }}
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600">{wt(lang, 'reject')}</button>
              <button onClick={() => { sfxClick(); handleVote(true); }}
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
        <NameBanner /><RoleOverlay />
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-stone-800 mb-2">{wt(lang, 'mission')}</h2>
          <p className="text-stone-500 mb-6">{wt(lang, 'missionGuide')}</p>

          {alreadySubmitted ? (
            <p className="text-stone-400 font-bold">{wt(lang, 'submitComplete')}</p>
          ) : isWitness ? (
            <button onClick={() => { sfxClick(); handleSubmit(true); }}
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg">✅ {wt(lang, 'success')}</button>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={() => { sfxClick(); handleSubmit(false); }}
                className="bg-red-500 text-white px-6 py-4 rounded-xl font-bold text-lg">❌ {wt(lang, 'fail')}</button>
              <button onClick={() => { sfxClick(); handleSubmit(true); }}
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
        <NameBanner /><RoleOverlay />
        <p className="text-stone-500 text-lg font-bold">{wt(lang, 'checkIpad')}</p>
      </div>
    );
  }

  if (phase === 'finished' && room) {
    const winner = room.winner as string;
    const isWitness = winner === 'witness';
    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center p-6 ${isWitness ? 'bg-blue-600' : 'bg-red-600'}`}>
        <NameBanner /><RoleOverlay />
        <div className="text-6xl mb-4">{isWitness ? '📖' : '🔴'}</div>
        <h1 className="text-3xl font-black text-white">{isWitness ? wt(lang, 'witnessWin') : wt(lang, 'agentWin')}</h1>
        <p className="text-white/80 mt-2">{room.winReason ? wt(lang, room.winReason as any) : ''}</p>
      </div>
    );
  }

  // 대기
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-100 p-6">
      <NameBanner /><RoleOverlay />
      <div className="text-4xl mb-4">⏳</div>
      <p className="text-stone-500 font-bold">{wt(lang, 'waiting')}</p>
    </div>
  );
}
