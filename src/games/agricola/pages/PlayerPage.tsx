/**
 * Agricola 온라인 플레이어 페이지 (폰)
 *
 * 상태: Cycle 2 (로비 합류) → Cycle 3 (게임 진행) 단계적 구현 예정
 * 현재: 방 참가 + 로비 대기까지만
 */

import { useEffect, useRef, useState } from 'react';
import { joinRoom, subscribeRoom, updateLobbyPlayer, submitAction } from '../lib/firebase-room.js';
import { canPlayerAct } from '../lib/action-dispatcher.js';
import type { RoomSnapshot, PlayerId, LobbyPlayer } from '../lib/types.js';
import FarmBoard from '../components/FarmBoard.js';
import ActionBoard from '../components/ActionBoard.js';
import ResourcePanel from '../components/ResourcePanel.js';

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

          {/* 내 농장판 */}
          {mePlayer && (
            <div className="bg-white rounded-2xl shadow-lg p-2 flex justify-center">
              <FarmBoard
                board={mePlayer.farm}
                familySize={mePlayer.familySize}
                deployedCount={0}
                playerColor={mePlayer.color}
                isStartingPlayer={gs?.startingPlayerToken === myPid}
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
                workerReady={isMyTurn && canPlayerAct(gs, myPid)}
                onActionSelect={
                  isMyTurn && canPlayerAct(gs, myPid)
                    ? (actionSpaceId) => {
                        submitAction(roomCode, {
                          playerId: myPid,
                          kind: 'place_worker',
                          payload: { actionSpaceId },
                        }).catch((e) => alert(`제출 실패: ${(e as Error).message}`));
                      }
                    : undefined
                }
              />
            </div>
          )}

          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[11px] text-yellow-800">
            <strong>Cycle 4 개발 중:</strong> 워커 배치, 가족 선택, 행동 제출은 다음 사이클에서 구현.
          </div>
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

