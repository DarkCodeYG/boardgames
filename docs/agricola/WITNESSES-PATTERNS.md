# Witnesses → Agricola Phase B 참조 패턴

> 조사 대상: `src/games/witnesses/` Firebase RTDB 하이브리드 구현
> 목적: Agricola Phase B(호스트/클라이언트 분리) 설계 시 재사용 가능한 패턴 정리

---

## 1. Firebase 초기화 및 DB 구조

**초기화는 단일 모듈에 공유** — `src/lib/firebase.ts:1-15` 에서 `initializeApp` + `getDatabase()` 로 `db` export. 모든 게임이 이 하나만 import.

**방 코드: 4자리 base36 대문자** — `firebase-room.ts:5-7`
```ts
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}
```
생성 시 `get()` 으로 충돌 확인 후 최대 10회 재시도(`firebase-room.ts:14-21`).

**경로 설계 (flat)** — `rooms/{code}/` 하위에 `phase`, `players/{pid}`, `missions/[round]/votes/{pid}`, `playerInfos/{pid}`, `playerMapping`, `voteDeadline`, `lang` 등이 평면으로 배치.

**리스너는 `onValue` 단일 구독 + 지역 분기** — `firebase-room.ts:94-98`
```ts
export function subscribeRoom(code: string, callback): Unsubscribe {
  return onValue(roomRef(code), (snapshot) => callback(snapshot.val()));
}
```
`onChildAdded`/`onChildChanged` 는 쓰지 않고, 전체 방 스냅샷을 받아 호출측에서 diff 판단. 단순함이 장점.

**Agricola 적용 제안**: 동일한 `rooms/{code}/` 네임스페이스를 그대로 사용하고, 게임 구분은 `game: 'agricola'` 메타 필드로. `onChildAdded` 는 `rooms/{code}/actions/` 큐에 대해서만 호스트가 구독 → 나머지 `gameState` 는 `onValue` 로 전 클라이언트 구독.

**연결 관리**: Witnesses 는 `onDisconnect`/heartbeat 를 **사용하지 않는다**. 대신 `beforeunload` 에서 `navigator.sendBeacon` + `deleteRoom` 으로 방 자체를 날린다 (`OnlineGamePage.tsx:62-74`). Agricola 는 게임 길이가 길어 이 방식은 위험 → `onDisconnect(playerRef).update({ connected: false })` 도입 필요(Phase B.2 heartbeat).

---

## 2. 호스트/클라이언트 역할 분리

**호스트(아이패드) = 엔진 실행자 + phase 게이트**
- `createRoom` 호출(`OnlineGamePage.tsx:81`)
- 게임 엔진 순수함수(`createGame → addPlayer → startGame`) 를 호스트 로컬에서 실행하고 결과를 `setGameState` 로 전체 덮어씀(`OnlineGamePage.tsx:310-339`)
- 투표/봉사 결과 집계도 호스트가 Firebase 에서 읽어 엔진에 먹임(`handleAfterVoteResult`, `handleRevealMissionResult`: `OnlineGamePage.tsx:351-434`)
- phase 전환 권한을 호스트만 가짐 (`confirm-mission`, `confirm-mission-result` 등 호스트 전용 게이트가 많음)

**클라이언트(폰) = 좁은 영역 write + 전체 read**
- 참가: `joinRoom` transaction (`firebase-room.ts:33-71`)
- 액션 제출: `submitAction(code, 'missions/0/votes/p3', true)` 식으로 **자기 경로만** 직접 set (`PlayerPage.tsx:582-584`, `:628-631`)
- 인도자는 phase 변경도 직접(`PlayerPage.tsx:497-499`) — teamIds → voteDeadline → phase 순서로 3회 set

**중복 실행 방지**
- 투표 완료 판정은 `votes` 개수 == 플레이어 수 일 때만, `hostPhaseRef.current === 'waiting-vote'` 가드로 1회만 (`OnlineGamePage.tsx:131-136`)
- 인도자 팀 제출은 `isConfirming` 로컬 플래그로 중복 클릭 차단(`PlayerPage.tsx:493-506`)

**Agricola 적용 제안**:
- Witnesses 의 "호스트가 읽어서 엔진 돌리고 전체 재set" 패턴은 Agricola 처럼 상태가 큰 게임엔 부담. → `actions/` 큐 push + 호스트 `onChildAdded` 리스너가 엔진 한 스텝 실행 후 `gameState` 부분 update.
- 클라이언트 액션은 반드시 `actions/{pushId}` 로만, `gameState` 에는 절대 직접 쓰지 않음 → 보안 규칙으로 강제.

---

## 3. URL 라우팅 규칙

**App.tsx 의 단일 useEffect + URLSearchParams** — `App.tsx:47-74`
```ts
if (game === 'witnesses-online' && params.get('room')) {
  setPage('witnesses-player');
}
```
호스트는 URL 파라미터 없이 홈→게임 클릭으로 진입. 클라이언트는 QR(`?game=witnesses-online&room=XXXX&lang=ko`)을 스캔하면 자동으로 `witnesses-player` 로 라우팅.

**QR URL 포맷** — `OnlineGamePage.tsx:210`
```ts
const joinUrl = `${window.location.origin}${window.location.pathname}?game=witnesses-online&room=${roomCode}&lang=${lang}`;
```
QR 생성은 `qrcode.react` 의 `QRCodeSVG` (`OnlineGamePage.tsx:1, :678`).

**Agricola 적용 제안**: Phase B 계획에 명시된 대로 `?game=agricola&room=XXXX` 는 호스트, 추가 `&player=N` 분기로 클라이언트. Witnesses 와 달리 Agricola 는 **player 인덱스**가 아닌 **playerId**(Firebase push key) 로 설계 권장 — 4인 게임에서 좌석이 고정되므로 URL 은 room 만 담고, 폰이 `joinRoom` 후 받은 pid 를 sessionStorage 로 기억(`PlayerPage.tsx:40-76`).

---

## 4. 상태 동기화 라이프사이클

**호스트 — mount 시 방 생성 + 구독, unmount 시 방 삭제** — `OnlineGamePage.tsx:77-91, :94-157`
```ts
useEffect(() => {
  createRoom(enabledRoles, MAX_PLAYERS, globalLang).then(setRoomCode);
}, []);
useEffect(() => {
  if (!roomCode) return;
  return subscribeRoom(roomCode, (data) => { ... });
}, [roomCode, game?.players.length]);
```
리스너 unsub 는 return 문으로. `prevPhaseRef` 로 phase 전이 감지(`:104`), `hostPhaseRef`/`roomCodeRef` 로 클로저 내 최신값 접근(`:58-59`).

**클라이언트 — URL 에서 roomCode 읽고 join 후 구독** — `PlayerPage.tsx:40-76, :91-164`
- sessionStorage(`witnesses_session_${r}`)로 새로고침 시 자동 재접속
- localStorage 는 이름 pre-fill 용으로만 구분 — 새 탭에서는 재접속 안 함

**Zustand vs Firebase 관계**: Witnesses 는 store 를 사실상 **안 씀**. `store/game-store.ts` 는 오프라인용 껍데기이고 OnlineGamePage 는 모두 로컬 `useState` + Firebase 로 관리. → Zustand 의 전역성 이점이 사라짐.

**Agricola 적용 제안**:
- 기존 `useAgricolaStore` 는 오프라인 모드(`?game=agricola-local`) 전용으로 유지.
- 온라인 모드는 `subscribeRoom` 콜백에서 **Zustand store 에 setGameState** 해주면 기존 컴포넌트를 거의 그대로 재사용 가능 (Witnesses 가 놓친 기회).
- 리스너 해제는 반드시 useEffect return 으로. `roomCodeRef` 패턴을 Agricola 의 `beforeunload` 에도 그대로 적용.

---

## 5. 액션 제출 패턴

**Witnesses: 직접 write 방식 (큐 없음)** — `PlayerPage.tsx:582-584`
```ts
const handleVote = async (approve: boolean) => {
  await submitAction(roomCode, `missions/${currentRound}/votes/${myGameId}`, approve);
};
```
- 클라이언트가 자기 경로에 직접 `set`. 검증은 없음 (증인이 실패 카드 못 내는 규칙조차 클라이언트 `finalValue = isWitness ? true : success` 로 강제: `PlayerPage.tsx:629`).
- 집계와 phase 전이는 호스트가 onValue 콜백에서 트리거.
- **optimistic update 없음** — 버튼 누르면 `alreadyVoted` UI 업데이트는 Firebase round-trip 후에 반영됨. 레이턴시가 작아서 괜찮음.

**Agricola 적용 제안**: 증인 게임보다 규칙이 복잡해 클라이언트 신뢰 모델은 위험. **action queue 패턴 필수**:
```
rooms/{code}/actions/{pushKey} = { playerId, kind, payload, status: 'pending' }
```
- 호스트 `onChildAdded(actionsRef)` 리스너 → 엔진 검증 → 성공 시 `gameState` update + `status: 'applied'`, 실패 시 `status: 'rejected', reason`.
- 클라이언트는 자기가 push 한 action 의 status 만 구독.
- Optimistic update 는 피하고, pending 동안 버튼 disabled (Witnesses 의 `isConfirming` 패턴 확장).

---

## 6. 에러 처리

**방 생성 타임아웃** — `OnlineGamePage.tsx:77-91`
```ts
const timer = setTimeout(() => {
  if (!roomCode) setRoomError('Firebase 연결 시간 초과...');
}, 8000);
```

**방 삭제 감지 (클라이언트)** — `PlayerPage.tsx:99-111`
```ts
if (!data) {
  if (!roomNullTimerRef.current) {
    roomNullTimerRef.current = setTimeout(() => setPhase('ended'), 3000);
  }
  return;
}
```
Firebase 일시 null 스냅샷의 오탐지를 방지하려 **3초 디바운스**.

**참가자 아님 감지** — `PlayerPage.tsx:126-129`: 게임 진행중인데 `playerMapping[myPid]` 가 없으면 `not-participant` 화면.

**투표 타임아웃 자동 기권** — `PlayerPage.tsx:331-341` (클라이언트) + `OnlineGamePage.tsx:198-206` (호스트 안전망): 60초 후 미투표자 자동 `false` 제출. 클라이언트+호스트 둘 다 시도(양쪽 중 먼저 도달한 쪽이 set, 같은 값이므로 충돌 무해).

**잘못된 액션 거부**: Witnesses 는 거부 메커니즘이 **없음**. 규칙 위반은 UI 레벨에서만 막음(예: 증인은 성공 버튼만 보임 `:642-645`).

**Agricola 적용 제안**:
- 방 null 디바운스(3초) 패턴 그대로 채택.
- 액션 큐 `status: 'rejected'` + `reason` 으로 명시적 거부 UX. 예: "해당 칸은 이미 점유됨", "필요 자원 부족".
- 호스트 디스커넥트 대응은 Witnesses 가 안 다룬 영역 → `onDisconnect(roomRef).update({ hostDisconnectedAt: serverTimestamp() })` + 재진입 시 감지.

---

## 7. 요약 체크리스트 (Agricola Phase B 착수 시)

- [ ] `lib/firebase.ts` 기존 `db` 재사용 (새 초기화 금지)
- [ ] `rooms/{code}/` 경로, 4자리 base36 코드, 충돌 재시도 10회
- [ ] 참가는 `runTransaction` 으로 중복·full·reconnect 판별
- [ ] QR URL: `?game=agricola&room=XXXX&lang=ko` (player 인덱스는 URL 금지, sessionStorage)
- [ ] 호스트: `createRoom → subscribeRoom → onChildAdded(actions)` / 언마운트 시 `deleteRoom` + `beforeunload sendBeacon`
- [ ] 클라이언트: URL 읽기 → sessionStorage 재접속 시도 → 이름 입력 → `joinRoom` → `subscribeRoom`
- [ ] 액션 제출은 반드시 `actions/{pushKey}` 큐 (직접 gameState write 금지)
- [ ] 검증/엔진 실행은 호스트 단독 (`game-engine.ts` 순수함수 그대로 재사용)
- [ ] `privateHands/{pid}` 는 RTDB 보안 규칙으로 본인+호스트만 read
- [ ] 리스너 클로저 문제는 `xxxRef = useRef()` + `useEffect(() => { ref.current = xxx }, [xxx])` 로 해결
- [ ] 방 null 스냅샷은 3초 디바운스 후 `ended` 처리
- [ ] 중복 실행 방지: 로컬 `isSubmitting` 플래그 + phase 가드

---

**핵심 참고 파일**
- `/Users/inhwankim/git/boardgames/src/games/witnesses/lib/firebase-room.ts`
- `/Users/inhwankim/git/boardgames/src/games/witnesses/pages/OnlineGamePage.tsx` (특히 :62-206 생명주기)
- `/Users/inhwankim/git/boardgames/src/games/witnesses/pages/PlayerPage.tsx` (특히 :40-164 진입/구독)
- `/Users/inhwankim/git/boardgames/src/App.tsx:47-74` (URL 라우팅)
- `/Users/inhwankim/git/boardgames/src/lib/firebase.ts`
