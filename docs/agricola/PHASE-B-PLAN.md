# Phase B — 호스트/클라이언트 QR 분리 아키텍처

> 작성: 2026-04-19 · 목표: 단일 디바이스 pass-and-play → 아이패드 호스트 + 폰 클라이언트 멀티디바이스 구조 전환
> 참조 아키텍처: `src/games/witnesses/` (Firebase RTDB 하이브리드)

---

## 0. 목표와 배경

### 현재 문제
- 단일 디바이스 pass-and-play: 턴마다 디바이스 넘겨줘야 함
- 손패(occupations, minor improvements)가 같은 화면에 떠 프라이버시 없음
- 4인 플레이 시 UI가 매우 혼잡

### Phase B 목표
- **호스트(아이패드)**: 전체 농장판·라운드카드·주요설비·깔린 카드·액션 진행 담당. 손패 비표시
- **클라이언트(폰)**: 자기 농장판 + 자기 깔린 카드 + 자기 손패 표시. 자기 턴 때 액션 제출
- **Firebase RTDB 하이브리드**: 게임 상태는 방(room) 단위로 RTDB에 저장. 호스트=권위, 클라이언트=뷰+입력
- **라운드 카드는 호스트 단독 관리** (스테이지 공개 등)

---

## 1. 아키텍처 설계

### 1.1 라우팅 (`src/App.tsx`)

```
?game=agricola                          → HomePage (게임 선택 또는 방 생성 안내)
?game=agricola&room=XXXX                → 호스트 OnlineGamePage
?game=agricola&room=XXXX&player=N       → 플레이어 PlayerPage (N=플레이어 인덱스)
```

### 1.2 Firebase 데이터 구조

```
rooms/{roomCode}/
  meta/
    createdAt: number
    phase: 'lobby' | 'playing' | 'harvest' | 'gameover'
    hostId: string              # 호스트 세션 ID
    playerCount: 2 | 3 | 4
    deck: 'AB'
  players/{playerId}/
    name: string
    color: 'red'|'blue'|'green'|'yellow'
    connected: boolean          # heartbeat 기반
    joinedAt: number
  gameState: GameState          # types.ts 기존 타입 + hands는 players/{pid}/ 아래로 분리
  privateHands/{playerId}/
    occupations: Card[]
    minorImprovements: Card[]
    # 본인만 읽는 영역 (RTDB 보안 규칙)
  actions/{actionId}/
    playerId: string
    timestamp: number
    kind: 'place_worker' | 'plow' | 'sow' | ...
    payload: { ... }
    status: 'pending' | 'applied' | 'rejected'
  log/
    entries: GameLogEntry[]
```

### 1.3 상태 동기화 전략

**호스트 = 유일한 엔진 실행자**:
1. 클라이언트는 `actions/*` 에 요청 push
2. 호스트가 `onChildAdded` 리스너로 수신
3. `game-engine.ts` 순수 함수로 검증 + 상태 전이
4. 새 `gameState` 를 RTDB에 write
5. 모든 클라이언트는 `gameState` 리스너로 최신 상태 수신

**private hands 격리**:
- `privateHands/{pid}` 는 해당 플레이어만 읽기
- 호스트도 읽기 가능 (상태 전이에 필요) — Firebase 보안 규칙으로 관리

### 1.4 오프라인 모드

- 기존 `GamePage.tsx` 는 `?game=agricola-local` 로 분리 유지 (개발·시연용)
- 기본 경로(`?game=agricola`)는 Phase B 온라인 모드로 전환

---

## 2. 작업 단계 (Cycle 단위)

### Cycle 1 — 기초 인프라
1. `lib/firebase-room.ts` — 방 CRUD, 리스너
2. `lib/types.ts` — 온라인 상태 필드 (`connected`, `privateHands` 분리)
3. `App.tsx` — URL 파라미터 라우팅 분기

### Cycle 2 — 로비
1. `pages/HomePage.tsx` 개편 — 방 생성/참가 선택
2. `pages/LobbyHostPage.tsx` 신규 — QR 표시 + 플레이어 대기
3. `pages/LobbyPlayerPage.tsx` 신규 — 이름·색상 선택 → 호스트 대기

### Cycle 3 — 게임 플레이 분리
1. `pages/OnlineGamePage.tsx` 신규 — 기존 GamePage 복제 후 호스트 뷰 축약
2. `pages/PlayerPage.tsx` 신규 — 자기 농장판·손패·턴 액션 제출
3. 상태 동기화 라이프사이클 구성

### Cycle 4 — 액션 프로토콜
1. 모든 클라이언트 액션 → `actions/*` push
2. 호스트 리스너 → 엔진 검증 → `gameState` 업데이트 → ack
3. 에러 처리: 거부된 액션은 `status: 'rejected'` + 사유 표시

### Cycle 5 — 카드 접기/펼치기, 프라이버시 강화
1. 호스트 뷰에서 각 플레이어 카드 섹션 토글
2. 손패는 호스트에서 완전 비표시
3. 플레이어 뷰는 본인 손패만

### Cycle 6 — 테스트·리팩토링·배포
1. 2~4인 시뮬레이션 (여러 브라우저 탭)
2. 끊김·재연결 테스트
3. Firebase 보안 규칙 확정
4. README / 운영 가이드 작성

---

## 3. 위험과 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| Firebase 쿼터 초과 | 배포 후 다운 | 로컬 에뮬레이터 우선 개발 |
| 호스트 디스커넥트 | 게임 중단 | heartbeat + `onDisconnect` 로 호스트 이양 (Phase B.2) |
| 상태 충돌 | 데이터 오염 | 액션 큐 직렬 처리 + 버전 번호 |
| 보안 규칙 누락 | 프라이버시 유출 | `privateHands` 접근 제한 테스트 |

---

## 4. 완료 정의 (Definition of Done)

- [ ] 아이패드 1대 + 폰 2~4대로 2~4인 풀 게임 완주 가능
- [ ] 각 플레이어 손패는 해당 플레이어만 볼 수 있음
- [ ] 호스트는 모든 플레이어의 농장판과 깔린 카드만 보임
- [ ] 라운드 진행·수확·점수 계산이 온라인에서 일관
- [ ] TypeScript 오류 0, 빌드 성공
- [ ] Firebase 보안 규칙 적용

---

## 5. 참조

- `src/games/witnesses/` — 기존 Firebase 하이브리드 예시
- `docs/agricola/03-architecture.md` — 기존 아키텍처 (단일 디바이스)
- `docs/agricola/04-game-rules-ko.md` 및 `korean-rules/` — 규정
- `docs/agricola/Agricola_Revised_Edition_-_Unofficial_Compendium_v4.1.pdf` — 카드/설비 디테일
