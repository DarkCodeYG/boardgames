// ======================================================
// 프로젝트 공통 색상 팔레트 (중앙화)
// 각 게임 컴포넌트에서 직접 색상 문자열을 쓰지 않고 여기서 import해서 사용
// ======================================================

// ── Codenames 카드 색상 ──────────────────────────────────
export const CODENAMES_COLOR_MAP = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  neutral: 'bg-amber-100 text-amber-900',
  assassin: 'bg-gray-900 text-white',
} as const;

export const CODENAMES_INVERTED_TEXT = {
  red: 'text-red-200/50',
  blue: 'text-blue-200/50',
  neutral: 'text-amber-700/30',
  assassin: 'text-gray-500/50',
} as const;

export const CODENAMES_DIVIDER = {
  red: 'bg-red-300/30',
  blue: 'bg-blue-300/30',
  neutral: 'bg-amber-600/20',
  assassin: 'bg-gray-600/30',
} as const;

export const CODENAMES_SPYMASTER_BORDER = {
  red: 'ring-4 ring-red-400',
  blue: 'ring-4 ring-blue-400',
  neutral: 'ring-4 ring-amber-300',
  assassin: 'ring-4 ring-gray-700',
} as const;

// ── Set 카드 색상 ────────────────────────────────────────
// Standard 모드: red / green / purple (hex, SVG fill용)
export const SET_STD_COLORS = ['#ef4444', '#22c55e', '#a855f7'] as const;

// Genius 모드: 도형 색상 (파랑, 빨강, 노랑)
export const SET_GENIUS_SHAPE_COLORS = ['#2a74d1', '#bf3030', '#d4a800'] as const;

// Genius 모드: 배경 색상 (흰색, 회색, 검정)
export const SET_GENIUS_BG_COLORS = ['#f0f0f0', '#787878', '#1e1e1e'] as const;

// Set 카드 선택/정답 상태 (Tailwind 클래스)
export const SET_CARD_BORDER = {
  default: 'border-2 border-stone-200',
  selected: 'border-4 border-blue-500 ring-2 ring-blue-300',
  correct: 'border-4 border-green-500 ring-2 ring-green-300',
} as const;

// ── 공통 UI 상태 색상 ─────────────────────────────────────
export const STATE_COLORS = {
  primary: 'bg-stone-800 text-white hover:bg-stone-700',
  secondary: 'bg-stone-200 text-stone-700 hover:bg-stone-300',
  danger: 'bg-red-500 text-white hover:bg-red-400',
  warning: 'bg-amber-500 text-white hover:bg-amber-400',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
} as const;
