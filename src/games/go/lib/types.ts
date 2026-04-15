export type Player = 'black' | 'white';
export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Cell = Player | null;
export type Board = Cell[][];
export type BoardSize = 9 | 13 | 19;

export interface GoState {
  board: Board;
  boardSize: BoardSize;
  currentPlayer: Player;
  moveCount: number;
  /** 각 플레이어가 따낸 상대 돌 수 */
  captures: { black: number; white: number };
  /** 마지막 착점 (기보 마커 표시용) */
  lastMove: [number, number] | null;
  winner: Player | null;
  winReason: 'resign' | 'timeout' | 'score' | null;
  /** 게임 종료 후 집계산 결과 (Chinese counting) */
  score: { black: number; white: number } | null;
  /** 연속 패스 횟수 (2회 연속 = 게임 종료) */
  consecutivePasses: number;
  /** 코(패) 규칙 체크용 — 직전 보드 상태 */
  prevBoard: Board | null;
  /** 코미: 백에게 주는 보정 점수 (기본 6.5) */
  komi: number;
}
