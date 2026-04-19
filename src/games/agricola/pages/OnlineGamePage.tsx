/**
 * Agricola 온라인 호스트 페이지 (아이패드)
 *
 * 상태: Cycle 2 (로비) → Cycle 3 (게임) 단계적 구현 예정
 * 현재: Stub — 방 생성 + QR 표시까지만
 */

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, update } from 'firebase/database';
import { db } from '../../../lib/firebase.js';
import {
  createRoom, subscribeRoom, subscribeActions, deleteRoom,
  startGame as commitStartGame, submitAction,
  updateGameState, markActionApplied, markActionRejected,
} from '../lib/firebase-room.js';
import {
  createGameState, startRound, replenishActionSpaces, countPlacedWorkers,
} from '../lib/game-engine.js';
import { dispatchAction } from '../lib/action-dispatcher.js';
import { hydrateGameState } from '../lib/state-serializer.js';
import type { RoomSnapshot, GameState, PrivateHand, PlayerId } from '../lib/types.js';
import FarmBoard from '../components/FarmBoard.js';
import ActionBoard from '../components/ActionBoard.js';

interface OnlineGamePageProps {
  onGoHome: () => void;
}

export default function OnlineGamePage({ onGoHome }: OnlineGamePageProps) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [starting, setStarting] = useState(false);
  const roomCodeRef = useRef<string | null>(null);

  // 호스트 세션 ID 고정 (새로고침 대비)
  const hostSessionIdRef = useRef<string>(
    sessionStorage.getItem('agricola_host_session') ??
    `host_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
  );
  useEffect(() => {
    sessionStorage.setItem('agricola_host_session', hostSessionIdRef.current);
  }, []);

  // 방 생성
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!roomCodeRef.current && !cancelled) {
        setRoomError('Firebase 연결 시간 초과. 네트워크 확인 후 새로고침하세요.');
      }
    }, 8000);

    createRoom({
      hostSessionId: hostSessionIdRef.current,
      desiredPlayerCount: playerCount,
      lang: 'ko',
    })
      .then((code) => {
        if (cancelled) return;
        roomCodeRef.current = code;
        setRoomCode(code);
        clearTimeout(timer);
      })
      .catch((e) => {
        if (cancelled) return;
        setRoomError(`방 생성 실패: ${(e as Error).message}`);
        clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 한 번만

  // 구독 — 방 스냅샷
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeRoom(roomCode, (snap) => {
      setSnapshot(snap);
      // meta.desiredPlayerCount 변경 시 로컬 state 동기화 (다른 탭/새로고침 대비)
      if (snap?.meta?.desiredPlayerCount && snap.meta.desiredPlayerCount !== playerCount) {
        setPlayerCount(snap.meta.desiredPlayerCount);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // snapshot 최신값 ref (클로저 캡처 문제 해결)
  const snapshotRef = useRef<RoomSnapshot | null>(null);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);

  // 구독 — actions 큐 (호스트 디스패처)
  useEffect(() => {
    if (!roomCode) return;
    const processingActions = new Set<string>();
    const unsub = subscribeActions(roomCode, async (actionId, action) => {
      // 이미 처리 중/완료 스킵
      if (processingActions.has(actionId)) return;
      processingActions.add(actionId);

      const snap = snapshotRef.current;
      if (!snap?.gameState) {
        await markActionRejected(roomCode, actionId, '게임이 시작되지 않았습니다');
        return;
      }

      try {
        // Firebase 에서 읽은 state 는 함수 필드 제거됨 → hydrate 후 엔진 호출
        const hydrated = hydrateGameState(snap.gameState);
        const result = dispatchAction(hydrated, action);
        await updateGameState(roomCode, result.nextState);
        await markActionApplied(roomCode, actionId);
      } catch (e) {
        await markActionRejected(roomCode, actionId, (e as Error).message);
      }
    });
    return () => unsub();
  }, [roomCode]);

  // 게임 시작: 로비에서 플레이어 정보 수집 → createGameState → RTDB 커밋
  async function handleStartGame() {
    if (starting) return;
    if (!roomCode) return;
    const lobby = snapshot?.lobby ?? {};
    const lobbyPlayers = Object.values(lobby);
    const target = snapshot?.meta?.desiredPlayerCount ?? playerCount;
    if (lobbyPlayers.length !== target) {
      alert(`인원이 맞지 않습니다 (${lobbyPlayers.length}/${target})`);
      return;
    }
    setStarting(true);
    try {
      // 참가 순서대로 정렬 (joinedAt 오름차순)
      lobbyPlayers.sort((a, b) => a.joinedAt - b.joinedAt);
      const playerIds = lobbyPlayers.map((p) => p.pid);
      const playerNames = lobbyPlayers.map((p) => p.name);
      const playerColors = lobbyPlayers.map((p) => p.color);

      let state = createGameState({
        playerCount,
        playerNames,
        playerColors,
        playerIds,
        deck: 'AB',
      });
      state = startRound(state);
      state = replenishActionSpaces(state);
      state = { ...state, phase: 'playing' };

      // 손패 격리 — privateHands/{pid} 로 분리 (현재 Phase 1: 빈 배열)
      const privateHands: Record<PlayerId, PrivateHand> = {};
      const publicState: GameState = {
        ...state,
        players: Object.fromEntries(
          Object.entries(state.players).map(([pid, p]) => {
            privateHands[pid] = {
              occupations: p.hand.occupations,
              minorImprovements: p.hand.minorImprovements,
            };
            return [pid, { ...p, hand: { occupations: [], minorImprovements: [] } }];
          }),
        ),
      };

      await commitStartGame(roomCode, publicState, privateHands);
    } catch (e) {
      alert(`게임 시작 실패: ${(e as Error).message}`);
    } finally {
      setStarting(false);
    }
  }

  // 언마운트 / 페이지 떠남 시 방 삭제
  useEffect(() => {
    const handler = () => {
      const code = roomCodeRef.current;
      if (code) {
        // beforeunload 에서 async 불가 — deleteRoom 은 best-effort
        deleteRoom(code).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      if (roomCodeRef.current) deleteRoom(roomCodeRef.current).catch(() => {});
    };
  }, []);

  if (roomError) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-700 mb-3">연결 오류</h2>
          <p className="text-sm text-gray-700 mb-6">{roomError}</p>
          <button
            onClick={onGoHome}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <p className="text-gray-600">방을 생성 중입니다...</p>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}${window.location.pathname}?game=agricola&room=${roomCode}&lang=ko`;
  const lobby = snapshot?.lobby ?? {};
  const lobbyPlayers = Object.values(lobby);
  const metaPhase = snapshot?.meta?.phase ?? 'lobby';

  // 게임 진행 중 — 호스트는 전체 상태 모니터링 (읽기 전용)
  if (metaPhase === 'playing' && snapshot?.gameState) {
    const gs = snapshot.gameState;
    const currentPid = gs.playerOrder[gs.currentPlayerIndex] ?? '';
    const currentPlayer = gs.players[currentPid];
    return (
      <div className="min-h-screen bg-amber-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h1 className="text-2xl font-bold text-amber-800">🌾 아그리콜라 — 호스트</h1>
              <p className="text-xs text-gray-500">
                라운드 {gs.round}/14 · 스테이지 {gs.stage} · 방 <span className="font-mono">{roomCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-white border-2 border-amber-400 rounded-lg">
                <p className="text-xs text-gray-500">현재 차례</p>
                <p className="font-bold text-amber-800">{currentPlayer?.name ?? '-'}</p>
              </div>
              {(() => {
                // 수확 진행 중: harvest_confirm 버튼
                if (gs.phase === 'harvest' && gs.harvestPlayerIndex != null) {
                  const hPid = gs.playerOrder[gs.harvestPlayerIndex];
                  const hPlayer = hPid ? gs.players[hPid] : undefined;
                  return (
                    <button
                      onClick={() => {
                        submitAction(roomCode, {
                          playerId: hPid ?? '',
                          kind: 'harvest_confirm',
                          payload: {},
                        }).catch((e) => alert(`수확 실패: ${(e as Error).message}`));
                      }}
                      className="px-4 py-2 text-sm bg-orange-600 text-white rounded font-medium hover:bg-orange-700"
                    >
                      🌾 수확 확정 ({hPlayer?.name ?? '-'}) →
                    </button>
                  );
                }
                // 모든 플레이어 가족 말 배치 완료 → 라운드 종료
                const allDone = gs.playerOrder.every((pid) => {
                  const p = gs.players[pid];
                  return p && countPlacedWorkers(gs, pid) >= p.familySize;
                });
                if (!allDone) return null;
                return (
                  <button
                    onClick={() => {
                      submitAction(roomCode, {
                        playerId: currentPid || gs.playerOrder[0] || '',
                        kind: 'end_round',
                        payload: {},
                      }).catch((e) => alert(`라운드 종료 실패: ${(e as Error).message}`));
                    }}
                    className="px-4 py-2 text-sm bg-amber-600 text-white rounded font-medium hover:bg-amber-700"
                  >
                    라운드 종료 →
                  </button>
                );
              })()}
              <button
                onClick={async () => {
                  if (confirm('게임을 종료하시겠습니까? 방이 삭제됩니다.')) {
                    if (roomCodeRef.current) await deleteRoom(roomCodeRef.current);
                    onGoHome();
                  }
                }}
                className="px-3 py-1.5 text-sm bg-red-50 border border-red-300 text-red-700 rounded hover:bg-red-100"
              >
                종료
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_minmax(0,400px)] gap-4">
            {/* 왼쪽: 행동 공간 */}
            <div className="bg-white rounded-xl shadow p-3">
              <h2 className="text-sm font-bold text-gray-700 mb-2">행동 공간</h2>
              <ActionBoard state={gs} currentPlayerId={currentPid} />
            </div>

            {/* 오른쪽: 모든 플레이어 농장판 */}
            <div className="space-y-3">
              {gs.playerOrder.map((pid) => {
                const p = gs.players[pid];
                if (!p) return null;
                const isActive = pid === currentPid;
                return (
                  <div
                    key={pid}
                    className={`rounded-xl border-2 overflow-hidden ${
                      isActive ? 'border-amber-500 ring-2 ring-amber-300' : 'border-gray-200'
                    }`}
                  >
                    <div className={`px-3 py-1.5 flex items-center gap-2 ${
                      p.color === 'red' ? 'bg-red-100 text-red-900' :
                      p.color === 'blue' ? 'bg-blue-100 text-blue-900' :
                      p.color === 'green' ? 'bg-green-100 text-green-900' :
                      'bg-yellow-100 text-yellow-900'
                    }`}>
                      <span className="font-bold text-sm">
                        {isActive && '▶ '}{p.name}
                        {gs.startingPlayerToken === pid && <span className="ml-1 text-yellow-600">⭐</span>}
                      </span>
                      <span className="ml-auto text-xs">가족 {p.familySize} · 🍖 {p.resources.food}</span>
                    </div>
                    <div className="p-2 bg-white">
                      <FarmBoard
                        board={p.farm}
                        familySize={p.familySize}
                        deployedCount={0}
                        playerColor={p.color}
                        isStartingPlayer={gs.startingPlayerToken === pid}
                      />
                      {/* 축약 자원 */}
                      <div className="mt-2 grid grid-cols-5 gap-1 text-[11px]">
                        <Cnt icon="🪵" v={p.resources.wood} />
                        <Cnt icon="🧱" v={p.resources.clay} />
                        <Cnt icon="🪨" v={p.resources.stone} />
                        <Cnt icon="🌿" v={p.resources.reed} />
                        <Cnt icon="🌾" v={p.resources.grain} />
                        <Cnt icon="🥕" v={p.resources.vegetable} />
                        <Cnt icon="🐑" v={p.resources.sheep} />
                        <Cnt icon="🐷" v={p.resources.boar} />
                        <Cnt icon="🐄" v={p.resources.cattle} />
                        <Cnt icon="😞" v={p.beggingTokens} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
            <strong>Cycle 4 개발 중:</strong> 현재는 표시 전용. 플레이어 폰에서 행동 제출 → 호스트 디스패처가 엔진 처리 흐름은 다음 사이클에서 완성.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-amber-800">🌾 아그리콜라 — 호스트 (로비)</h1>
          <button
            onClick={onGoHome}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            나가기
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR + 방 코드 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">플레이어 참가</h2>
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-white border-4 border-amber-300 rounded-lg">
                <QRCodeSVG value={joinUrl} size={200} />
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">방 코드</div>
                <div className="text-3xl font-mono font-bold tracking-widest text-amber-800">{roomCode}</div>
              </div>
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block text-center bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs py-2 px-3 rounded-lg transition-colors break-all"
              >
                🔗 {joinUrl.replace(/^https?:\/\//, '')}
              </a>
              <p className="text-xs text-gray-500 text-center mt-1">
                각자 폰 카메라로 QR 스캔 · 방 코드 입력 · 또는 위 링크 클릭
              </p>
            </div>
          </div>

          {/* 로비 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">대기실</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">목표 인원</label>
              <div className="flex gap-2">
                {([2, 3, 4] as const).map((n) => {
                  // 이미 참가한 인원보다 적게 줄일 수 없음
                  const tooSmall = n < lobbyPlayers.length;
                  const isSelected = (snapshot?.meta?.desiredPlayerCount ?? playerCount) === n;
                  return (
                    <button
                      key={n}
                      onClick={async () => {
                        setPlayerCount(n);
                        if (roomCode) {
                          await update(ref(db, `rooms/${roomCode}/meta`), { desiredPlayerCount: n });
                        }
                      }}
                      className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : tooSmall
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 text-gray-600 hover:border-amber-300'
                      }`}
                      disabled={tooSmall}
                    >
                      {n}인
                    </button>
                  );
                })}
              </div>
              {lobbyPlayers.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">
                  이미 참가한 플레이어가 있어 {lobbyPlayers.length}인 미만으로는 줄일 수 없습니다
                </p>
              )}
            </div>

            <div className="space-y-2">
              {lobbyPlayers.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">플레이어 대기 중...</p>
              ) : (
                lobbyPlayers.map((p) => (
                  <div
                    key={p.pid}
                    className="flex items-center gap-3 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <span
                      className={`w-4 h-4 rounded-full ${
                        p.color === 'red' ? 'bg-red-500' :
                        p.color === 'blue' ? 'bg-blue-500' :
                        p.color === 'green' ? 'bg-green-500' : 'bg-yellow-400'
                      }`}
                    />
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className={`text-xs ${p.connected ? 'text-green-600' : 'text-gray-400'}`}>
                      {p.connected ? '● 연결' : '○ 끊김'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              className="w-full mt-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={lobbyPlayers.length < playerCount || starting}
              onClick={handleStartGame}
            >
              {starting
                ? '시작 중...'
                : lobbyPlayers.length < playerCount
                  ? `${playerCount - lobbyPlayers.length}명 더 필요`
                  : '게임 시작'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <strong>개발 중:</strong> Phase B Cycle 3 — 게임 진행 UI 기본 표시까지 구현됨.
          액션 처리는 Cycle 4 에서 완성.
        </div>
      </div>
    </div>
  );
}

function Cnt({ icon, v }: { icon: string; v: number }) {
  return (
    <span className={`flex items-center gap-0.5 py-0.5 px-1 rounded ${v > 0 ? 'bg-amber-100' : 'bg-gray-100 opacity-50'}`}>
      <span aria-hidden="true">{icon}</span>
      <span className="font-bold">{v}</span>
    </span>
  );
}
