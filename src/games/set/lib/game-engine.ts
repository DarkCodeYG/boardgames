// Card encoding: id = attr1*9 + attr2*3 + attr3
// Standard theme: attr1=count(1-3), attr2=color(0=red,1=green,2=purple), attr3=shape(0=diamond,1=circle,2=triangle)
// Genius theme:   attr1=innerColor(0=red,1=green,2=blue), attr2=outerColor(0=yellow,1=purple,2=orange), attr3=shape(0=triangle,1=circle,2=square)

export function cardAttrs(id: number): [number, number, number] {
  return [Math.floor(id / 9), Math.floor((id % 9) / 3), id % 3];
}

export function isValidSet(a: number, b: number, c: number): boolean {
  const [a1, a2, a3] = cardAttrs(a);
  const [b1, b2, b3] = cardAttrs(b);
  const [c1, c2, c3] = cardAttrs(c);
  const allSameOrAllDiff = (x: number, y: number, z: number) =>
    (x === y && y === z) || (x !== y && y !== z && x !== z);
  return allSameOrAllDiff(a1, b1, c1) && allSameOrAllDiff(a2, b2, c2) && allSameOrAllDiff(a3, b3, c3);
}

export function findAnySet(cards: number[]): [number, number, number] | null {
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          return [cards[i], cards[j], cards[k]];
        }
      }
    }
  }
  return null;
}

export function shuffleWithSeed(cards: number[], seed: string): number[] {
  const shuffled = [...cards];
  let h = 0;
  for (const c of seed) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealInitialCards(shuffled: number[]): { tableCards: number[]; deckCards: number[] } {
  let tableCards = shuffled.slice(0, 12);
  let deckCards = shuffled.slice(12);
  // Ensure at least one set exists on the table
  while (findAnySet(tableCards) === null && deckCards.length >= 3) {
    tableCards = [...tableCards, ...deckCards.slice(0, 3)];
    deckCards = deckCards.slice(3);
  }
  return { tableCards, deckCards };
}

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
