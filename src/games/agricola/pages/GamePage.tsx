/**
 * 아그리콜라 게임 페이지 — 메인 게임 화면
 * Phase 2: 카드 패 + 카드 플레이 연동
 */

import { useState, useEffect, useRef } from 'react';
import { useAgricolaStore } from '../store/game-store.js';
import FarmBoard from '../components/FarmBoard.js';
import ActionBoard from '../components/ActionBoard.js';
import ResourcePanel from '../components/ResourcePanel.js';
import CardHand from '../components/CardHand.js';
import CardDetail from '../components/CardDetail.js';
import HarvestModal from '../components/HarvestModal.js';
import ScoreBoard from '../components/ScoreBoard.js';
import CookAnimalModal from '../components/CookAnimalModal.js';
import AnimalOverflowModal from '../components/AnimalOverflowModal.js';
import {
  isHarvestRound,
  placeWorker,
  startRound,
  replenishActionSpaces,
  returnWorkers,
  harvestFields,
  feedFamilyForPlayer,
  bakeBreadForPlayer,
  breedAnimalsForPlayer,
  buildFences,
  plowField,
  sowField,
  growFamily,
  renovateHouse,
  buildRoom,
  buildStable,
  getAnimalFromMarket,
  addResources,
  buildMajorImprovement,
  placeAnimalForPlayer,
  replaceAnimalAtLocation,
  hasCookingFacility,
  findAnimalSources,
  cookAnimal,
  type AnimalSource,
} from '../lib/game-engine.js';
import { ANIMAL_TO_FOOD_RATES } from '../lib/cards/major-improvements.js';
import { hasAnimalPlacement } from '../lib/farm-engine.js';
import { playCard, canPlayCard, getOccupationPlayCost } from '../lib/card-engine.js';
import type { AnimalType, Card } from '../lib/types.js';
import type { GameState } from '../lib/types.js';
import {
  sfxStonePlace, sfxCardFlip, sfxCorrect, sfxWrong,
  sfxToggle, sfxClick, sfxGameStart, sfxTurnEnd, sfxTurnOver,
  sfxModalOpen, sfxModalClose, sfxVictory,
} from '../../../lib/sound.js';

interface GamePageProps {
  onExit: () => void;
}

const PLAYER_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  red:    { bg: 'bg-red-100',    ring: 'ring-red-400',    text: 'text-red-700' },
  blue:   { bg: 'bg-blue-100',   ring: 'ring-blue-400',   text: 'text-blue-700' },
  green:  { bg: 'bg-green-100',  ring: 'ring-green-400',  text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-100', ring: 'ring-yellow-400', text: 'text-yellow-700' },
};

const WORKER_DOT_COLORS: Record<string, string> = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
};

/** 커서에 붙는 플로팅 디스크 색상 */
const FLOATING_DISC: Record<string, string> = {
  red:    'bg-red-500 border-red-700',
  blue:   'bg-blue-500 border-blue-700',
  green:  'bg-green-500 border-green-700',
  yellow: 'bg-yellow-400 border-yellow-600',
};

const PENDING_LABELS: Record<string, string> = {
  pending_plow:                  '밭 갈기 — 빈 셀을 클릭하세요',
  pending_sow:                   '씨 뿌리기 — 밭을 클릭하세요 (곡식/채소 자동 선택)',
  pending_plow_sow:              '밭 갈고 씨 뿌리기 — 먼저 빈 셀을 클릭하세요',
  pending_build_room:            '방 건설 — 기존 방에 인접한 빈 셀을 클릭하세요 (재료5+갈대2)',
  pending_build_stable:          '외양간 건설 — 빈 셀을 클릭하세요 (나무 2)',
  pending_renovate:              '집 개조 — 확인 버튼을 누르세요 (자원 자동 차감)',
  pending_renovate_fence:        '집 개조 + 울타리 — 확인 버튼을 누르세요',
  pending_family_growth:         '가족 늘리기 (빈 방 필요) — 확인 버튼을 누르세요',
  pending_family_growth_urgent:  '가족 늘리기 (방 없어도 가능) — 확인 버튼을 누르세요',
  pending_animal_choice:         '동물 배치 — 확인 버튼을 누르세요',
};

/** 자원 한국어 이름 */
const KO_RES: Record<string, string> = {
  wood: '나무', clay: '흙', stone: '돌', reed: '갈대',
  grain: '곡식', vegetable: '채소', food: '음식',
  sheep: '양', boar: '멧돼지', cattle: '소',
};

function advanceToNextPlayer(state: GameState): GameState {
  const n = state.playerOrder.length;
  for (let i = 1; i <= n; i++) {
    const nextIdx = (state.currentPlayerIndex + i) % n;
    const pid = state.playerOrder[nextIdx] ?? '';
    const placed = countPlaced(state, pid);
    const player = state.players[pid];
    if (player && placed < player.familySize) {
      return { ...state, currentPlayerIndex: nextIdx };
    }
  }
  return state;
}

function countPlaced(state: GameState, pid: string): number {
  return (
    Object.values(state.actionSpaces).filter((s) => s.workerId === pid).length +
    state.revealedRoundCards.filter((rc) => rc.workerId === pid).length
  );
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GamePage({ onExit }: GamePageProps) {
  const { gameState, setGameState } = useAgricolaStore();

  // 농장판 접기 상태: 접힌 플레이어 ID 집합 (기본 전체 표시)
  const [collapsedFarms, setCollapsedFarms] = useState<Set<string>>(new Set());

  // 바둑 방식 가족 말 배치: 선택된 가족 구성원 셀 좌표
  const [selectedFamilyCell, setSelectedFamilyCell] = useState<[number, number] | null>(null);

  // 플로팅 디스크 커서 위치
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 });

  // Undo 스택 (마지막 액션 이전 state 보관)
  const [history, setHistory] = useState<GameState[]>([]);

  // 카드 상세 모달
  const [detailCard, setDetailCard] = useState<Card | null>(null);

  // 수확: 현재 처리 중인 플레이어 인덱스 (null=수확 단계 아님)
  const [harvestPlayerIdx, setHarvestPlayerIdx] = useState<number | null>(null);

  // 울타리 건설: 선택된 세그먼트
  const [pendingFenceSegments, setPendingFenceSegments] = useState<Array<{ type: 'h' | 'v'; row: number; col: number }>>([]);

  // 가축 배치: 시장에서 가져온 동물 종 (null=배치 완료)
  const [pendingAnimalPlacement, setPendingAnimalPlacement] = useState<AnimalType | null>(null);
  // 가축 교체 모드: 기존 동물 제거하여 새 동물 배치
  const [animalRemovalMode, setAnimalRemovalMode] = useState<boolean>(false);
  // 배치 공간 부족 시 선택 모달 (교체/요리/버림)
  const [overflowChoice, setOverflowChoice] = useState<AnimalType | null>(null);
  // 요리 모달 (열려있는 플레이어 ID)
  const [cookingPlayerId, setCookingPlayerId] = useState<string | null>(null);

  // 라운드 종료 카운트다운 (초, null=비활성)
  const [countdownSec, setCountdownSec] = useState<number | null>(null);

  // 주요 설비 패널 표시
  const [showMajorImpPanel, setShowMajorImpPanel] = useState(false);

  // 카운트다운 자동 종료 ref (stale closure 방지)
  const autoEndRoundRef = useRef<() => void>(() => {});

  // 플레이어별 누적 소요 시간 (초)
  const [playerTimers, setPlayerTimers] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!gameState) {
    return <div className="p-8 text-center">게임 상태 없음</div>;
  }

  const gs: GameState = gameState;

  const currentPlayerId = gs.playerOrder[gs.currentPlayerIndex] ?? '';
  const currentPlayer = gs.players[currentPlayerId];
  const isGameOver = gs.phase === 'gameover';

  const allWorkersPlaced =
    gs.roundPhase === 'work' &&
    gs.playerOrder.every((pid) => {
      const p = gs.players[pid];
      return p && countPlaced(gs, pid) >= p.familySize;
    });

  const pendingLabel = PENDING_LABELS[gs.roundPhase];

  // 플로팅 디스크: 가족 구성원 선택 시 커서 추적
  useEffect(() => {
    if (!selectedFamilyCell) {
      setCursorPos({ x: -200, y: -200 });
      return;
    }
    function onMouseMove(e: MouseEvent) {
      setCursorPos({ x: e.clientX, y: e.clientY });
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) setCursorPos({ x: t.clientX, y: t.clientY });
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedFamilyCell(null);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedFamilyCell]);

  // 타이머: 현재 플레이어의 생각 시간 측정
  useEffect(() => {
    if (gs.phase !== 'playing' || allWorkersPlaced) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setPlayerTimers((prev) => ({
        ...prev,
        [currentPlayerId]: (prev[currentPlayerId] ?? 0) + 1,
      }));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentPlayerId, gs.phase, allWorkersPlaced]);

  // 카운트다운: 모든 일꾼 배치 완료 시 10초 후 자동 라운드 종료
  useEffect(() => {
    if (!allWorkersPlaced || gs.phase !== 'playing' || harvestPlayerIdx !== null) {
      setCountdownSec(null);
      return;
    }
    let remaining = 10;
    let cancelled = false;
    setCountdownSec(remaining);
    const id = setInterval(() => {
      if (cancelled) return;
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(id);
        setCountdownSec(null);
        autoEndRoundRef.current();
      } else {
        setCountdownSec(remaining);
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWorkersPlaced, gs.phase, harvestPlayerIdx]);


  // ── Undo 래퍼: 주요 액션 전 현재 state 보존 ────────────────────
  function saveAndSet(newState: GameState) {
    setHistory((prev) => [...prev.slice(-9), gs]); // 최대 10개 유지
    setGameState(newState);
  }

  function handleUndo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    sfxClick();
    setHistory((h) => h.slice(0, -1));
    setGameState(prev);
    setSelectedFamilyCell(null);
    setPendingAnimalPlacement(null);
    setAnimalRemovalMode(false);
    setOverflowChoice(null);
    setCookingPlayerId(null);
    setPendingFenceSegments([]);
  }

  // ── 핸들러 ──────────────────────────────────────────────────────

  function handleStartGame() {
    sfxGameStart();
    let s = startRound(gs);
    s = replenishActionSpaces(s);
    setGameState({ ...s, phase: 'playing' });
  }

  // 가족 구성원 클릭 — 선택 토글 (바둑 방식)
  function handleFamilyMemberClick(r: number, c: number) {
    // 이미 같은 셀 선택 시 해제
    if (selectedFamilyCell && selectedFamilyCell[0] === r && selectedFamilyCell[1] === c) {
      sfxClick();
      setSelectedFamilyCell(null);
    } else {
      sfxToggle();
      setSelectedFamilyCell([r, c]);
    }
  }

  function handleActionSelect(actionSpaceId: string) {
    if (gs.roundPhase !== 'work') return;
    if (!selectedFamilyCell) return;
    const pid = gs.playerOrder[gs.currentPlayerIndex];
    if (!pid) return;
    const player = gs.players[pid];
    if (!player || countPlaced(gs, pid) >= player.familySize) return;
    try {
      sfxStonePlace();
      const prevIndex = gs.currentPlayerIndex;
      let s = placeWorker(gs, pid, actionSpaceId);
      if (s.roundPhase === 'work') s = advanceToNextPlayer(s);
      if (s.currentPlayerIndex !== prevIndex) setTimeout(() => sfxTurnOver(), 180);
      setSelectedFamilyCell(null);
      saveAndSet(s);
    } catch (e) { console.error('placeWorker 오류:', e); }
  }

  // 대시설 건설 선택
  function handleMajorImpSelect(majorId: string) {
    try {
      const s = buildMajorImprovement(gs, currentPlayerId, majorId);
      sfxCorrect();
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  function finishRoundAfterHarvest(s: GameState, round: number) {
    let final = returnWorkers(s);
    // 선플레이어 토큰 보유자를 다음 라운드 첫 번째 플레이어로
    final = { ...final, currentPlayerIndex: final.firstPlayerIndex };
    if (round >= 14) {
      sfxVictory();
      setGameState({ ...final, phase: 'gameover' });
    } else {
      sfxCorrect();
      final = startRound(final);
      final = replenishActionSpaces(final);
      setGameState(final);
    }
  }

  function handleEndRound() {
    setCountdownSec(null); // 카운트다운 취소
    setHistory([]); // 라운드 경계 — 다음 라운드 카드 보고 언두 방지
    setPendingFenceSegments([]); // 미확정 울타리 초기화
    setCookingPlayerId(null);
    setOverflowChoice(null);
    setPendingAnimalPlacement(null);
    setAnimalRemovalMode(false);
    if (isHarvestRound(gs.round)) {
      sfxModalOpen();
      // 밭 수확 먼저 전체 적용 후 1인씩 식량 처리
      const harvested = harvestFields(gs);
      setGameState(harvested);
      setHarvestPlayerIdx(0);
      return;
    }
    sfxTurnEnd();
    finishRoundAfterHarvest(gs, gs.round);
  }

  // 빵 굽기: 현재 수확 중인 플레이어가 설비로 곡식→음식 변환
  function handleBakeBread(improvementId: string) {
    const pid = harvestPlayerIdx !== null ? gs.playerOrder[harvestPlayerIdx] : null;
    if (!pid) return;
    try {
      sfxCorrect();
      setGameState(bakeBreadForPlayer(gs, pid, improvementId));
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  // 1인 수확 완료: 식량 공급 + 번식 → 다음 플레이어 또는 라운드 종료
  function handleHarvestPlayerConfirm() {
    if (harvestPlayerIdx === null) return;
    const pid = gs.playerOrder[harvestPlayerIdx];
    if (!pid) return;

    sfxToggle();
    let s = feedFamilyForPlayer(gs, pid);
    s = breedAnimalsForPlayer(s, pid);
    setGameState(s);

    const nextIdx = harvestPlayerIdx + 1;
    if (nextIdx < gs.playerOrder.length) {
      setHarvestPlayerIdx(nextIdx);
    } else {
      // 모든 플레이어 수확 완료 → 가족 말 회수 + 다음 라운드
      sfxModalClose();
      setHarvestPlayerIdx(null);
      finishRoundAfterHarvest(s, gs.round);
    }
  }

  // ref를 최신 handleEndRound로 매 렌더마다 갱신 (countdown 자동 발화용)
  autoEndRoundRef.current = handleEndRound;

  function handleCellClick(r: number, c: number) {
    // 현재 플레이어 농장에서만 클릭 유효 (핸들러 자체가 현재 플레이어 보드에만 바인딩됨)
    const phase = gs.roundPhase;
    if (phase === 'pending_build_room') {
      try {
        const s = buildRoom(gs, currentPlayerId, r, c);
        sfxStonePlace();
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { sfxWrong(); alert((e as Error).message); }
    } else if (phase === 'pending_build_stable') {
      try {
        const s = buildStable(gs, currentPlayerId, r, c);
        sfxStonePlace();
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { sfxWrong(); alert((e as Error).message); }
    } else if (phase === 'pending_plow') {
      try {
        const s = plowField(gs, currentPlayerId, r, c);
        sfxStonePlace();
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { console.error(e); }
    } else if (phase === 'pending_plow_sow') {
      try {
        const s = plowField(gs, currentPlayerId, r, c);
        sfxStonePlace();
        saveAndSet({ ...s, roundPhase: 'pending_sow' });
      } catch (e) { console.error(e); }
    } else if (phase === 'pending_sow') {
      try {
        const player = gs.players[currentPlayerId];
        const crop: 'grain' | 'vegetable' =
          (player?.resources.grain ?? 0) > 0 ? 'grain' : 'vegetable';
        const s = sowField(gs, currentPlayerId, r, c, crop);
        sfxToggle();
        saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } catch (e) { console.error(e); }
    }
  }

  // 가축 시장 동물 선택 → resources에 임시 보관 후 배치 모드 진입
  function handleAnimalSelect(animalType: AnimalType) {
    try {
      const player = gs.players[currentPlayerId];
      if (!player) return;

      // 배치 공간 없음 → resources에 임시 보관 후 선택 모달 띄움
      if (!hasAnimalPlacement(player.farm, animalType)) {
        const s = getAnimalFromMarket(gs, currentPlayerId, animalType);
        sfxCorrect();
        saveAndSet({ ...s, roundPhase: 'work' });
        setPendingAnimalPlacement(animalType);
        setOverflowChoice(animalType);
        return;
      }

      const s = getAnimalFromMarket(gs, currentPlayerId, animalType);
      sfxCorrect();
      // 행동 완료 처리(advanceToNextPlayer)는 배치 후에 실행
      saveAndSet({ ...s, roundPhase: 'work' }); // roundPhase를 work로 돌리되 아직 플레이어는 유지
      setPendingAnimalPlacement(animalType);
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  // 가축 배치 확정: 목장 인덱스 또는 'house'
  function handlePlaceAnimal(destination: number | 'house') {
    if (!pendingAnimalPlacement) return;
    try {
      const s = placeAnimalForPlayer(gs, currentPlayerId, pendingAnimalPlacement, destination);
      sfxStonePlace();
      setPendingAnimalPlacement(null);
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  // 교체 모드: 기존 동물 제거 + 같은 자리에 새 동물 배치 (원클릭)
  function handleAnimalRemove(location: { type: 'pasture'; index: number } | { type: 'house' }) {
    if (!pendingAnimalPlacement) return;
    try {
      const s = replaceAnimalAtLocation(gs, currentPlayerId, pendingAnimalPlacement, location);
      sfxStonePlace();
      setPendingAnimalPlacement(null);
      setAnimalRemovalMode(false);
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  // 교체 취소: 새 동물을 버리고 턴 진행 (resources에 임시 보관된 동물 차감)
  function handleCancelReplace() {
    if (!pendingAnimalPlacement) return;
    const type = pendingAnimalPlacement;
    const s = addResources(gs, currentPlayerId, { [type]: -1 });
    sfxWrong();
    setPendingAnimalPlacement(null);
    setAnimalRemovalMode(false);
    saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
  }

  // 공간 부족 모달 → 교체 선택
  function handleOverflowReplace() {
    setOverflowChoice(null);
    setAnimalRemovalMode(true);
  }

  // 공간 부족 모달 → 요리 선택 (임시 보관 동물을 음식으로)
  function handleOverflowCook() {
    if (!pendingAnimalPlacement) return;
    const type = pendingAnimalPlacement;
    try {
      const source: AnimalSource = { kind: 'resources', animalType: type, count: 1 };
      const s = cookAnimal(gs, currentPlayerId, source);
      sfxCorrect();
      setPendingAnimalPlacement(null);
      setOverflowChoice(null);
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  // 공간 부족 모달 → 버림
  function handleOverflowDiscard() {
    if (!pendingAnimalPlacement) return;
    const type = pendingAnimalPlacement;
    const s = addResources(gs, currentPlayerId, { [type]: -1 });
    sfxWrong();
    setPendingAnimalPlacement(null);
    setOverflowChoice(null);
    saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
  }

  // 언제든 요리 (ResourcePanel 옆 🔥 버튼)
  function handleCookAnimal(source: AnimalSource) {
    if (!cookingPlayerId || !gs.players[cookingPlayerId]) {
      setCookingPlayerId(null);
      return;
    }
    try {
      const s = cookAnimal(gs, cookingPlayerId, source);
      sfxCorrect();
      saveAndSet(s);
      // 모달은 열린 채로 유지 (여러 번 변환 가능)
    } catch (e) { sfxWrong(); alert((e as Error).message); }
  }

  // 카드 플레이
  function handleCardPlay(card: Card) {
    try {
      const s = playCard(gs, currentPlayerId, card.id);
      sfxCardFlip();
      setTimeout(() => sfxCorrect(), 120);
      setDetailCard(null);
      saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
    } catch (e) {
      sfxWrong();
      alert((e as Error).message);
    }
  }

  // 소시설 건너뜀 (optional)
  function handleSkipMinorImp() {
    sfxClick();
    saveAndSet(advanceToNextPlayer({ ...gs, roundPhase: 'work' }));
  }

  // 방 만들기·외양간 짓기 — 어떤 걸 지을지 선택
  function handleBuildChoice(choice: 'room' | 'stable' | 'both') {
    sfxClick();
    if (choice === 'room') {
      setGameState({ ...gs, roundPhase: 'pending_build_room' });
    } else if (choice === 'stable') {
      setGameState({ ...gs, roundPhase: 'pending_build_stable' });
    } else {
      // 둘 다: 방 먼저, 완료 후 외양간 선택 — 방 건설 후 외양간도 이어서
      setGameState({ ...gs, roundPhase: 'pending_build_room' });
    }
  }

  // 울타리 세그먼트 토글: 클릭 시 추가/제거
  function handleFenceClick(orientation: 'horizontal' | 'vertical', r: number, c: number) {
    const type = orientation === 'horizontal' ? 'h' : 'v';
    setPendingFenceSegments((prev) => {
      const exists = prev.some((seg) => seg.type === type && seg.row === r && seg.col === c);
      if (exists) {
        sfxClick();
        return prev.filter((seg) => !(seg.type === type && seg.row === r && seg.col === c));
      }
      sfxToggle();
      return [...prev, { type, row: r, col: c }];
    });
  }

  function handlePendingConfirm() {
    const phase = gs.roundPhase;
    try {
      if (phase === 'pending_family_growth') {
        // RC_BASIC_WISH / MODEST_WISH — 방 필요 + Modest는 5라운드 조건
        let s: GameState;
        if (gs.round < 5) {
          // 소박한 가족 늘리기: 5라운드 미만이면 에러
          const actionId = Object.keys(gs.actionSpaces).find(
            (id) => gs.actionSpaces[id]?.workerId === currentPlayerId
          );
          if (actionId === 'V2_MODEST_WISH' || actionId === 'V34_MODEST_WISH') {
            throw new Error('소박한 가족 늘리기는 5라운드부터 가능합니다');
          }
        }
        s = growFamily(gs, currentPlayerId, true);
        sfxCorrect();
        setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } else if (phase === 'pending_family_growth_urgent') {
        // RC_URGENT_WISH — 방 불필요
        const s = growFamily(gs, currentPlayerId, false);
        sfxCorrect();
        setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
      } else if (phase === 'pending_renovate' || phase === 'pending_renovate_fence') {
        const s = renovateHouse(gs, currentPlayerId);
        sfxStonePlace();
        if (phase === 'pending_renovate_fence') {
          setGameState({ ...s, roundPhase: 'pending_fence' });
        } else {
          setGameState(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
        }
      } else if (phase === 'pending_fence') {
        if (pendingFenceSegments.length === 0) {
          // 세그먼트 없이 확인 → 건너뜀
          sfxClick();
          setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }));
        } else {
          const s = buildFences(gs, currentPlayerId, pendingFenceSegments);
          sfxStonePlace();
          setPendingFenceSegments([]);
          saveAndSet(advanceToNextPlayer({ ...s, roundPhase: 'work' }));
        }
      } else {
        sfxClick();
        setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }));
      }
    } catch (e) {
      sfxWrong();
      alert((e as Error).message);
    }
  }

  // ── 가족 말 pip 렌더 ──────────────────────────────────────────────
  function WorkerPips({ pid }: { pid: string }) {
    const p = gs.players[pid];
    if (!p) return null;
    const placed = countPlaced(gs, pid);
    const total = p.familySize;
    const color = WORKER_DOT_COLORS[p.color] ?? 'bg-gray-400';
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={[
              'w-2.5 h-2.5 rounded-full border border-white',
              i < placed ? 'opacity-30 bg-gray-400' : color,
            ].join(' ')}
            title={i < placed ? '배치됨' : '남은 일꾼'}
          />
        ))}
      </div>
    );
  }

  // ── 렌더 ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-300 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-amber-800">
            <span aria-hidden="true">🌾</span> 아그리콜라
          </h1>
          <span className="text-sm text-gray-500">
            {gs.phase === 'setup'
              ? '시작 전'
              : `${gs.round}라운드 / 스테이지 ${gs.stage}`}
          </span>
          {isHarvestRound(gs.round) && gs.phase !== 'setup' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
              🌾 수확 라운드
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="text-xs px-2 py-1 bg-stone-200 border border-stone-400 text-stone-700 rounded hover:bg-stone-300"
            >
              ↩ 되돌리기
            </button>
          )}
          <button onClick={onExit} className="text-sm text-gray-400 hover:text-gray-600">
            종료
          </button>
        </div>
      </div>

      {/* 플레이어 상태 바 — 차례 강조 */}
      {gs.phase === 'playing' && (
        <div className="flex gap-2 mb-3">
          {gs.playerOrder.map((pid) => {
            const p = gs.players[pid];
            if (!p) return null;
            const isActive = pid === currentPlayerId && !allWorkersPlaced;
            const colorStyle = PLAYER_COLORS[p.color] ?? PLAYER_COLORS.red;
            const totalSec = playerTimers[pid] ?? 0;
            return (
              <div
                key={pid}
                className={[
                  'flex-1 rounded-lg px-3 py-2 border-2 transition-all duration-300',
                  isActive ? `${colorStyle.bg} ${colorStyle.ring} ring-2 shadow-md` : 'bg-white border-gray-200 opacity-70',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isActive ? colorStyle.text : 'text-gray-600'}`}>
                    {isActive && <span aria-hidden="true">▶ </span>}
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{formatSeconds(totalSec)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <WorkerPips pid={pid} />
                  <span className="text-xs text-gray-500">
                    {countPlaced(gs, pid)}/{p.familySize} 배치
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 가축 배치 대기 배너 — 시장에서 가져온 동물을 목장/집에 배치해야 함 */}
      {pendingAnimalPlacement && !animalRemovalMode && (
        <div className="mb-3 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            {pendingAnimalPlacement === 'sheep' ? '🐑 양' : pendingAnimalPlacement === 'boar' ? '🐷 멧돼지' : '🐄 소'}
            {' '}을(를) 아래 농장에서 배치할 위치를 선택하세요
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            녹색 버튼 = 빈 목장 또는 같은 동물 목장 / 파란색 버튼 = 집 안 (최대 1마리)
          </p>
        </div>
      )}

      {/* 가축 교체 모드 배너 — 기존 동물 중 버릴 대상 선택 */}
      {pendingAnimalPlacement && animalRemovalMode && (
        <div className="mb-3 px-4 py-2 bg-red-50 border-2 border-red-500 rounded-lg flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-red-800">
            교체 모드 · 버릴 동물이 있는 위치의 ❌ 버튼을 누르면 그 자리에 새{' '}
            {pendingAnimalPlacement === 'sheep' ? '🐑 양' : pendingAnimalPlacement === 'boar' ? '🐷 멧돼지' : '🐄 소'}
            {' '}이(가) 배치됩니다
          </p>
          <div className="flex gap-2 shrink-0">
            {hasCookingFacility(gs, currentPlayerId) && (
              <button
                onClick={handleOverflowCook}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors duration-150"
              >
                🔥 요리 (+{ANIMAL_TO_FOOD_RATES[pendingAnimalPlacement] ?? 0})
              </button>
            )}
            <button
              onClick={handleCancelReplace}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-red-400 text-red-700 rounded hover:bg-red-100 transition-colors duration-150"
            >
              교체 취소 (새 동물 버림)
            </button>
          </div>
        </div>
      )}

      {/* pending 상태 안내 배너 */}
      {gs.roundPhase === 'pending_play_occupation' ? (
        /* 직업 카드 선택 */
        <div className="mb-3 px-4 py-2 bg-amber-50 border-2 border-amber-500 rounded-lg">
          <p className="text-sm font-semibold text-amber-800">
            📜 직업 카드 플레이 — 아래 손패에서 직업 카드를 선택하세요
            {currentPlayer && getOccupationPlayCost(currentPlayer, gs.playerOrder.length) > 0 && (
              <span className="ml-2 text-xs font-normal text-amber-600">
                (비용: 음식 {getOccupationPlayCost(currentPlayer, gs.playerOrder.length)}개)
              </span>
            )}
          </p>
        </div>
      ) : gs.roundPhase === 'pending_play_minor_imp' ? (
        /* 소시설 카드 선택 (선택 사항) */
        <div className="mb-3 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg flex items-center justify-between">
          <p className="text-sm font-semibold text-green-800">
            🔧 보조 설비 놓기 가능 (선택) — 아래 손패에서 보조 설비를 선택하거나 건너뛰세요
          </p>
          <button
            onClick={handleSkipMinorImp}
            className="text-xs px-3 py-1 rounded border bg-green-100 text-green-700 border-green-300 hover:bg-green-200 ml-3 shrink-0"
          >
            건너뜀
          </button>
        </div>
      ) : gs.roundPhase === 'pending_major_imp' ? (
        /* 대시설 선택 */
        <div className="mb-3 px-4 py-3 bg-stone-100 border-2 border-stone-400 rounded-lg">
          <p className="text-sm font-semibold text-stone-800 mb-2">🏭 주요 설비 건설 — 원하는 설비를 선택하세요</p>
          <div className="grid grid-cols-2 gap-1.5">
            {gs.majorImprovements
              .filter((m) => m.ownerId === null)
              .map((m) => {
                const costStr = m.cost
                  ? Object.entries(m.cost).map(([r, v]) => `${KO_RES[r] ?? r} ${v}`).join(' + ')
                  : '무료';
                const canAfford = !m.cost || Object.entries(m.cost).every(
                  ([r, v]) => ((currentPlayer?.resources[r as keyof typeof currentPlayer.resources] ?? 0) as number) >= (v ?? 0)
                );
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMajorImpSelect(m.id)}
                    disabled={!canAfford}
                    className={[
                      'text-left text-xs px-2 py-1.5 rounded border transition-colors',
                      canAfford
                        ? 'bg-amber-50 border-amber-400 hover:bg-amber-100 text-stone-800'
                        : 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed opacity-60',
                    ].join(' ')}
                  >
                    <span className="font-medium">{m.nameKo}</span>
                    <span className="block text-[10px] text-stone-500">{costStr} · {m.victoryPoints}VP</span>
                  </button>
                );
              })}
          </div>
          <button
            onClick={() => setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }))}
            className="mt-2 text-xs px-3 py-1 rounded border bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300"
          >
            건너뜀
          </button>
        </div>
      ) : gs.roundPhase === 'pending_animal_select' ? (
        /* 가축 시장 — 동물 종 선택 */
        <div className="mb-3 px-4 py-2 bg-sky-50 border border-sky-300 rounded-lg">
          <p className="text-sm font-medium text-sky-800 mb-2">🐾 가축 시장 — 원하는 동물을 선택하세요</p>
          <div className="flex gap-2">
            <button onClick={() => handleAnimalSelect('sheep')}
              className="flex-1 text-xs px-2 py-1.5 bg-sky-100 border border-sky-300 rounded hover:bg-sky-200 font-medium">
              🐑 양 + 음식1
            </button>
            <button onClick={() => handleAnimalSelect('boar')}
              className="flex-1 text-xs px-2 py-1.5 bg-pink-100 border border-pink-300 rounded hover:bg-pink-200 font-medium">
              🐷 멧돼지
            </button>
            <button onClick={() => handleAnimalSelect('cattle')}
              className="flex-1 text-xs px-2 py-1.5 bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 font-medium">
              🐄 소 (음식1 지불)
            </button>
          </div>
        </div>
      ) : gs.roundPhase === 'pending_fence' ? (
        /* 울타리 건설 — 나무 비용 동적 표시 */
        <div className="mb-3 px-4 py-2 bg-amber-100 border border-amber-400 rounded-lg flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-amber-900">
              🪵 울타리 건설 — 아래 농장에서 울타리 선분을 클릭하세요
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              선택한 세그먼트: <span className="font-bold">{pendingFenceSegments.length}개</span>
              {pendingFenceSegments.length > 0 && (
                <span className="ml-2">나무 {pendingFenceSegments.length}개 소모</span>
              )}
              {pendingFenceSegments.length === 0 && ' (없으면 건너뜀)'}
            </p>
          </div>
          <button
            onClick={handlePendingConfirm}
            disabled={
              pendingFenceSegments.length > 0 &&
              (currentPlayer?.resources.wood ?? 0) < pendingFenceSegments.length
            }
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            확인
          </button>
        </div>
      ) : gs.roundPhase === 'pending_build_room' || gs.roundPhase === 'pending_build_stable' ? (
        /* 방 만들기·외양간 짓기 — 선택 버튼 + 셀 클릭 안내 */
        <div className="mb-3 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-amber-800">
              {gs.roundPhase === 'pending_build_room'
                ? '🏠 방 건설 — 기존 방에 인접한 빈 셀을 클릭하세요 (재료5+갈대2)'
                : '🐄 외양간 건설 — 빈 셀을 클릭하세요 (나무2)'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleBuildChoice('room')}
              className={`text-xs px-3 py-1 rounded border font-medium ${gs.roundPhase === 'pending_build_room' ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-amber-700 border-amber-400 hover:bg-amber-50'}`}>
              🏠 방 건설
            </button>
            <button onClick={() => handleBuildChoice('stable')}
              className={`text-xs px-3 py-1 rounded border font-medium ${gs.roundPhase === 'pending_build_stable' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-green-700 border-green-400 hover:bg-green-50'}`}>
              🐄 외양간 건설
            </button>
            <button onClick={() => setGameState(advanceToNextPlayer({ ...gs, roundPhase: 'work' }))}
              className="text-xs px-3 py-1 rounded border bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200 ml-auto">
              건너뜀
            </button>
          </div>
        </div>
      ) : pendingLabel ? (
        /* 일반 pending 배너 */
        <div className="mb-3 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">{pendingLabel}</span>
          <button
            onClick={handlePendingConfirm}
            className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            확인
          </button>
        </div>
      ) : null}

      {/* 게임 종료 */}
      {isGameOver ? (
        <div>
          <h2 className="text-2xl font-bold text-center mb-6">
            <span aria-hidden="true">🏆</span> 게임 종료
          </h2>
          <ScoreBoard state={gs} />
        </div>

      /* 시작 전 */
      ) : gs.phase === 'setup' ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-gray-600 mb-2">플레이어 {gs.playerOrder.length}명 준비 완료</p>
          {/* 초기 상태 미리보기 */}
          <div className="flex gap-4 mb-4">
            {gs.playerOrder.map((pid) => {
              const p = gs.players[pid];
              if (!p) return null;
              const colorStyle = PLAYER_COLORS[p.color] ?? PLAYER_COLORS.red;
              return (
                <div key={pid} className={`rounded-lg px-4 py-3 text-sm ${colorStyle.bg} border`}>
                  <div className={`font-bold ${colorStyle.text}`}>{p.name}</div>
                  <div className="text-gray-600 mt-1">
                    🏠 방 2개 · 👨 가족 {p.familySize}명 · 🍖 음식 {p.resources.food}개
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleStartGame}
            className="px-8 py-3 bg-amber-600 text-white rounded-xl font-medium text-lg hover:bg-amber-700 transition-colors duration-150"
          >
            게임 시작 (1라운드)
          </button>
        </div>

      /* 게임 진행 */
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 행동 보드 */}
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700">
                {allWorkersPlaced
                  ? '✅ 모든 일꾼 배치 완료'
                  : `${currentPlayer?.name ?? ''}의 차례`}
              </span>
              <div className="flex items-center gap-2">
                {/* 주요 설비 확인 버튼 */}
                <button
                  onClick={() => { sfxClick(); setShowMajorImpPanel((v) => !v); }}
                  className="text-xs px-2 py-1 bg-stone-200 border border-stone-400 text-stone-700 rounded hover:bg-stone-300"
                  title="주요 설비 목록 확인"
                >
                  🏭 주요 설비
                </button>
                {allWorkersPlaced && (
                  <div className="flex items-center gap-1.5">
                    {countdownSec !== null && (
                      <span className="text-sm font-mono font-bold text-amber-700 tabular-nums min-w-[2rem] text-right">
                        {countdownSec}초
                      </span>
                    )}
                    <button
                      onClick={handleEndRound}
                      className="text-sm px-4 py-1.5 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition-colors duration-150"
                    >
                      {isHarvestRound(gs.round) ? '라운드 종료 + 수확' : '라운드 종료'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 주요 설비 패널 */}
            {showMajorImpPanel && (
              <div className="mb-2 bg-stone-100 border-2 border-stone-400 rounded-lg p-2">
                <div className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                  주요 설비 현황
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {gs.majorImprovements.map((m) => {
                    const isOwned = m.ownerId !== null;
                    const owner = m.ownerId ? gs.players[m.ownerId] : null;
                    const ownerColor = owner ? (WORKER_DOT_COLORS[owner.color] ?? 'bg-gray-400') : '';
                    const costStr = m.cost
                      ? Object.entries(m.cost).map(([r, v]) => `${KO_RES[r] ?? r}${v}`).join('+')
                      : '무료';
                    return (
                      <div
                        key={m.id}
                        className={[
                          'text-xs px-2 py-1 rounded border',
                          isOwned ? 'bg-stone-200 border-stone-300 opacity-60' : 'bg-amber-50 border-amber-300',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-1">
                          {isOwned && owner && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${ownerColor}`} />
                          )}
                          <span className={`font-medium leading-tight ${isOwned ? 'line-through text-stone-500' : 'text-stone-800'}`}>
                            {m.nameKo}
                          </span>
                          {!isOwned && (
                            <span className="ml-auto text-[10px] text-amber-700 shrink-0">{costStr}</span>
                          )}
                        </div>
                        {!isOwned && m.victoryPoints != null && (
                          <span className="text-[10px] text-yellow-700">+{m.victoryPoints}VP</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <ActionBoard
              state={gs}
              currentPlayerId={currentPlayerId}
              onActionSelect={handleActionSelect}
              workerReady={!!selectedFamilyCell}
            />
          </div>

          {/* 농장 + 자원 — 전체 표시, 개별 접기/펼치기 */}
          <div className="space-y-2">
            {gs.playerOrder.map((pid) => {
              const p = gs.players[pid];
              if (!p) return null;
              const isActive = pid === currentPlayerId;
              const isCollapsed = collapsedFarms.has(pid);
              const colorStyle = PLAYER_COLORS[p.color] ?? PLAYER_COLORS.red;
              return (
                <div
                  key={pid}
                  className={[
                    'rounded-lg border overflow-hidden',
                    isActive ? `ring-2 ${colorStyle.ring}` : 'border-gray-200',
                  ].join(' ')}
                >
                  {/* 헤더 — 클릭으로 접기/펼치기 */}
                  <button
                    onClick={() =>
                      setCollapsedFarms((prev) => {
                        const next = new Set(prev);
                        if (next.has(pid)) next.delete(pid);
                        else next.add(pid);
                        return next;
                      })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 ${colorStyle.bg} ${colorStyle.text} hover:opacity-90 transition-opacity`}
                  >
                    <span className="font-bold text-sm flex items-center gap-1">
                      {isActive && <span aria-hidden="true">▶</span>}
                      {p.name}
                      {gs.startingPlayerToken === pid && <span aria-hidden="true" className="ml-1 text-yellow-600">⭐</span>}
                    </span>
                    <span className="text-xs opacity-70">{isCollapsed ? '▼ 펼치기' : '▲ 접기'}</span>
                  </button>

                  {/* 농장 내용 */}
                  {!isCollapsed && (
                    <div className="p-2 bg-white">
                      {!isActive && (
                        <div className="text-xs text-gray-400 mb-1 text-center">👁 보기 전용</div>
                      )}
                      <FarmBoard
                        board={p.farm}
                        familySize={p.familySize}
                        deployedCount={countPlaced(gs, pid)}
                        selectedFamilyCell={isActive ? selectedFamilyCell : null}
                        onCellClick={isActive ? handleCellClick : undefined}
                        onFamilyMemberClick={isActive ? handleFamilyMemberClick : undefined}
                        onFenceClick={isActive ? handleFenceClick : undefined}
                        fencingMode={
                          isActive &&
                          (gs.roundPhase === 'pending_fence' || gs.roundPhase === 'pending_renovate_fence')
                        }
                        pendingFenceSegments={isActive ? pendingFenceSegments : []}
                        playerColor={p.color}
                        isStartingPlayer={gs.startingPlayerToken === pid}
                        animalPlacementType={isActive && !animalRemovalMode ? pendingAnimalPlacement : null}
                        onAnimalPlace={isActive ? handlePlaceAnimal : undefined}
                        animalRemovalMode={isActive && animalRemovalMode}
                        onAnimalRemove={isActive ? handleAnimalRemove : undefined}
                      />
                      <div className="mt-3 relative">
                        <ResourcePanel player={p} />
                        {isActive && hasCookingFacility(gs, pid) && findAnimalSources(gs, pid).length > 0 && (
                          <button
                            onClick={() => setCookingPlayerId(pid)}
                            className="absolute top-1 right-1 px-2 py-1 text-xs font-bold bg-amber-600 text-white rounded shadow hover:bg-amber-700 transition-colors duration-150"
                            title="동물을 음식으로 변환"
                          >
                            🔥 요리
                          </button>
                        )}
                      </div>

                      {/* 손패 — 현재 플레이어만 */}
                      {isActive && currentPlayer && (
                        <div className="mt-3">
                          <CardHand
                            occupations={currentPlayer.hand.occupations}
                            minorImprovements={currentPlayer.hand.minorImprovements}
                            activeType={
                              gs.roundPhase === 'pending_play_occupation' ? 'occupation'
                              : gs.roundPhase === 'pending_play_minor_imp' ? 'minor_improvement'
                              : null
                            }
                            occupationFoodCost={getOccupationPlayCost(currentPlayer, gs.playerOrder.length)}
                            onCardClick={(card) => { sfxCardFlip(); setDetailCard(card); }}
                            selectedCardId={detailCard?.id ?? null}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 수확 모달 — 1인씩 순서대로 처리 */}
      {harvestPlayerIdx !== null && (() => {
        const harvestPid = gs.playerOrder[harvestPlayerIdx];
        if (!harvestPid) return null;
        return (
          <HarvestModal
            state={gs}
            harvestingPlayerId={harvestPid}
            playerNumber={harvestPlayerIdx + 1}
            totalPlayers={gs.playerOrder.length}
            onBakeBread={handleBakeBread}
            onConfirmFeed={handleHarvestPlayerConfirm}
          />
        );
      })()}

      {/* 플로팅 가족 구성원 토큰 — 커서에 반투명 디스크 */}
      {selectedFamilyCell && currentPlayer && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: cursorPos.x - 18, top: cursorPos.y - 18 }}
          aria-hidden="true"
        >
          <div
            className={[
              'w-9 h-9 rounded-full border-4 shadow-xl opacity-70',
              FLOATING_DISC[currentPlayer.color] ?? 'bg-gray-500 border-gray-700',
            ].join(' ')}
          />
        </div>
      )}

      {/* 카드 상세 모달 */}
      {detailCard && currentPlayer && (
        <CardDetail
          card={detailCard}
          canPlay={
            (gs.roundPhase === 'pending_play_occupation' && detailCard.type === 'occupation') ||
            (gs.roundPhase === 'pending_play_minor_imp' && detailCard.type === 'minor_improvement')
              ? canPlayCard(gs, currentPlayerId, detailCard).ok
              : false
          }
          playReason={canPlayCard(gs, currentPlayerId, detailCard).reason}
          occupationFoodCost={getOccupationPlayCost(currentPlayer, gs.playerOrder.length)}
          onPlay={
            (gs.roundPhase === 'pending_play_occupation' && detailCard.type === 'occupation') ||
            (gs.roundPhase === 'pending_play_minor_imp' && detailCard.type === 'minor_improvement')
              ? () => handleCardPlay(detailCard)
              : undefined
          }
          onClose={() => { sfxClick(); setDetailCard(null); }}
        />
      )}

      {/* 배치 공간 부족 선택 모달 */}
      {overflowChoice && (
        <AnimalOverflowModal
          animalType={overflowChoice}
          foodRate={ANIMAL_TO_FOOD_RATES[overflowChoice] ?? 0}
          canCook={hasCookingFacility(gs, currentPlayerId)}
          onReplace={handleOverflowReplace}
          onCook={handleOverflowCook}
          onDiscard={handleOverflowDiscard}
        />
      )}

      {/* 언제든 동물 요리 모달 */}
      {cookingPlayerId && (
        <CookAnimalModal
          sources={findAnimalSources(gs, cookingPlayerId)}
          onCook={handleCookAnimal}
          onClose={() => { sfxClick(); setCookingPlayerId(null); }}
        />
      )}
    </div>
  );
}
