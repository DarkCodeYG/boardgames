import seedrandom from 'seedrandom';
import type { Card, CardType, GameState, Team } from './types';
import type { Lang } from './i18n';
import { getWords, type WordPack } from './words';

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createBoard(seed: string, lang: Lang = 'ko', pack: WordPack = 'standard'): { board: Card[]; startingTeam: Team } {
  const rng = seedrandom(seed);

  const words = getWords(lang, pack);
  if (words.length < 25) throw new Error(`Not enough words: ${words.length} < 25`);
  const shuffledWords = shuffle(words, rng);
  const selectedWords = shuffledWords.slice(0, 25);

  const startingTeam: Team = rng() > 0.5 ? 'red' : 'blue';
  const otherTeam: Team = startingTeam === 'red' ? 'blue' : 'red';

  const types: CardType[] = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(otherTeam),
    ...Array(7).fill('neutral' as CardType),
    'assassin',
  ];
  const shuffledTypes = shuffle(types, rng);

  const board: Card[] = selectedWords.map((word, i) => ({
    id: i,
    word,
    type: shuffledTypes[i],
    revealed: false,
  }));

  return { board, startingTeam };
}

export function createGame(existingSeed?: string, lang: Lang = 'ko', pack: WordPack = 'standard'): GameState {
  const seed = existingSeed ?? generateSeed();
  const { board, startingTeam } = createBoard(seed, lang, pack);

  return {
    board,
    currentTeam: startingTeam,
    phase: 'setup',
    startingTeam,
    score: { red: 0, blue: 0 },
    target: {
      [startingTeam]: 9,
      [startingTeam === 'red' ? 'blue' : 'red']: 8,
    } as Record<Team, number>,
    winner: null,
    winReason: null,
    seed,
  };
}

export function startGame(state: GameState): GameState {
  return { ...state, phase: 'playing' };
}

function switchTurn(state: GameState): GameState {
  return {
    ...state,
    currentTeam: state.currentTeam === 'red' ? 'blue' : 'red',
  };
}

function endGame(state: GameState, winner: Team, reason: 'all_found' | 'assassin'): GameState {
  return {
    ...state,
    phase: 'finished',
    winner,
    winReason: reason,
  };
}

export function revealCard(state: GameState, cardId: number): GameState {
  if (state.phase !== 'playing') return state;

  const card = state.board[cardId];
  if (!card || card.revealed) return state;

  const newBoard = state.board.map((c, i) =>
    i === cardId ? { ...c, revealed: true } : c
  );

  const newScore = { ...state.score };
  if (card.type === 'red' || card.type === 'blue') {
    newScore[card.type]++;
  }

  const newState: GameState = { ...state, board: newBoard, score: newScore };

  if (card.type === 'assassin') {
    const opponent: Team = state.currentTeam === 'red' ? 'blue' : 'red';
    return endGame(newState, opponent, 'assassin');
  }

  if (newScore.red === newState.target.red) {
    return endGame(newState, 'red', 'all_found');
  }
  if (newScore.blue === newState.target.blue) {
    return endGame(newState, 'blue', 'all_found');
  }

  if (card.type === state.currentTeam) {
    return newState;
  }

  return switchTurn(newState);
}

export function endTurnEarly(state: GameState): GameState {
  if (state.phase !== 'playing') return state;
  return switchTurn(state);
}
