// 팀 구성표
export const TEAM_COMP: Record<number, { witness: number; agent: number }> = {
  5:  { witness: 3, agent: 2 },
  6:  { witness: 4, agent: 2 },
  7:  { witness: 4, agent: 3 },
  8:  { witness: 5, agent: 3 },
  9:  { witness: 6, agent: 3 },
  10: { witness: 6, agent: 4 },
  11: { witness: 7, agent: 4 },
  12: { witness: 7, agent: 5 },
};

// 구역별 팀 인원 수
export const MISSION_SIZE: Record<number, number[]> = {
  // [구역1, 구역2, 구역3, 구역4, 구역5]
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
  11: [3, 4, 4, 5, 5],
  12: [3, 4, 4, 5, 5],
};

// 4번 구역(인덱스 3)에서 실패 2개 필요한 최소 인원
export const TWO_FAILS_MIN_PLAYERS = 7;

// 역할 확인 시간 (초)
export const ROLE_REVEAL_SECONDS = 30;

// 연속 부결 시 공안 승리 기준
export const MAX_CONSECUTIVE_REJECTS = 5;
