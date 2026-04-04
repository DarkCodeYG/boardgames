import { create } from 'zustand';
import type { GameState, SpecialRole } from '../lib/types';
import {
  createGame, addPlayer, startGame,
  endRoleReveal, selectTeam, submitVote, proceedAfterVote, submitMissionCard,
  nextRound, assassinate,
} from '../lib/game-engine';

interface WitnessesStore {
  game: GameState | null;
  playerNames: string[];

  setPlayerNames: (names: string[]) => void;
  newGame: (enabledRoles: SpecialRole[]) => void;
  initAndStart: (names: string[], enabledRoles: SpecialRole[]) => void;
  endReveal: () => void;
  selectTeam: (teamIds: string[]) => void;
  proceedAfterVote: () => void;
  submitVote: (playerId: string, approve: boolean) => void;
  submitMission: (playerId: string, success: boolean) => void;
  nextRound: () => void;
  assassinate: (targetId: string) => void;
  reset: () => void;
}

export const useWitnessesStore = create<WitnessesStore>((set) => ({
  game: null,
  playerNames: [],

  setPlayerNames: (names) => set({ playerNames: names }),

  newGame: (enabledRoles) => set({ game: createGame(enabledRoles) }),

  initAndStart: (names, enabledRoles) => {
    let game = createGame(enabledRoles);
    for (const name of names) {
      game = addPlayer(game, name);
    }
    game = startGame(game);
    set({ game, playerNames: names });
  },

  endReveal: () => set((s) => s.game ? { game: endRoleReveal(s.game) } : s),

  selectTeam: (teamIds) => set((s) => s.game ? { game: selectTeam(s.game, teamIds) } : s),

  proceedAfterVote: () => set((s) => s.game ? { game: proceedAfterVote(s.game) } : s),

  submitVote: (playerId, approve) =>
    set((s) => s.game ? { game: submitVote(s.game, playerId, approve) } : s),

  submitMission: (playerId, success) =>
    set((s) => s.game ? { game: submitMissionCard(s.game, playerId, success) } : s),

  nextRound: () => set((s) => s.game ? { game: nextRound(s.game) } : s),

  assassinate: (targetId) =>
    set((s) => s.game ? { game: assassinate(s.game, targetId) } : s),

  reset: () => set({ game: null, playerNames: [] }),
}));
