// Standard encoding: id = attr1*27 + attr2*9 + attr3*3 + attr4  (81 cards)
// attr1=count(0→1,1→2,2→3), attr2=color(0=red,1=green,2=purple),
// attr3=shape(0=diamond,1=circle,2=triangle), attr4=fill(0=solid,1=striped,2=open)
export function cardAttrs(id: number): [number, number, number, number] {
  return [Math.floor(id / 27), Math.floor((id % 27) / 9), Math.floor((id % 9) / 3), id % 3];
}

export function isValidSet(a: number, b: number, c: number): boolean {
  const as = cardAttrs(a);
  const bs = cardAttrs(b);
  const cs = cardAttrs(c);
  const ok = (x: number, y: number, z: number) =>
    (x === y && y === z) || (x !== y && y !== z && x !== z);
  return ok(as[0], bs[0], cs[0]) && ok(as[1], bs[1], cs[1]) &&
         ok(as[2], bs[2], cs[2]) && ok(as[3], bs[3], cs[3]);
}

export function findAnySet(cards: number[]): [number, number, number] | null {
  for (let i = 0; i < cards.length - 2; i++)
    for (let j = i + 1; j < cards.length - 1; j++)
      for (let k = j + 1; k < cards.length; k++)
        if (isValidSet(cards[i], cards[j], cards[k])) return [cards[i], cards[j], cards[k]];
  return null;
}

// Genius encoding: id = shapeColor*27 + bgColor*9 + shape*3 + fillType  (81 cards)
// shapeColor(0=blue,1=red,2=yellow), bgColor(0=white,1=gray,2=black), shape(0=circle,1=triangle,2=square), fillType(0=solid,1=outline,2=striped)
export function geniusCardAttrs(id: number): [number, number, number, number] {
  return [Math.floor(id / 27), Math.floor((id % 27) / 9), Math.floor((id % 9) / 3), id % 3];
}

export function isValidGeniusSet(a: number, b: number, c: number): boolean {
  const as = geniusCardAttrs(a);
  const bs = geniusCardAttrs(b);
  const cs = geniusCardAttrs(c);
  const ok = (x: number, y: number, z: number) =>
    (x === y && y === z) || (x !== y && y !== z && x !== z);
  return ok(as[0], bs[0], cs[0]) && ok(as[1], bs[1], cs[1]) && ok(as[2], bs[2], cs[2]) && ok(as[3], bs[3], cs[3]);
}

export function findAnyGeniusSet(cards: number[]): [number, number, number] | null {
  for (let i = 0; i < cards.length - 2; i++)
    for (let j = i + 1; j < cards.length - 1; j++)
      for (let k = j + 1; k < cards.length; k++)
        if (isValidGeniusSet(cards[i], cards[j], cards[k])) return [cards[i], cards[j], cards[k]];
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
  return { tableCards: shuffled.slice(0, 12), deckCards: shuffled.slice(12) };
}

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
