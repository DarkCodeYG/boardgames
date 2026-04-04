import type { GameState } from '../lib/types';
import Card from './Card';

interface BoardProps {
  game: GameState;
  isSpymasterView: boolean;
  onSelectCard: (id: number) => void;
}

export default function Board({ game, isSpymasterView, onSelectCard }: BoardProps) {
  const canGuess = game.phase === 'playing' && game.turn.phase === 'guessing' && !isSpymasterView;

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3 p-2 sm:p-4 max-w-2xl mx-auto">
      {game.board.map((card) => (
        <Card
          key={card.id}
          card={card}
          isSpymasterView={isSpymasterView}
          onSelect={onSelectCard}
          disabled={!canGuess}
        />
      ))}
    </div>
  );
}
