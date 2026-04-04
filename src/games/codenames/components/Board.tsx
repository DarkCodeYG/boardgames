import type { GameState } from '../lib/types';
import type { Lang } from '../lib/i18n';
import Card from './Card';

interface BoardProps {
  game: GameState;
  isSpymasterView: boolean;
  onSelectCard: (id: number) => void;
  lang?: Lang;
}

export default function Board({ game, isSpymasterView, onSelectCard, lang }: BoardProps) {
  const canGuess = game.phase === 'playing' && !isSpymasterView;

  return (
    <div className="flex-1 grid grid-cols-5 grid-rows-5 gap-1.5 sm:gap-2 p-1.5 sm:p-2">
      {game.board.map((card) => (
        <Card
          key={card.id}
          card={card}
          isSpymasterView={isSpymasterView}
          onSelect={onSelectCard}
          disabled={!canGuess}
          lang={lang}
        />
      ))}
    </div>
  );
}
