import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { useWitnessesStore } from '../store/game-store';
import { useGameStore } from '../../codenames/store/game-store';
import { wt } from '../lib/i18n';

interface Props {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: Props) {
  const store = useWitnessesStore();
  const { game, playerNames } = store;
  const lang = useGameStore((s) => s.lang);
  const [selectedTeam, setSelectedTeam] = useState<Set<string>>(new Set());
  const [votingPlayer, setVotingPlayer] = useState(0);
  const [missionPlayer, setMissionPlayer] = useState(0);
  const [revealRoles, setRevealRoles] = useState(false);

  // 역할 확인 타이머
  useEffect(() => {
    if (game?.phase !== 'role-reveal' || !game.roleRevealEndAt) return;
    const timer = setInterval(() => {
      if (Date.now() >= game.roleRevealEndAt!) {
        store.endReveal();
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game?.phase, game?.roleRevealEndAt]);

  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    if (game?.phase !== 'role-reveal' || !game.roleRevealEndAt) return;
    const timer = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((game.roleRevealEndAt! - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(timer);
  }, [game?.phase, game?.roleRevealEndAt]);

  if (!game) return null;

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const namesParam = encodeURIComponent(JSON.stringify(playerNames));
  const rolesParam = encodeURIComponent(JSON.stringify(game.enabledRoles));
  const currentMission = game.missions[game.currentRound];

  // ===== 역할 확인 =====
  if (game.phase === 'role-reveal') {
    return (
      <div className="h-dvh bg-stone-900 flex flex-col items-center p-4 overflow-auto">
        <h2 className="text-xl font-bold text-white mb-1">{wt(lang, 'roleReveal')}</h2>
        <p className="text-stone-400 text-sm mb-2">{wt(lang, 'roleRevealGuide')}</p>
        <div className="text-4xl font-mono font-black text-amber-400 mb-4">
          {countdown}{wt(lang, 'seconds')}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg w-full">
          {game.players.map((p, i) => {
            const url = `${baseUrl}?game=witnesses&seed=${game.seed}&names=${namesParam}&roles=${rolesParam}&player=${i}&lang=${lang}`;
            return (
              <div key={p.id} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white text-sm font-bold mb-2">{p.name}</p>
                <QRCodeSVG value={url} size={90} className="mx-auto" bgColor="transparent" fgColor="white" />
              </div>
            );
          })}
        </div>

        <button onClick={() => store.endReveal()}
          className="mt-4 text-stone-500 hover:text-white text-sm font-bold">
          건너뛰기 →
        </button>
      </div>
    );
  }

  // ===== 팀 구성 =====
  if (game.phase === 'team-build' && currentMission) {
    const leader = game.players.find(p => p.id === currentMission.leaderId);
    const toggleMember = (id: string) => {
      const next = new Set(selectedTeam);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedTeam(next);
    };

    return (
      <div className="h-dvh bg-stone-100 flex flex-col overflow-hidden">
        {/* 스코어보드 */}
        <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b">
          <div className="flex gap-1">
            {game.missions.map((m, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${m.result === 'success' ? 'bg-blue-500 text-white' :
                  m.result === 'fail' ? 'bg-red-500 text-white' :
                  i === game.currentRound ? 'bg-amber-400 text-stone-800' : 'bg-stone-200 text-stone-500'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          {game.consecutiveRejects > 0 && (
            <span className="text-red-500 text-xs font-bold">
              {wt(lang, 'consecutiveReject')}: {game.consecutiveRejects}/5
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-center mb-4">
            <p className="text-stone-500 text-sm">{wt(lang, 'round')} {game.currentRound + 1} · {wt(lang, 'leader')}: <strong>{leader?.name}</strong></p>
            <p className="text-stone-800 font-bold text-lg">{wt(lang, 'selectMembers')}</p>
            <p className="text-stone-400 text-sm">{wt(lang, 'required')}: {currentMission.requiredSize}명 {currentMission.needsTwoFails ? '(실패 2개 필요)' : ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
            {game.players.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleMember(p.id)}
                className={`p-3 rounded-xl font-bold text-sm transition-all
                  ${selectedTeam.has(p.id) ? 'bg-amber-400 text-stone-800 scale-105' : 'bg-white text-stone-600 shadow-sm'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t bg-white p-3">
          <button
            onClick={() => { store.selectTeam([...selectedTeam]); setSelectedTeam(new Set()); setVotingPlayer(0); }}
            disabled={selectedTeam.size !== currentMission.requiredSize}
            className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold disabled:opacity-40"
          >
            {wt(lang, 'confirm')} ({selectedTeam.size}/{currentMission.requiredSize})
          </button>
        </div>
      </div>
    );
  }

  // ===== 투표 =====
  if (game.phase === 'vote' && currentMission) {
    const allVoted = Object.keys(currentMission.votes).length === game.players.length;

    if (!allVoted) {
      const voter = game.players[votingPlayer];
      if (!voter) return null;
      const alreadyVoted = voter.id in currentMission.votes;

      return (
        <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
            <p className="text-stone-500 text-sm mb-1">{wt(lang, 'voting')}</p>
            <h2 className="text-2xl font-black text-stone-800 mb-2">{voter.name}</h2>
            <p className="text-stone-400 text-sm mb-1">
              {wt(lang, 'round')} {game.currentRound + 1} · {currentMission.teamIds.map(id =>
                game.players.find(p => p.id === id)?.name
              ).join(', ')}
            </p>
            <p className="text-stone-500 mb-6">{wt(lang, 'voteGuide')}</p>

            {alreadyVoted ? (
              <button onClick={() => setVotingPlayer(votingPlayer + 1)}
                className="bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold">
                → 다음
              </button>
            ) : (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { store.submitVote(voter.id, false); setVotingPlayer(votingPlayer + 1); }}
                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600"
                >
                  {wt(lang, 'reject')}
                </button>
                <button
                  onClick={() => { store.submitVote(voter.id, true); setVotingPlayer(votingPlayer + 1); }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600"
                >
                  {wt(lang, 'approve')}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ===== 투표 결과 =====
  if (game.phase === 'vote-result' && currentMission) {
    const approveCount = Object.values(currentMission.votes).filter(v => v).length;
    const rejectCount = game.players.length - approveCount;
    const isApproved = currentMission.approved;

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <div className={`rounded-2xl p-8 max-w-xs w-full text-center shadow-lg
          ${isApproved ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-5xl mb-4">{isApproved ? '✅' : '❌'}</div>
          <h2 className="text-2xl font-black text-white mb-4">
            {isApproved ? wt(lang, 'approved') : wt(lang, 'rejected')}
          </h2>
          <div className="flex justify-center gap-6 text-white">
            <div>
              <p className="text-2xl font-black">{approveCount}</p>
              <p className="text-sm opacity-80">{wt(lang, 'voteApproveCount')}</p>
            </div>
            <div>
              <p className="text-2xl font-black">{rejectCount}</p>
              <p className="text-sm opacity-80">{wt(lang, 'voteRejectCount')}</p>
            </div>
          </div>
          {/* 개별 투표 결과 */}
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
          onClick={() => { store.proceedAfterVote(); setVotingPlayer(0); setMissionPlayer(0); }}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold"
        >
          {wt(lang, 'proceed')}
        </button>
      </div>
    );
  }

  // ===== 봉사 =====
  if (game.phase === 'mission' && currentMission) {
    const teamPlayers = currentMission.teamIds.map(id => game.players.find(p => p.id === id)!);
    const allSubmitted = Object.keys(currentMission.submissions).length === currentMission.teamIds.length;

    if (!allSubmitted) {
      const current = teamPlayers[missionPlayer];
      if (!current) return null;
      const alreadySubmitted = current.id in currentMission.submissions;

      return (
        <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-lg">
            <p className="text-stone-500 text-sm mb-1">{wt(lang, 'mission')} · {wt(lang, 'round')} {game.currentRound + 1}</p>
            <h2 className="text-2xl font-black text-stone-800 mb-4">{current.name}</h2>
            <p className="text-stone-500 mb-6">{wt(lang, 'missionGuide')}</p>

            {alreadySubmitted ? (
              <button onClick={() => setMissionPlayer(missionPlayer + 1)}
                className="bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-bold">
                → 다음
              </button>
            ) : (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { store.submitMission(current.id, false); setMissionPlayer(missionPlayer + 1); }}
                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-red-600"
                >
                  ❌ {wt(lang, 'fail')}
                </button>
                <button
                  onClick={() => { store.submitMission(current.id, true); setMissionPlayer(missionPlayer + 1); }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-blue-600"
                >
                  ✅ {wt(lang, 'success')}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ===== 봉사 결과 =====
  if (game.phase === 'mission-result' && currentMission) {
    const failCount = Object.values(currentMission.submissions).filter(v => !v).length;
    const isSuccess = currentMission.result === 'success';

    return (
      <div className="h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
        <div className={`rounded-2xl p-8 max-w-xs w-full text-center shadow-lg
          ${isSuccess ? 'bg-blue-500' : 'bg-red-500'}`}>
          <div className="text-6xl mb-4">{isSuccess ? '✅' : '❌'}</div>
          <h2 className="text-3xl font-black text-white mb-2">
            {isSuccess ? wt(lang, 'success') : wt(lang, 'fail')}
          </h2>
          <p className="text-white/80">
            {wt(lang, 'failCount')}: {failCount}
            {currentMission.needsTwoFails ? ' (2개 필요)' : ''}
          </p>
        </div>

        <button
          onClick={() => { store.nextRound(); setSelectedTeam(new Set()); setVotingPlayer(0); setMissionPlayer(0); }}
          className="mt-6 bg-stone-800 text-white px-8 py-3 rounded-xl font-bold"
        >
          {wt(lang, 'nextRound')}
        </button>
      </div>
    );
  }

  // ===== 당간부 순감 지목 =====
  if (game.phase === 'assassinate') {
    const commander = game.players.find(p => p.specialRole === 'commander');
    const witnesses = game.players.filter(p => p.team === 'witness');

    return (
      <div className="h-dvh bg-red-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-black text-white mb-1">{wt(lang, 'assassinateTitle')}</h2>
          <p className="text-red-200 text-sm mb-4">
            {commander?.name}: {wt(lang, 'assassinateGuide')}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {witnesses.map((p) => (
              <button
                key={p.id}
                onClick={() => store.assassinate(p.id)}
                className="bg-white/20 text-white py-3 rounded-xl font-bold hover:bg-white/30"
              >
                {p.name}
              </button>
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
      <div className={`h-dvh flex flex-col items-center justify-center p-6
        ${isWitness ? 'bg-blue-600' : 'bg-red-600'}`}>
        <div className="text-6xl mb-4">{isWitness ? '📖' : '🔴'}</div>
        <h1 className="text-3xl font-black text-white mb-2">
          {isWitness ? wt(lang, 'witnessWin') : wt(lang, 'agentWin')}
        </h1>
        <p className="text-white/80 mb-6">{game.winReason ? wt(lang, game.winReason as any) : ''}</p>

        {/* 스코어 */}
        <div className="flex gap-2 mb-6">
          {game.missions.map((m, i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
              ${m.result === 'success' ? 'bg-blue-400 text-white' :
                m.result === 'fail' ? 'bg-red-400 text-white' : 'bg-white/20 text-white/50'}`}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* 역할 공개 */}
        <button onClick={() => setRevealRoles(!revealRoles)}
          className="text-white/70 text-sm font-bold mb-4 hover:text-white">
          {wt(lang, 'revealAll')}
        </button>

        {revealRoles && (
          <div className="bg-white/10 rounded-xl p-4 max-w-sm w-full mb-6">
            {game.players.map((p) => (
              <div key={p.id} className="flex justify-between py-1 border-b border-white/10 last:border-0">
                <span className="text-white font-bold">{p.name}</span>
                <span className={`font-bold ${p.team === 'witness' ? 'text-blue-300' : 'text-red-300'}`}>
                  {p.team === 'witness' ? wt(lang, 'witness') : wt(lang, 'agent')}
                  {p.specialRole && ` · ${wt(lang, p.specialRole as any)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { store.initAndStart(playerNames, game.enabledRoles); setRevealRoles(false); setSelectedTeam(new Set()); setVotingPlayer(0); setMissionPlayer(0); }}
            className="bg-white text-stone-800 px-6 py-3 rounded-xl font-bold hover:bg-white/90"
          >
            {wt(lang, 'playAgain')}
          </button>
          <button onClick={onGoHome} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30">
            {wt(lang, 'goHome')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
