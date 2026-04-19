# 아그리콜라 Phase B — 사이클 로그

> 각 작업 사이클의 시작/종료/결과 기록.
> 규칙: 사이클 당 1개 섹션. 완료 시 타임스탬프·산출물·검증 결과·다음 사이클 참조 기록.
> 형식: 최신 사이클이 위, 오래된 사이클이 아래로.

---

## Cycle 4.2 — 플레이어 상호작용 wiring ✅ 완료

**시작/완료**: 2026-04-19
**목표**: PlayerPage FarmBoard/Modal 전체 상호작용 → actions 큐 제출

**산출물 (PlayerPage)**:
- 로컬 상태: selectedFamilyCell, pendingFenceSegments, pendingAnimalPlacement, animalRemovalMode, overflowChoice, showCookingModal
- FarmBoard props 완전 wiring: onCellClick/onFamilyMemberClick/onFenceClick/onAnimalPlace/onAnimalRemove
- pending 단계 배너 + "확인" 버튼 (가족 늘리기·개량·울타리)
- 교체 모드 배너 + "취소" 버튼
- FarmBoard fencingMode / pendingFenceSegments / animalPlacementType / animalRemovalMode 연동
- AnimalOverflowModal + CookAnimalModal 렌더링 + submit 핸들러
- "🔥 동물 요리" 외부 버튼 (설비 보유 + 동물 있을 때)

**지원 submitAction 종류 (11종)**:
place_worker, cell_click(5 phase), pending_confirm(가족/개량/울타리), place_animal, remove_animal, overflow_cook/discard, cancel_replace, cook_animal

**검증**: `npm run build` ✅ gzip 290KB

**남은 작업 (Cycle 4.3)**:
- `pending_animal_select` UI — 양/멧돼지/소 선택 버튼 (ActionBoard 이후 2차 선택)
- `animal_select` 후 `pendingAnimalPlacement` 자동 트리거 (gameState 또는 클라이언트 로컬)
- 배치 공간 없음 자동 감지 → AnimalOverflowModal 자동 오픈
- 수확 단계 UI (빵 굽기 선택)
- 호스트의 수확 1인씩 진행 버튼

---

## Cycle 4 — 액션 프로토콜 (기본) ✅ 1차 완료

**시작/완료**: 2026-04-19
**목표**: 클라이언트 → actions/* 큐 → 호스트 디스패처 → 엔진 → gameState 업데이트의 왕복 루프 성립

**산출물**:
- [x] `game-engine.ts` — `countPlacedWorkers`, `advanceToNextPlayer` export (GamePage 로컬에서 분리)
- [x] `lib/action-dispatcher.ts` (신규) — 14 종 ActionKind 중 place_worker, cell_click(5 phase), pending_confirm(가족/개량/울타리), animal_select, place_animal, remove_animal, overflow_(replace|cook|discard), cancel_replace, cook_animal, bake_bread, harvest_confirm, end_round 모두 dispatch
- [x] `OnlineGamePage.tsx` — `subscribeActions` + `dispatchAction` + `markActionApplied|Rejected` 연결. `snapshotRef` 로 클로저 최신값 안전
- [x] `OnlineGamePage.tsx` — 모든 플레이어 워커 배치 완료 시 "라운드 종료" 버튼 노출 → end_round 액션 submit
- [x] `PlayerPage.tsx` — ActionBoard onActionSelect → place_worker submit. `canPlayerAct` 가드

**검증**:
- [x] `npm run build` — 성공 (gzip 288KB)
- [ ] 실제 브라우저 다중 탭 테스트 — 다음 세션 수동 검증 권장

**남은 wiring (Cycle 4.2)**:
- FarmBoard 셀 클릭(밭갈이/씨/방/외양간) → cell_click submit
- 가족 구성원 선택(onFamilyMemberClick) — 로컬 상태 or actions/select_family?
- 울타리 모드(fence_click + pendingFenceSegments) — 로컬 상태 + pending_confirm 제출
- 동물 배치(onAnimalPlace) → place_animal submit
- 동물 교체(onAnimalRemove) → remove_animal submit
- AnimalOverflowModal 3-선택지 → overflow_* submit
- CookAnimalModal → cook_animal submit

**설계 메모**:
- 중복 처리 방지: `processingActions: Set<string>` 로컬 캐시
- 호스트가 단일 디스패처 — 액션은 순서대로 push key 로 정렬되므로 race 없음
- `snapshotRef` 로 subscribeActions 콜백 내부 최신 state 참조 (클로저 함정 회피)

**다음**: Cycle 4.2 — 남은 상호작용 wiring 완성. 또는 Cycle 5 (프라이버시/토글) 먼저 처리 후 Cycle 4.2

---

## Cycle 3 — 게임 UI 이식 (표시 전용) ✅ 완료

**시작/완료**: 2026-04-19
**목표**: 호스트/플레이어 양쪽에 실제 게임 컴포넌트(FarmBoard, ActionBoard, ResourcePanel) 배치. 액션 처리는 Cycle 4

**산출물**:
- [x] `OnlineGamePage.tsx` 게임 진행 화면 — 좌측 ActionBoard(읽기 전용) + 우측 모든 플레이어 농장판 스택 + 축약 자원 표시
- [x] `PlayerPage.tsx` 게임 진행 화면 — 헤더(내 차례 배지) + 내 FarmBoard + ResourcePanel + 🔒 내 손패 (빈 상태 표시) + ActionBoard 표시
- [x] 컴포넌트 재활용 (FarmBoard/ActionBoard/ResourcePanel) — onClick 미전달로 자연스럽게 read-only

**검증**:
- [x] `npm run build` — 성공 (gzip 287KB)

**UX 포인트**:
- 호스트: 라운드/스테이지/현재 플레이어 한눈 확인, 모든 농장판 병렬 감시
- 플레이어: 자기 농장판을 폰 화면 가운데, 손패는 🔒 자물쇠 아이콘으로 프라이버시 명시, 내 차례일 때 amber 배지 펄스 애니메이션

**다음**: Cycle 4 — 플레이어 상호작용이 실제 actions/* 큐로 제출되고 호스트가 엔진으로 처리. ActionBoard의 onActionSelect, FarmBoard의 onCellClick/onFamilyMemberClick/onFenceClick 모두 submitAction 경로로 wiring.

---

## Cycle 2 — 로비 완성 + 게임 시작 ✅ 완료

**시작/완료**: 2026-04-19
**목표**: 호스트 "게임 시작" 버튼 → gameState RTDB 커밋 + privateHands 분리 + phase 전이

**산출물**:
- [x] `types.ts` `CreateGameConfig.playerIds` 옵션 추가 — 명시적 ID 전달(Firebase pid 사용)
- [x] `game-engine.ts` `createGameState` — `playerIds` 옵션 수용
- [x] `OnlineGamePage.tsx` `handleStartGame` — 로비 정렬(joinedAt) → createGameState+startRound+replenishActionSpaces → privateHands 분리 → commitStartGame
- [x] `OnlineGamePage.tsx` playing phase 화면 — 라운드/스테이지/현재 플레이어/간이 자원 표시 (Cycle 3 전 placeholder)
- [x] `PlayerPage.tsx` playing phase 화면 — 자기 자원 그리드 + 내 손패 섹션 (빈 상태) + 내 차례 배지

**검증**:
- [x] `npx tsc --noEmit` — 오류 0
- [x] `npm run build` — 성공

**설계 메모**:
- 손패 격리: gameState 내 `players[pid].hand` 는 빈 배열로 리셋, 실제 카드는 `privateHands/{pid}` 로 이동 (Phase 1 은 카드가 비어있어 UX 변화 없음)
- 플레이어 순서는 `joinedAt` 오름차순 — 호스트가 결정하는 방식 권장(Phase B.2)

**다음**: Cycle 3 — 실제 게임 UI 이식. 호스트는 기존 GamePage 의 ActionBoard/전체 농장판/라운드카드 UI 를 구독 기반으로 리팩토링. 플레이어 폰은 자기 FarmBoard + 자기 손패 + 차례 시 행동 버튼.

---

## Cycle 1 — 기초 인프라 ✅ 완료

**시작/완료**: 2026-04-19
**목표**: 방 관리 API + 라우팅 분기 + 로비 수준 UI

**산출물**:
- [x] `lib/types.ts` 확장 — `RoomMeta`, `LobbyPlayer`, `PrivateHand`, `ActionKind`, `ActionQueueItem`, `RoomSnapshot` 추가
- [x] `lib/firebase-room.ts` 신규 — createRoom/joinRoom(transaction)/subscribeRoom/submitAction/markActionApplied|Rejected + onDisconnect 연동
- [x] `pages/OnlineGamePage.tsx` 신규 — 호스트(아이패드): 방 생성, QR 표시, 로비 목록, 인원 설정
- [x] `pages/PlayerPage.tsx` 대체 — 플레이어(폰): URL 파싱, sessionStorage 재접속, 닉네임 입력, 색상 선택, 로비 대기
- [x] `App.tsx` 라우팅 — `?game=agricola&room=XXXX` → player, `?game=agricola-online` → host, `?game=agricola-local` → 오프라인
- [x] `HomePage.tsx` — 오프라인/온라인 2-버튼

**검증**:
- [x] `npx tsc --noEmit` — 오류 0
- [x] `npm run build` — 성공 (959KB gzip 286KB)
- [ ] 실제 브라우저 QR/로비 동작 테스트 — Cycle 2 시작 전 수동 검증 예정

**Witnesses 대비 개선점**:
- 액션 큐(`actions/{pushKey}`) 패턴 도입 — 직접 write 금지
- onDisconnect 기반 connected 상태 관리
- Zustand 재활용 여지 (OnlineGamePage 가 store setGameState 콜)

**다음**: Cycle 2 — 로비 완성도 (호스트의 "게임 시작" 버튼 → createGameState + startGame 실행 → 전체 플레이어 게임 phase 전이)

---

## Cycle 0 — 계획 수립 및 문서 체계 구축 ✅ 완료

**시작**: 2026-04-19
**완료**: 2026-04-19
**목표**: Phase B 전체 계획 문서화 + 에이전트 작업 매뉴얼 정비

**산출물**:
- [x] `PHASE-B-PLAN.md` — 전체 Phase B 계획 (4개 Cycle 아키텍처/범위)
- [x] `CYCLELOG.md` — 이 문서 (사이클 로그)
- [x] `POLICY-QUEUE.md` — 정책/결정사항 대기열 (6개 활성 이슈 + 1개 확정)
- [x] `WORK-MANUAL.md` — 에이전트 작업 매뉴얼 (세션 체크리스트 + 사이클 루프)
- [🏃] `RULE-ANALYSIS.md` — 백그라운드 에이전트 a6785997 실행 중
- [🏃] `WITNESSES-PATTERNS.md` — 백그라운드 에이전트 a58bf196 실행 중

**결정 사항**:
- 오프라인 모드(`?game=agricola-local`)는 기존 GamePage.tsx 유지. 기본 경로는 Phase B 온라인 모드로 전환
- Firebase 스키마는 witnesses 참조, `privateHands/{pid}` 로 손패 격리
- 호스트 = 유일한 엔진 실행자 (권위 서버 패턴)

**다음 사이클**: Cycle 1 — 기초 인프라 (firebase-room.ts, types 확장, App.tsx 라우팅)

---
