/**
 * Agricola 온라인 호스트 페이지 (아이패드)
 *
 * 상태: Cycle 2 (로비) → Cycle 3 (게임) 단계적 구현 예정
 * 현재: Stub — 방 생성 + QR 표시까지만
 */

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoom, subscribeRoom, deleteRoom } from '../lib/firebase-room.js';
import type { RoomSnapshot } from '../lib/types.js';

interface OnlineGamePageProps {
  onGoHome: () => void;
}

export default function OnlineGamePage({ onGoHome }: OnlineGamePageProps) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
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

  // 구독
  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeRoom(roomCode, (snap) => setSnapshot(snap));
    return () => unsub();
  }, [roomCode]);

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

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-amber-800">🌾 아그리콜라 — 호스트</h1>
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
              <p className="text-xs text-gray-500 text-center mt-1">
                각자 폰 카메라로 QR 스캔 또는 위 코드 입력
              </p>
            </div>
          </div>

          {/* 로비 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">대기실</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">목표 인원</label>
              <div className="flex gap-2">
                {([2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors ${
                      playerCount === n
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                    disabled={lobbyPlayers.length > 0}
                  >
                    {n}인
                  </button>
                ))}
              </div>
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
              disabled={lobbyPlayers.length < playerCount}
              onClick={() => alert('게임 시작 — Cycle 3 에서 구현 예정')}
            >
              {lobbyPlayers.length < playerCount
                ? `${playerCount - lobbyPlayers.length}명 더 필요`
                : '게임 시작'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <strong>개발 중:</strong> 현재 로비까지만 구현. 게임 진행(온라인)은 Cycle 3 에서 추가 예정.
          오프라인 모드는 <code>?game=agricola-local</code> 로 접속.
        </div>
      </div>
    </div>
  );
}
