/** WorkerToken — Phase 1 구현 예정 */

interface WorkerTokenProps {
  playerColor: 'red' | 'blue' | 'green' | 'yellow';
  size?: 'sm' | 'md';
}

const COLOR_MAP = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-600',
  yellow: 'bg-yellow-400',
} as const;

export default function WorkerToken({ playerColor, size = 'md' }: WorkerTokenProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div
      className={`${sizeClass} ${COLOR_MAP[playerColor]} rounded-full border-2 border-white shadow`}
      aria-hidden="true"
    />
  );
}
