import seedrandom from 'seedrandom';
import type { Card, CardType, Clue, GameState, Team } from './types';
import { WORDS_KO } from './words-ko';

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

export function createBoard(seed: string): { board: Card[]; startingTeam: Team } {
  const rng = seedrandom(seed);

  // 단어 25개 선택
  const shuffledWords = shuffle(WORDS_KO, rng);
  const selectedWords = shuffledWords.slice(0, 25);

  // 선공 팀 결정 (선공 9장, 후공 8장)
  const startingTeam: Team = rng() > 0.5 ? 'red' : 'blue';
  const otherTeam: Team = startingTeam === 'red' ? 'blue' : 'red';

  // 색상 배정: 선공 9, 후공 8, 중립 7, 암살자 1
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

export function createGame(existingSeed?: string): GameState {
  const seed = existingSeed ?? generateSeed();
  const { board, startingTeam } = createBoard(seed);

  return {
    board,
    turn: {
      team: startingTeam,
      phase: 'giving_clue',
      clue: null,
      guessesRemaining: 0,
      guessesMade: 0,
    },
    phase: 'setup',
    startingTeam,
    score: { red: 0, blue: 0 },
    target: {
      [startingTeam]: 9,
      [startingTeam === 'red' ? 'blue' : 'red']: 8,
    } as Record<Team, number>,
    winner: null,
    winReason: null,
    clueHistory: [],
    seed,
  };
}

export function startGame(state: GameState): GameState {
  return { ...state, phase: 'playing' };
}

export function giveClue(state: GameState, word: string, count: number): GameState {
  if (state.phase !== 'playing') return state;
  if (state.turn.phase !== 'giving_clue') return state;

  const clue: Clue = { word, count, team: state.turn.team };

  return {
    ...state,
    turn: {
      ...state.turn,
      phase: 'guessing',
      clue,
      guessesRemaining: count === 0 ? 25 : count + 1, // 0 = 무제한
      guessesMade: 0,
    },
    clueHistory: [...state.clueHistory, clue],
  };
}

function switchTurn(state: GameState): GameState {
  const nextTeam: Team = state.turn.team === 'red' ? 'blue' : 'red';
  return {
    ...state,
    turn: {
      team: nextTeam,
      phase: 'giving_clue',
      clue: null,
      guessesRemaining: 0,
      guessesMade: 0,
    },
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
  if (state.turn.phase !== 'guessing') return state;

  const card = state.board[cardId];
  if (!card || card.revealed) return state;

  // 카드 공개
  const newBoard = state.board.map((c, i) =>
    i === cardId ? { ...c, revealed: true } : c
  );

  const newScore = { ...state.score };
  if (card.type === 'red' || card.type === 'blue') {
    newScore[card.type]++;
  }

  let newState: GameState = { ...state, board: newBoard, score: newScore };

  // 암살자 → 현재 팀 패배
  if (card.type === 'assassin') {
    const opponent: Team = state.turn.team === 'red' ? 'blue' : 'red';
    return endGame(newState, opponent, 'assassin');
  }

  // 한 팀의 카드를 모두 찾았는지 확인
  if (newScore.red === newState.target.red) {
    return endGame(newState, 'red', 'all_found');
  }
  if (newScore.blue === newState.target.blue) {
    return endGame(newState, 'blue', 'all_found');
  }

  // 자기 팀 카드 맞춤
  if (card.type === state.turn.team) {
    const remaining = state.turn.guessesRemaining - 1;
    if (remaining <= 0) {
      return switchTurn(newState);
    }
    return {
      ...newState,
      turn: {
        ...state.turn,
        guessesRemaining: remaining,
        guessesMade: state.turn.guessesMade + 1,
      },
    };
  }

  // 상대 팀 카드 또는 중립 → 턴 종료
  return switchTurn(newState);
}

export function endTurnEarly(state: GameState): GameState {
  if (state.phase !== 'playing') return state;
  if (state.turn.phase !== 'guessing') return state;
  return switchTurn(state);
}
