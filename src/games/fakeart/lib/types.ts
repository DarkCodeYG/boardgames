export type Lang = 'ko' | 'en' | 'zh';
export type Pack = 'standard' | 'jw';
export type GamePhase = 'lobby' | 'roles' | 'drawing' | 'voting' | 'guess' | 'result';

export interface Topic {
  category: { ko: string; en: string; zh: string };
  word: { ko: string; en: string; zh: string };
}

export interface PlayerInfo {
  index: number;
  joinedAt: number;
}

export interface RoomState {
  phase: GamePhase;
  seed: string;
  pack: Pack;
  lang: Lang;
  drawTime: number;
  players: Record<string, PlayerInfo>;   // name → { index, joinedAt }
  playerCount: number;                    // 게임 시작 시 freeze
  currentDrawerIndex: number;
  votes: Record<string, number>;         // voterIndex(string) → accusedIndex(number)
  fakeGuess: string;
  winner: 'fake' | 'others' | null;
}
