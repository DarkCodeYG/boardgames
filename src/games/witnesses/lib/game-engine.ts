import seedrandom from 'seedrandom';
import type { GameState, Player, Mission, SpecialRole } from './types';
import { TEAM_COMP, MISSION_SIZE, TWO_FAILS_MIN_PLAYERS, ROLE_REVEAL_SECONDS, MAX_CONSECUTIVE_REJECTS } from './config';

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 게임 생성 (로비 상태) */
export function createGame(enabledRoles: SpecialRole[], existingSeed?: string): GameState {
  const seed = existingSeed ?? generateSeed();

  return {
    phase: 'lobby',
    players: [],
    missions: [],
    currentRound: 0,
    currentLeaderIndex: 0,
    consecutiveRejects: 0,
    witnessWins: 0,
    agentWins: 0,
    winner: null,
    winReason: null,
    assassinTarget: null,
    seed,
    roleRevealEndAt: null,
    enabledRoles: enabledRoles.filter(r => r !== null) as SpecialRole[],
  };
}

/** 플레이어 추가 */
export function addPlayer(state: GameState, name: string): GameState {
  const id = `p${state.players.length}`;
  const player: Player = { id, name, team: 'witness', specialRole: null };
  return { ...state, players: [...state.players, player] };
}

/** 플레이어 제거 */
export function removePlayer(state: GameState, playerId: string): GameState {
  return { ...state, players: state.players.filter(p => p.id !== playerId) };
}

/** 역할 배분 및 게임 시작 */
export function startGame(state: GameState): GameState {
  const count = state.players.length;
  const comp = TEAM_COMP[count];
  if (!comp) return state;

  const rng = seedrandom(state.seed);
  const shuffledIndices = shuffle(
    Array.from({ length: count }, (_, i) => i),
    rng
  );

  // 팀 배정
  const players: Player[] = state.players.map((p, _) => ({ ...p }));
  const agentIndices = shuffledIndices.slice(0, comp.agent);
  const witnessIndices = shuffledIndices.slice(comp.agent);

  for (const i of agentIndices) players[i] = { ...players[i], team: 'agent' };
  for (const i of witnessIndices) players[i] = { ...players[i], team: 'witness' };

  // 특수 직분 배정
  const enabled = state.enabledRoles;
  const witnessSpecials: SpecialRole[] = [];
  const agentSpecials: SpecialRole[] = [];

  if (enabled.includes('overseer')) witnessSpecials.push('overseer');
  if (enabled.includes('elder')) witnessSpecials.push('elder');
  if (enabled.includes('commander')) agentSpecials.push('commander');
  if (enabled.includes('cleric')) agentSpecials.push('cleric');
  if (enabled.includes('apostate')) agentSpecials.push('apostate');

  // 셔플된 증인/공안 인덱스에서 순서대로 직분 배정
  const shuffledWitness = shuffle(witnessIndices, rng);
  const shuffledAgent = shuffle(agentIndices, rng);

  for (let i = 0; i < witnessSpecials.length && i < shuffledWitness.length; i++) {
    players[shuffledWitness[i]] = { ...players[shuffledWitness[i]], specialRole: witnessSpecials[i] };
  }
  for (let i = 0; i < agentSpecials.length && i < shuffledAgent.length; i++) {
    players[shuffledAgent[i]] = { ...players[shuffledAgent[i]], specialRole: agentSpecials[i] };
  }

  // 인도자 순서 (랜덤)
  const leaderOrder = shuffle(Array.from({ length: count }, (_, i) => i), rng);

  // 미션 초기화
  const sizes = MISSION_SIZE[count] || MISSION_SIZE[12];
  const missions: Mission[] = sizes.map((size, round) => ({
    round: round + 1,
    requiredSize: size,
    needsTwoFails: round === 3 && count >= TWO_FAILS_MIN_PLAYERS,
    leaderId: players[leaderOrder[round % count]].id,
    teamIds: [],
    votes: {},
    approved: null,
    submissions: {},
    result: null,
  }));

  return {
    ...state,
    phase: 'role-reveal',
    players,
    missions,
    currentRound: 0,
    currentLeaderIndex: 0,
    roleRevealEndAt: Date.now() + ROLE_REVEAL_SECONDS * 1000,
  };
}

/** 역할 확인 시간 종료 → 팀 구성 단계 */
export function endRoleReveal(state: GameState): GameState {
  return { ...state, phase: 'team-build' };
}

/** 인도자가 팀원 선택 */
export function selectTeam(state: GameState, teamIds: string[]): GameState {
  const missions = [...state.missions];
  missions[state.currentRound] = {
    ...missions[state.currentRound],
    teamIds,
  };
  return { ...state, missions, phase: 'vote' };
}

/** 투표 제출 */
export function submitVote(state: GameState, playerId: string, approve: boolean): GameState {
  const missions = [...state.missions];
  const mission = { ...missions[state.currentRound] };
  mission.votes = { ...mission.votes, [playerId]: approve };
  missions[state.currentRound] = mission;

  // 모든 플레이어가 투표했는지 확인
  if (Object.keys(mission.votes).length === state.players.length) {
    const approveCount = Object.values(mission.votes).filter(v => v).length;
    const approved = approveCount > state.players.length / 2;
    mission.approved = approved;
    missions[state.currentRound] = mission;

    if (approved) {
      return { ...state, missions, phase: 'vote-result', consecutiveRejects: 0 };
    }

    // 부결
    const newRejects = state.consecutiveRejects + 1;
    if (newRejects >= MAX_CONSECUTIVE_REJECTS) {
      return {
        ...state, missions,
        phase: 'finished',
        winner: 'agent',
        winReason: 'winReason5Rejects',
        consecutiveRejects: newRejects,
      };
    }

    return {
      ...state, missions,
      phase: 'vote-result',
      consecutiveRejects: newRejects,
    };
  }

  return { ...state, missions };
}

/** 봉사 카드 제출 (증인은 반드시 성공만 제출 가능) */
export function submitMissionCard(state: GameState, playerId: string, success: boolean): GameState {
  const player = state.players.find(p => p.id === playerId);
  const finalSuccess = player?.team === 'witness' ? true : success;
  const missions = [...state.missions];
  const mission = { ...missions[state.currentRound] };
  mission.submissions = { ...mission.submissions, [playerId]: finalSuccess };
  missions[state.currentRound] = mission;

  // 모든 팀원이 제출했는지 확인
  if (Object.keys(mission.submissions).length === mission.teamIds.length) {
    const failCount = Object.values(mission.submissions).filter(v => !v).length;
    const isFail = mission.needsTwoFails ? failCount >= 2 : failCount >= 1;
    mission.result = isFail ? 'fail' : 'success';
    missions[state.currentRound] = mission;

    const newWitnessWins = state.witnessWins + (mission.result === 'success' ? 1 : 0);
    const newAgentWins = state.agentWins + (mission.result === 'fail' ? 1 : 0);

    // 승리 조건 확인
    if (newAgentWins >= 3) {
      return {
        ...state, missions, witnessWins: newWitnessWins, agentWins: newAgentWins,
        phase: 'finished',
        winner: 'agent',
        winReason: 'winReason3Fail',
      };
    }

    if (newWitnessWins >= 3) {
      // 당간부가 있으면 순감 지목 기회
      const hasCommander = state.players.some(p => p.specialRole === 'commander');
      if (hasCommander) {
        return {
          ...state, missions, witnessWins: newWitnessWins, agentWins: newAgentWins,
          phase: 'assassinate',
        };
      }
      return {
        ...state, missions, witnessWins: newWitnessWins, agentWins: newAgentWins,
        phase: 'finished',
        winner: 'witness',
        winReason: 'winReason3Success',
      };
    }

    return {
      ...state, missions, witnessWins: newWitnessWins, agentWins: newAgentWins,
      phase: 'mission-result',
    };
  }

  return { ...state, missions };
}

/** 투표 결과 확인 후 다음 단계 */
export function proceedAfterVote(state: GameState): GameState {
  const mission = state.missions[state.currentRound];
  if (mission.approved) {
    return { ...state, phase: 'mission' };
  }
  // 부결 → 인도자 변경, 다시 팀 구성
  const nextLeaderIdx = (state.currentLeaderIndex + 1) % state.players.length;
  const missions = [...state.missions];
  missions[state.currentRound] = {
    ...mission,
    leaderId: state.players[nextLeaderIdx].id,
    teamIds: [],
    votes: {},
    approved: null,
  };
  return {
    ...state, missions,
    phase: 'team-build',
    currentLeaderIndex: nextLeaderIdx,
  };
}

/** 미션 결과 확인 후 다음 라운드 */
export function nextRound(state: GameState): GameState {
  const nextRound = state.currentRound + 1;
  if (nextRound >= 5) {
    const winner = state.witnessWins >= 3 ? 'witness' as const : 'agent' as const;
    return { ...state, phase: 'finished', winner, winReason: winner === 'witness' ? 'winReason3Success' : 'winReason3Fail' };
  }

  return {
    ...state,
    phase: 'team-build',
    currentRound: nextRound,
    currentLeaderIndex: (state.currentLeaderIndex + 1) % state.players.length,
    consecutiveRejects: 0,
  };
}

/** 당간부 순감 지목 */
export function assassinate(state: GameState, targetId: string): GameState {
  const target = state.players.find(p => p.id === targetId);
  if (target?.specialRole === 'overseer') {
    return {
      ...state,
      phase: 'finished',
      winner: 'agent',
      winReason: 'winReasonAssassinate',
      assassinTarget: targetId,
    };
  }
  return {
    ...state,
    phase: 'finished',
    winner: 'witness',
    winReason: 'winReasonAssassinateFail',
    assassinTarget: targetId,
  };
}

/** 플레이어가 알아야 할 정보 */
export function getPlayerInfo(state: GameState, playerId: string): string[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const info: string[] = [];
  const teamMembers = state.players.filter(p => p.team === player.team && p.id !== playerId);

  if (player.team === 'agent') {
    // 공안끼리 서로 알기
    info.push(`공안 동료: ${teamMembers.map(p => p.name).join(', ')}`);
  }

  if (player.specialRole === 'overseer') {
    // 순감: 공안 확인 (배교자 제외)
    const visibleAgents = state.players.filter(
      p => p.team === 'agent' && p.specialRole !== 'apostate'
    );
    info.push(`공안으로 보이는 사람: ${visibleAgents.map(p => p.name).join(', ')}`);
  }

  if (player.specialRole === 'elder') {
    // 장로: 순감+교직자 이름 (누가 누군지 모름, 셔플해서 제공)
    const targets = state.players.filter(
      p => p.specialRole === 'overseer' || p.specialRole === 'cleric'
    );
    const shuffledNames = [...targets.map(p => p.name)].sort();
    if (shuffledNames.length > 0) {
      info.push(`순감/교직자 중: ${shuffledNames.join(', ')}`);
    }
  }

  return info;
}
