import { useGameStore } from '../store/game-store';

interface HomePageProps {
  onStartGame: () => void;
}

export default function HomePage({ onStartGame }: HomePageProps) {
  const newGame = useGameStore((s) => s.newGame);

  const handleStart = () => {
    newGame();
    onStartGame();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-stone-800 mb-2">
          🕵️ 코드네임
        </h1>
        <p className="text-stone-500 text-lg mb-8">
          단서를 주고, 요원을 찾아라!
        </p>

        <button
          onClick={handleStart}
          className="w-full bg-stone-800 text-white text-xl font-bold
                     py-4 px-8 rounded-2xl shadow-lg
                     hover:bg-stone-700 active:scale-95 transition-all"
        >
          새 게임 시작
        </button>

        <div className="mt-8 text-left bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-stone-700 mb-3">📋 게임 방법</h3>
          <ol className="text-sm text-stone-500 space-y-2">
            <li><strong>1.</strong> 두 팀(🔴 RED / 🔵 BLUE)으로 나눕니다</li>
            <li><strong>2.</strong> 각 팀의 팀장이 QR코드를 스캔하여 답안을 확인합니다</li>
            <li><strong>3.</strong> 팀장이 단서(단어 + 숫자)를 제출합니다</li>
            <li><strong>4.</strong> 팀원들이 카드를 선택하여 요원을 찾습니다</li>
            <li><strong>5.</strong> 모든 요원을 먼저 찾는 팀이 승리! 💀 암살자 주의!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
