/**
 * Agricola 온라인 플레이어 페이지 (폰)
 *
 * 상태: Cycle 2 (로비 합류) → Cycle 3 (게임 진행) 단계적 구현 예정
 * 현재: 방 참가 + 로비 대기까지만
 */

import { useEffect, useRef, useState } from 'react';
import { joinRoom, subscribeRoom, updateLobbyPlayer, submitAction } from '../lib/firebase-room.js';
import { canPlayerAct } from '../lib/action-dispatcher.js';
import { findAnimalSources, hasCookingFacility, type AnimalSource } from '../lib/game-engine.js';
import type {
  RoomSnapshot, PlayerId, LobbyPlayer, AnimalType,
} from '../lib/types.js';
import FarmBoard from '../components/FarmBoard.js';
import ActionBoard from '../components/ActionBoard.js';
import ResourcePanel from '../components/ResourcePanel.js';
import AnimalOverflowModal from '../components/AnimalOverflowModal.js';
import CookAnimalModal from '../components/CookAnimalModal.js';
import { ANIMAL_TO_FOOD_RATES } from '../lib/cards/major-improvements.js';

type Phase = 'loading' | 'joining' | 'in_lobby' | 'playing' | 'ended' | 'error';

const COLORS: Array<LobbyPlayer['color']> = ['red', 'blue', 'green', 'yellow'];

export default function PlayerPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [myPid, setMyPid] = useState<PlayerId | null>(null);
  const [name, setName] = useState<string>('');
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const roomNullTimerRef = useRef<number | null>(null);

  // ── 플레이어 로컬 상호작용 상태 ──────────────────────────────
  const [selectedFamilyCell, setSelectedFamilyCell] = useState<[number, number] | null>(null);
  const [pendingFenceSegments, setPendingFenceSegments] = useState<Array<{ type: 'h' | 'v'; row: number; col: number }>>([]);
  const [pendingAnimalPlacement, setPendingAnimalPlacement] = useState<AnimalType | null>(null);
  const [animalRemovalMode, setAnimalRemovalMode] = useState<boolean>(false);
  const [overflowChoice, setOverflowChoice] = useState<AnimalType | null>(null);
  const [showCookingModal, setShowCookingModal] = useState<boolean>(false);

  // URL 에서 room 파라미터 추출 + sessionStorage 재접속 시도
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (!code) {
      setPhase('error');
      setErrorMsg('방 코드가 없습니다. QR 을 다시 스캔하세요.');
      return;
    }
    setRoomCode(code);

    // sessionStorage 에 저장된 세션이 있으면 자동 재접속
    const sessionKey = `agricola_session_${code}`;
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { pid: string; name: string };
        setMyPid(parsed.pid);
        setName(parsed.name);
        setPhase('in_lobby');
        return;
      } catch {
        sessionStorage.removeItem(sessionKey);
      }
    }

    const savedName = localStorage.getItem('agricola_last_name') ?? '';
    setName(savedName);
    setPhase('joining');
  }, []);

  // 구독
  useEffect(() => {
    if (!roomCode) return;
    if (phase === 'loading' || phase === 'joining' || phase === 'error') return;
    const unsub = subscribeRoom(roomCode, (snap) => {
      if (!snap) {
        if (!roomNullTimerRef.current) {
          roomNullTimerRef.current = window.setTimeout(() => {
            setPhase('ended');
            setErrorMsg('방이 종료되었습니다.');
          }, 3000);
        }
        return;
      }
      if (roomNullTimerRef.current) {
        clearTimeout(roomNullTimerRef.current);
        roomNullTimerRef.current = null;
      }
      setSnapshot(snap);

      if (snap.meta?.phase === 'playing' && phase === 'in_lobby') {
        setPhase('playing');
      } else if (snap.meta?.phase === 'ended') {
        setPhase('ended');
      }
    });
    return () => unsub();
  }, [roomCode, phase]);

  async function handleJoin() {
    if (!name.trim()) return;
    try {
      const result = await joinRoom(roomCode, name.trim());
      if (!result.ok) {
        setPhase('error');
        if (result.error === 'not_found') setErrorMsg('방을 찾을 수 없습니다.');
        else if (result.error === 'full') setErrorMsg('인원이 찼습니다.');
        else if (result.error === 'already_started') setErrorMsg('이미 게임이 시작되었습니다.');
        return;
      }
      setMyPid(result.pid);
      localStorage.setItem('agricola_last_name', name.trim());
      sessionStorage.setItem(
        `agricola_session_${roomCode}`,
        JSON.stringify({ pid: result.pid, name: name.trim() }),
      );
      setPhase('in_lobby');
    } catch (e) {
      setPhase('error');
      setErrorMsg(`참가 실패: ${(e as Error).message}`);
    }
  }

  async function handleColorChange(color: LobbyPlayer['color']) {
    if (!myPid) return;
    await updateLobbyPlayer(roomCode, myPid, { color });
  }

  // ── 렌더링 ─────────────────────────────────────────────────────

  if (phase === 'loading') return <Center>로딩 중...</Center>;

  if (phase === 'error' || phase === 'ended') {
    return (
      <Center>
        <div className="text-center">
          <p className="text-red-700 font-bold text-lg mb-2">
            {phase === 'ended' ? '종료' : '오류'}
          </p>
          <p className="text-gray-600 text-sm">{errorMsg}</p>
        </div>
      </Center>
    );
  }

  if (phase === 'joining') {
    return (
      <Center>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-xl font-bold text-amber-800 mb-1 text-center">🌾 아그리콜라</h1>
          <p className="text-center text-xs text-gray-500 mb-4">
            방 <span className="font-mono">{roomCode}</span>
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="플레이어 이름"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 mb-4"
            maxLength={12}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:bg-gray-300"
          >
            참가하기
          </button>
        </div>
      </Center>
    );
  }

  // in_lobby / playing
  const me = myPid ? snapshot?.lobby?.[myPid] : undefined;
  const lobbyPlayers = Object.values(snapshot?.lobby ?? {});
  const usedColors = new Set(
    lobbyPlayers.filter((p) => p.pid !== myPid).map((p) => p.color),
  );

  if (phase === 'playing') {
    const gs = snapshot?.gameState;
    const mePlayer = myPid ? gs?.players?.[myPid] : undefined;
    const myHand = myPid ? snapshot?.privateHands?.[myPid] : undefined;
    const isMyTurn = !!(gs && gs.playerOrder[gs.currentPlayerIndex] === myPid);
    const canAct = gs && myPid ? canPlayerAct(gs, myPid) : false;
    const rp = gs?.roundPhase;
    const isFenceMode = canAct && (rp === 'pending_fence' || rp === 'pending_renovate_fence');
    const pendingAnimalActive = isMyTurn && pendingAnimalPlacement && !animalRemovalMode;
    const replaceModeActive = isMyTurn && pendingAnimalPlacement && animalRemovalMode;

    // 액션 submit 헬퍼 — 실패 시 alert
    const submit = (kind: string, payload: Record<string, unknown>) => {
      if (!myPid) return;
      submitAction(roomCode, { playerId: myPid, kind: kind as never, payload })
        .catch((e) => alert(`제출 실패: ${(e as Error).message}`));
    };

    // ── 핸들러 ─────────────────────────────────────────────

    // 가족 구성원 클릭 (토글)
    const handleFamilyMemberClick = (r: number, c: number) => {
      if (!canAct) return;
      setSelectedFamilyCell((prev) => prev && prev[0] === r && prev[1] === c ? null : [r, c]);
    };

    // 행동 공간 클릭
    const handleActionSelect = (actionSpaceId: string) => {
      if (!canAct) return;
      submit('place_worker', { actionSpaceId });
      setSelectedFamilyCell(null);
    };

    // 농장 셀 클릭 (pending_plow/sow/build_room/build_stable)
    const handleCellClick = (r: number, c: number) => {
      if (!isMyTurn || !rp) return;
      if (['pending_plow', 'pending_plow_sow', 'pending_sow', 'pending_build_room', 'pending_build_stable'].includes(rp)) {
        submit('cell_click', { row: r, col: c });
      }
    };

    // 울타리 세그먼트 토글 (로컬)
    const handleFenceClick = (orientation: 'horizontal' | 'vertical', r: number, c: number) => {
      if (!isFenceMode) return;
      const type = orientation === 'horizontal' ? 'h' : 'v';
      setPendingFenceSegments((prev) => {
        const idx = prev.findIndex((s) => s.type === type && s.row === r && s.col === c);
        return idx >= 0 ? prev.filter((_, i) => i !== idx) : [...prev, { type, row: r, col: c }];
      });
    };

    // 울타리 확정 / 개량+울타리 완료 / 기타 pending 확정
    const handlePendingConfirm = () => {
      if (!rp) return;
      if (rp === 'pending_fence') {
        submit('pending_confirm', { segments: pendingFenceSegments });
        setPendingFenceSegments([]);
      } else {
        submit('pending_confirm', {});
      }
    };

    // 동물 배치 (목장/집)
    const handleAnimalPlace = (destination: number | 'house') => {
      if (!pendingAnimalPlacement) return;
      submit('place_animal', { animalType: pendingAnimalPlacement, destination });
      setPendingAnimalPlacement(null);
    };

    // 교체 모드: 기존 동물 제거 → 자동 재배치
    const handleAnimalRemove = (location: { type: 'pasture'; index: number } | { type: 'house' }) => {
      if (!pendingAnimalPlacement) return;
      submit('remove_animal', { animalType: pendingAnimalPlacement, location });
      setPendingAnimalPlacement(null);
      setAnimalRemovalMode(false);
    };

    const handleCancelReplace = () => {
      if (!pendingAnimalPlacement) return;
      submit('cancel_replace', { animalType: pendingAnimalPlacement });
      setPendingAnimalPlacement(null);
      setAnimalRemovalMode(false);
    };

    // 오버플로우 모달 핸들러
    const handleOverflowReplace = () => {
      setOverflowChoice(null);
      setAnimalRemovalMode(true);
    };
    const handleOverflowCook = () => {
      if (!overflowChoice) return;
      submit('overflow_cook', { animalType: overflowChoice });
      setOverflowChoice(null);
      setPendingAnimalPlacement(null);
    };
    const handleOverflowDiscard = () => {
      if (!overflowChoice) return;
      submit('overflow_discard', { animalType: overflowChoice });
      setOverflowChoice(null);
      setPendingAnimalPlacement(null);
    };

    // 언제든 요리
    const handleCookAnimal = (source: AnimalSource) => {
      submit('cook_animal', { source });
    };

    // animal_select 반영: gs.roundPhase 가 pending_animal_choice 로 오면 UI 가 안내
    // (실제 동물 선택 버튼은 Cycle 4.3 에서 — 현재는 일단 표기만)
    return (
      <div className="min-h-screen bg-amber-50 p-3">
        <div className="max-w-md mx-auto space-y-3">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-amber-800">{mePlayer?.name ?? '-'}</h1>
              <p className="text-[11px] text-gray-500">
                R{gs?.round ?? 0}·S{gs?.stage ?? 0} · 방 {roomCode}
              </p>
            </div>
            <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
              isMyTurn ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600'
            }`}>
              {isMyTurn ? '🎯 내 차례' : '대기 중'}
            </span>
          </div>

          {/* pending 단계 안내 배너 */}
          {isMyTurn && rp && rp !== 'work' && (
            <div className="px-3 py-2 bg-amber-50 border-2 border-amber-500 rounded-lg text-xs text-amber-800">
              <strong>단계:</strong> {rp}
              {rp === 'pending_plow' && ' — 농장에서 밭 놓을 셀 선택'}
              {rp === 'pending_plow_sow' && ' — 먼저 밭 갈 셀 선택'}
              {rp === 'pending_sow' && ' — 씨 뿌릴 밭 선택'}
              {rp === 'pending_fence' && ' — 울타리 세그먼트 선택 후 확인'}
              {rp === 'pending_renovate' && ' — 집 개량 비용 지불'}
              {rp === 'pending_renovate_fence' && ' — 집 개량 후 울타리 세그먼트 선택'}
              {rp === 'pending_family_growth' && ' — 가족 늘리기 (빈 방 필요)'}
              {rp === 'pending_family_growth_urgent' && ' — 가족 늘리기 (방 불필요)'}
              {rp === 'pending_build_room' && ' — 방 건설할 빈 셀 선택'}
              {rp === 'pending_build_stable' && ' — 외양간 건설할 셀 선택'}
              {(rp === 'pending_family_growth' || rp === 'pending_family_growth_urgent' ||
                rp === 'pending_renovate' || rp === 'pending_fence') && (
                <button
                  onClick={handlePendingConfirm}
                  className="ml-2 px-3 py-1 bg-amber-600 text-white rounded font-medium hover:bg-amber-700"
                >
                  확인
                </button>
              )}
            </div>
          )}

          {/* 교체 모드 배너 */}
          {replaceModeActive && (
            <div className="px-3 py-2 bg-red-50 border-2 border-red-500 rounded-lg text-xs text-red-800">
              <strong>교체:</strong> 버릴 동물 위치의 ❌ 선택
              <button
                onClick={handleCancelReplace}
                className="ml-2 px-2 py-0.5 bg-white border border-red-400 text-red-700 rounded text-[11px]"
              >
                취소
              </button>
            </div>
          )}

          {/* 내 농장판 */}
          {mePlayer && myPid && (
            <div className="bg-white rounded-2xl shadow-lg p-2 flex justify-center">
              <FarmBoard
                board={mePlayer.farm}
                familySize={mePlayer.familySize}
                deployedCount={gs ? (Object.values(gs.actionSpaces).filter((s) => s.workerId === myPid).length + gs.revealedRoundCards.filter((rc) => rc.workerId === myPid).length) : 0}
                selectedFamilyCell={selectedFamilyCell}
                playerColor={mePlayer.color}
                isStartingPlayer={gs?.startingPlayerToken === myPid}
                onCellClick={handleCellClick}
                onFamilyMemberClick={handleFamilyMemberClick}
                onFenceClick={handleFenceClick}
                fencingMode={isFenceMode}
                pendingFenceSegments={pendingFenceSegments}
                animalPlacementType={pendingAnimalActive ? pendingAnimalPlacement : null}
                onAnimalPlace={pendingAnimalActive ? handleAnimalPlace : undefined}
                animalRemovalMode={!!replaceModeActive}
                onAnimalRemove={replaceModeActive ? handleAnimalRemove : undefined}
              />
            </div>
          )}

          {/* 자원 패널 */}
          {mePlayer && (
            <ResourcePanel player={mePlayer} />
          )}

          {/* 내 손패 */}
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <h2 className="text-xs font-bold text-gray-700 mb-2">
              🔒 내 손패 ({(myHand?.occupations.length ?? 0) + (myHand?.minorImprovements.length ?? 0)}장)
            </h2>
            {(!myHand || (myHand.occupations.length === 0 && myHand.minorImprovements.length === 0)) ? (
              <p className="text-xs text-gray-400 py-2 text-center">
                카드 없음 (Phase 2 에서 카드 배분 예정)
              </p>
            ) : (
              <div className="space-y-1 text-xs">
                {myHand.occupations.map((c) => (
                  <div key={c.id} className="p-1.5 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-[10px] text-blue-700 font-mono mr-1">{c.id}</span>
                    {c.nameKo}
                  </div>
                ))}
                {myHand.minorImprovements.map((c) => (
                  <div key={c.id} className="p-1.5 bg-green-50 border border-green-200 rounded">
                    <span className="text-[10px] text-green-700 font-mono mr-1">{c.id}</span>
                    {c.nameKo}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 행동 공간 */}
          {gs && myPid && (
            <div className="bg-white rounded-2xl shadow-lg p-2">
              <h2 className="text-xs font-bold text-gray-700 mb-2 px-1">행동 공간</h2>
              <ActionBoard
                state={gs}
                currentPlayerId={myPid}
                workerReady={canAct && !!selectedFamilyCell}
                onActionSelect={canAct ? handleActionSelect : undefined}
              />
            </div>
          )}

          {/* 언제든 요리 버튼 */}
          {gs && myPid && mePlayer && hasCookingFacility(gs, myPid) && findAnimalSources(gs, myPid).length > 0 && (
            <button
              onClick={() => setShowCookingModal(true)}
              className="w-full py-2 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700"
            >
              🔥 동물 요리
            </button>
          )}

          {/* 오버플로우 모달 */}
          {overflowChoice && (
            <AnimalOverflowModal
              animalType={overflowChoice}
              foodRate={ANIMAL_TO_FOOD_RATES[overflowChoice] ?? 0}
              canCook={gs && myPid ? hasCookingFacility(gs, myPid) : false}
              onReplace={handleOverflowReplace}
              onCook={handleOverflowCook}
              onDiscard={handleOverflowDiscard}
            />
          )}

          {/* 요리 모달 */}
          {showCookingModal && gs && myPid && (
            <CookAnimalModal
              sources={findAnimalSources(gs, myPid)}
              onCook={handleCookAnimal}
              onClose={() => setShowCookingModal(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-amber-800 mb-1 text-center">🌾 아그리콜라</h1>
        <p className="text-center text-xs text-gray-500 mb-4">
          방 <span className="font-mono font-bold">{roomCode}</span>
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">내 설정</h2>
          {me ? (
            <>
              <div className="mb-3 text-sm">
                <span className="text-gray-500">이름:</span>
                <span className="ml-2 font-medium">{me.name}</span>
              </div>
              <div className="mb-2 text-xs font-medium text-gray-600">색상</div>
              <div className="flex gap-2">
                {COLORS.map((c) => {
                  const taken = usedColors.has(c);
                  const selected = me.color === c;
                  return (
                    <button
                      key={c}
                      disabled={taken && !selected}
                      onClick={() => handleColorChange(c)}
                      className={[
                        'w-10 h-10 rounded-full border-2 transition-all',
                        c === 'red' ? 'bg-red-500' :
                        c === 'blue' ? 'bg-blue-500' :
                        c === 'green' ? 'bg-green-500' : 'bg-yellow-400',
                        selected ? 'ring-2 ring-offset-2 ring-amber-600 scale-110' :
                        taken ? 'opacity-25 cursor-not-allowed' : 'hover:scale-110',
                      ].join(' ')}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">세션 복구 중...</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            대기 중 ({lobbyPlayers.length}/{snapshot?.meta?.desiredPlayerCount ?? '?'})
          </h2>
          <div className="space-y-2">
            {lobbyPlayers.map((p) => (
              <div key={p.pid} className="flex items-center gap-3 py-1.5">
                <span
                  className={`w-3 h-3 rounded-full ${
                    p.color === 'red' ? 'bg-red-500' :
                    p.color === 'blue' ? 'bg-blue-500' :
                    p.color === 'green' ? 'bg-green-500' : 'bg-yellow-400'
                  }`}
                />
                <span className={`flex-1 text-sm ${p.pid === myPid ? 'font-bold' : ''}`}>
                  {p.name} {p.pid === myPid && <span className="text-xs text-amber-600">(나)</span>}
                </span>
                <span className={`text-[10px] ${p.connected ? 'text-green-600' : 'text-gray-400'}`}>
                  {p.connected ? '●' : '○'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            호스트가 게임을 시작할 때까지 대기
          </p>
        </div>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      {children}
    </div>
  );
}

