# 아그리콜라 Phase B — 사이클 로그

> 각 작업 사이클의 시작/종료/결과 기록.
> 규칙: 사이클 당 1개 섹션. 완료 시 타임스탬프·산출물·검증 결과·다음 사이클 참조 기록.
> 형식: 최신 사이클이 위, 오래된 사이클이 아래로.

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
