import { useEffect, useState } from 'react';
import seedrandom from 'seedrandom';
import type { Player, SpecialRole, Team } from '../lib/types';
import type { Lang } from '../../codenames/lib/i18n';
import { TEAM_COMP } from '../lib/config';
import { getPlayerInfo } from '../lib/game-engine';
import type { GameState } from '../lib/types';

// 시드로부터 역할을 재계산 (폰에서 독립적으로)
function rebuildState(seed: string, playerNames: string[], enabledRoles: SpecialRole[]): GameState | null {
  // game-engine의 startGame과 동일한 로직을 시드 기반으로 재현
  const count = playerNames.length;
  const comp = TEAM_COMP[count];
  if (!comp) return null;

  const rng = seedrandom(seed);
  const shuffledIndices: number[] = Array.from({ length: count }, (_, i) => i);
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
  }

  const players: Player[] = playerNames.map((name, i) => ({
    id: `p${i}`, name, team: 'witness' as Team, specialRole: null,
  }));

  const agentIndices = shuffledIndices.slice(0, comp.agent);
  const witnessIndices = shuffledIndices.slice(comp.agent);

  for (const i of agentIndices) players[i] = { ...players[i], team: 'agent' };
  for (const i of witnessIndices) players[i] = { ...players[i], team: 'witness' };

  const witnessSpecials: SpecialRole[] = [];
  const agentSpecials: SpecialRole[] = [];
  if (enabledRoles.includes('overseer')) witnessSpecials.push('overseer');
  if (enabledRoles.includes('elder')) witnessSpecials.push('elder');
  if (enabledRoles.includes('commander')) agentSpecials.push('commander');
  if (enabledRoles.includes('cleric')) agentSpecials.push('cleric');
  if (enabledRoles.includes('apostate')) agentSpecials.push('apostate');

  const shuffleArr = (arr: number[]) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const sw = shuffleArr(witnessIndices);
  const sa = shuffleArr(agentIndices);

  for (let i = 0; i < witnessSpecials.length && i < sw.length; i++) {
    players[sw[i]] = { ...players[sw[i]], specialRole: witnessSpecials[i] };
  }
  for (let i = 0; i < agentSpecials.length && i < sa.length; i++) {
    players[sa[i]] = { ...players[sa[i]], specialRole: agentSpecials[i] };
  }

  return {
    phase: 'role-reveal', players, missions: [], currentRound: 0,
    currentLeaderIndex: 0, consecutiveRejects: 0, witnessWins: 0, agentWins: 0,
    winner: null, winReason: null, assassinTarget: null, seed, roleRevealEndAt: null,
    enabledRoles,
  };
}

const TEAM_COLOR = { witness: 'bg-blue-600', agent: 'bg-red-600' };
const ROLE_NAMES: Record<Lang, Record<string, string>> = {
  ko: { overseer: '순회감독자', elder: '장로', commander: '당간부', cleric: '교직자', apostate: '배교자' },
  en: { overseer: 'Overseer', elder: 'Elder', commander: 'Commander', cleric: 'Cleric', apostate: 'Apostate' },
  zh: { overseer: '巡回监督', elder: '长老', commander: '指挥官', cleric: '教职者', apostate: '叛教者' },
};
const TEAM_NAMES: Record<Lang, Record<Team, string>> = {
  ko: { witness: '증인', agent: '공안' },
  en: { witness: 'Witness', agent: 'Agent' },
  zh: { witness: '见证人', agent: '公安' },
};

export default function PlayerRoleCard() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [info, setInfo] = useState<string[]>([]);
  const [lang, setLang] = useState<Lang>('ko');
  const [step, setStep] = useState<'loading' | 'card'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    const namesStr = params.get('names');
    const rolesStr = params.get('roles');
    const pIdx = params.get('player');
    const l = params.get('lang') as Lang | null;

    if (l && ['ko', 'en', 'zh'].includes(l)) setLang(l);

    if (seed && namesStr && pIdx) {
      const names = JSON.parse(decodeURIComponent(namesStr));
      const roles = rolesStr ? JSON.parse(decodeURIComponent(rolesStr)) as SpecialRole[] : [];
      const state = rebuildState(seed, names, roles);
      if (state) {
        const idx = parseInt(pIdx, 10);
        const p = state.players[idx];
        setPlayer(p);
        setInfo(getPlayerInfo(state, p.id));
        setStep('card');
      }
    }
  }, []);

  if (step === 'loading' || !player) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-100">
        <p className="text-stone-500">QR코드를 스캔해주세요.</p>
      </div>
    );
  }

  const bg = TEAM_COLOR[player.team];
  const teamName = TEAM_NAMES[lang][player.team];
  const roleName = player.specialRole ? ROLE_NAMES[lang][player.specialRole] : null;

  return (
    <div className={`min-h-dvh flex flex-col items-center justify-center ${bg} p-6`}>
      <div className="text-6xl mb-4">{player.team === 'witness' ? '📖' : '🔴'}</div>

      <div className="bg-white/20 rounded-2xl p-6 text-center max-w-xs w-full">
        <p className="text-white/70 text-sm mb-1">{player.name}</p>
        <h1 className="text-3xl font-black text-white mb-2">{teamName}</h1>
        {roleName && (
          <h2 className="text-xl font-bold text-white/90 mb-4">{roleName}</h2>
        )}

        {info.length > 0 && (
          <div className="mt-4 border-t border-white/20 pt-4">
            {info.map((line, i) => (
              <p key={i} className="text-white/80 text-sm mb-1">{line}</p>
            ))}
          </div>
        )}
      </div>

      <p className="text-white/50 text-xs mt-6">이 화면을 다른 사람에게 보여주지 마세요!</p>
    </div>
  );
}
