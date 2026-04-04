export type Team = 'witness' | 'agent';
export type GamePhase =
  | 'lobby'         // 이름 입력 대기
  | 'role-reveal'   // 30초 카드 확인
  | 'team-build'    // 인도자가 팀 구성
  | 'vote'          // 찬반 투표
  | 'vote-result'   // 투표 결과 표시
  | 'mission'       // 봉사 성공/실패 제출
  | 'mission-result' // 결과 공개
  | 'assassinate'   // 당간부 순감 지목
  | 'finished';

export type SpecialRole =
  | 'overseer'      // 순회감독자 (증인) - 공안을 알 수 있음 (배교자 제외)
  | 'elder'         // 장로 (증인) - 순감+교직자 이름은 알지만 누가 누군지 모름
  | 'commander'     // 당간부 (공안) - 순감 지목 기회
  | 'cleric'        // 교직자 (공안) - 장로에게 순감처럼 보임
  | 'apostate'      // 배교자 (공안) - 순감에게 안 보임
  | null;

export interface Player {
  id: string;
  name: string;
  team: Team;
  specialRole: SpecialRole;
}

export interface Mission {
  round: number;         // 1~5
  requiredSize: number;  // 필요 인원
  needsTwoFails: boolean; // true면 실패 2개 이상이어야 실패
  leaderId: string;      // 인도자
  teamIds: string[];     // 선택된 팀원
  votes: Record<string, boolean>;   // playerId → approve/reject
  approved: boolean | null;
  submissions: Record<string, boolean>; // playerId → success/fail
  result: 'success' | 'fail' | null;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  missions: Mission[];
  currentRound: number;          // 0-indexed (0~4)
  currentLeaderIndex: number;    // players 배열 인덱스
  consecutiveRejects: number;    // 연속 부결 횟수
  witnessWins: number;
  agentWins: number;
  winner: Team | null;
  winReason: string | null;
  assassinTarget: string | null; // 당간부가 지목한 대상
  seed: string;
  roleRevealEndAt: number | null;
  enabledRoles: SpecialRole[];   // 포함된 특수 직분
  commanderIsAlsoCleric: boolean; // 공안 2명일 때 당간부=교직자 겸임
}
