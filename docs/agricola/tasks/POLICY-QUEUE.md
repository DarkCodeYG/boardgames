# 아그리콜라 정책 대기열

> 사용자 결정이 필요하거나 추후 검토가 필요한 정책 이슈 큐.
> 상태: `🟡 대기` · `🟢 확정` · `🔴 거절` · `⚪ 보류`

---

## 활성 이슈

### P-007 🟡 [Critical] 라운드 카드 누적 자원 버그
**출처**: `analysis/RULE-ANALYSIS.md` (에이전트 a6785997 산출)
**배경**: `game-engine.ts:159-175` 의 `replenishActionSpaces` 가 `state.actionSpaces` 만 순회하고 `state.revealedRoundCards` 누락. 양/돼지/소/돌 시장 카드가 첫 라운드 이후 자원이 누적되지 않음.
**영향**: 게임 밸런스 심각 왜곡. 진행은 가능하나 핵심 자원 공급이 끊김.
**기본 판단**: Phase B Cycle 3 시작 전 버그픽스로 긴급 처리. 단일 함수 수정 → 안전.

### P-008 🟡 [Critical] 목장 닫힘 검증 누락
**출처**: `analysis/RULE-ANALYSIS.md`
**배경**: `calculatePastures` (`farm-engine.ts:97-124`) 가 열린 경계 셀까지 pasture 로 취급. `isPastureFullyFenced` 필터가 scoring/animal 배치에서 빠져있을 수 있음.
**영향**: 점수 오산 + 열린 영역에 동물 배치 가능 (규정 위반).
**기본 판단**: Phase B Cycle 3 전 확인 후 패치.

### P-009 🟡 [Critical] 우물(MAJ_WELL) 효과 placeholder
**출처**: `analysis/RULE-ANALYSIS.md`
**배경**: `major-improvements.ts:123` `apply: (s, p) => addResources(s, p, { food: 0 })` — VP 4 설비가 무효화.
**정확한 룰**: 건설 라운드 포함 5개 라운드 공간에 음식 1씩 배치 (매 라운드 시작 보충 시 획득).
**기본 판단**: Phase B 내 별도 기능 구현. 시급도 중간. 현재는 게임 완주에 치명적이진 않음.

### P-010 🟡 [Critical] hasGrown 타이밍
**출처**: `analysis/RULE-ANALYSIS.md`
**배경**: `returnWorkers` 가 `hasGrown: false` 리셋. 호출 순서 따라 신생아 1음식 계산 영향.
**기본 판단**: 테스트 케이스 작성 → 실제 영향 확인 후 결정. Phase B Cycle 6 시뮬레이션에서 검증.

### P-011 🟡 [Critical] 카드 시스템 전체 미완성
**출처**: `analysis/RULE-ANALYSIS.md`
**배경**: 덱 셔플/7장 배분, 카드 효과 `apply` 파이프라인, LESSONS 비용 로직 모두 미구현.
**영향**: 기본판 아그리콜라의 핵심 다양성이 없음.
**기본 판단**: Phase B 이후 별도 Phase (C — 카드 시스템)로 분리. Phase B 는 "카드 없이 돌아가는 온라인 모드" 가 범위.



### P-001 🟡 Firebase 보안 규칙
**배경**: 손패(occupations, minorImprovements)는 해당 플레이어만 읽을 수 있어야 함. 호스트도 게임 진행 상 읽기 필요.
**옵션**:
- (A) 현재 witnesses처럼 테스트 모드 (30일 만료, 모두 읽기/쓰기)
- (B) 인증 기반: 각 플레이어가 익명 Auth 토큰 보유, 본인 UID 만 자기 손패 read
- (C) 서버 함수(Cloud Functions) 경유 — 비용 발생
**기본 판단(A)**: 개발/초기 배포는 테스트 모드로. 정식 배포 시 (B) 도입

### P-002 🟡 호스트 디스커넥트 복구
**배경**: 호스트 아이패드가 네트워크 끊기면 게임이 진행 불가.
**옵션**:
- (A) 단순 중단, 모두에게 경고
- (B) heartbeat + 자동 재연결 (5분 안에 복구되면 재개)
- (C) 호스트 이양 (다른 플레이어가 호스트 승계)
**기본 판단(A)**: Phase B.1 에서는 단순 중단. (C) 는 Phase B.2

### P-003 🟢 오프라인 모드 유지 여부
**확정**: 유지. URL `?game=agricola-local` 로 분리. 개발/단일 디바이스 데모용.

### P-004 🟡 라운드 종료 버튼 조작 권한
**배경**: 현재는 아무나 누를 수 있음. 온라인 모드에서 누가 진행 제어?
**옵션**:
- (A) 호스트만
- (B) 현재 선플레이어만
- (C) 모두 가능 (지금처럼)
**기본 판단(A)**: 호스트 = 진행자. 카운트다운 자동 발화 로직은 호스트에서만 동작.

### P-005 🟡 동점 처리 UI 표기
**배경**: 룰상 동점 시 특수 조건. 현재 ScoreBoard 구현 확인 필요.
**기본 판단**: 규정 분석 후 결정

### P-006 🟡 룰 갭 리서치 결과 반영 주기
**배경**: Researcher Agent 가 RULE-ANALYSIS.md 를 생성하면 그 갭을 Cycle 어느 시점에 반영할지.
**기본 판단**: Cycle 6 (테스트 단계)에서 우선순위대로 반영. Critical/Major 갭은 Cycle 3~4 도중 끼어들어 수정.

---

## 해결된 이슈 (아카이브)

### 🟢 P-CLOSED-001 — Phase B vs Phase A 우선순위
**확정 (2026-04-19)**: Phase B 를 직접 진행. Phase A (접기/펼치기·프라이버시) 는 Phase B 의 Cycle 5 에서 자연스럽게 포함.
