# 아그리콜라 개발 진행 상황

> 최종 업데이트: 2026-04-16 (Phase 1 + UI 인터랙션 연동 완료)  
> **에이전트 진입점:** 이 파일 + `07-agent-mode.md` 읽고 현재 상태 파악

## 현재 Phase: Phase 1 + UI 연동 완료 → Phase 2 (카드 시스템) 시작 대기

---

## 설계 문서 현황

| 문서 | 상태 | 비고 |
|------|------|------|
| 00-feasibility.md | ✅ 완성 | 타당성 분석, 컴포넌트 목록 |
| 01-personas-governance.md | ✅ 완성 | 개발 롤, Phase 계획, 코드 기준 |
| 02-card-database.md | ✅ 완성 | A/B덱 96장 이름+효과 수록 (Compendium v4.1) |
| 03-architecture.md | ✅ 완성 | TypeScript 타입 시스템 전체 |
| 04-farm-board-design.md | ✅ 완성 | 농장 보드 격자+울타리 설계, 엣지케이스 |
| 05-action-spaces.md | ✅ 완성 | 영구 행동 공간 10개, 14개 라운드 카드 |
| 06-scoring.md | ✅ 완성 | 점수표 전체, 동점 처리 |
| 07-agent-mode.md | ✅ 완성 | 에이전트 팀 운영 매뉴얼 |

---

## Phase 별 완료 현황

### Phase 0: 기반 설계 ✅ 완료

- [x] 설계 문서 7개 작성 및 검증
- [x] `src/games/agricola/lib/types.ts` — 완전한 타입 시스템
- [x] `src/games/agricola/lib/constants.ts` — 모든 상수 (점수표, 비용, 라운드)
- [x] `src/games/agricola/lib/farm-engine.ts` — BFS 목장 계산 구현
- [x] `src/games/agricola/lib/scoring-engine.ts` — 12카테고리 점수 함수
- [x] `src/games/agricola/lib/game-engine.ts` — 스켈레톤 (핵심 함수 서명 완성)
- [x] `src/games/agricola/lib/action-spaces.ts` — 영구 공간 10개 정의
- [x] `src/games/agricola/lib/round-cards.ts` — 라운드 카드 14장 정의
- [x] `src/games/agricola/lib/cards/` — 전체 카드 DB 스켈레톤 (A/B 덱)
- [x] `src/games/agricola/store/game-store.ts` — Zustand 스토어
- [x] `src/games/agricola/components/` — 전체 컴포넌트 스켈레톤
- [x] `src/games/agricola/pages/` — 전체 페이지 스켈레톤
- [x] `scripts/agricola-test-scoring.mjs` — 점수 테스트 46개 ✅ 통과
- [x] `scripts/agricola-test-farm.mjs` — 농장 테스트 스켈레톤
- [x] `scripts/agricola-sim.mjs` — 시뮬레이션 스켈레톤
- [x] TypeScript 빌드 통과 (`npx tsc --noEmit` exit 0)

### Phase 1: 핵심 엔진 (카드 없는 게임) ✅ 완료

- [x] `farm-engine.ts` — calculatePastures() BFS 완전 구현 + 63개 테스트 통과
- [x] `game-engine.ts` — createGameState, placeWorker, runHarvest, breedAnimals 완전 구현
- [x] `action-spaces.ts` — 10개 영구 공간 effect 완성 (복잡 행동은 pending_* roundPhase)
- [x] `round-cards.ts` — 14개 라운드 카드 effect 완성
- [x] `FarmBoard.tsx` — 3×5 그리드 + 울타리 오버레이 + 셀 클릭 지원
- [x] `FarmCell.tsx` — 셀 타입별 시각화 (방/밭/외양간/목장 동물)
- [x] `ActionBoard.tsx` — 행동 공간 목록 + 워커 배치 + 누적 자원 표시
- [x] `scripts/agricola-test-farm.mjs` — 63개 실제 테스트 통과
- [x] `scripts/agricola-sim.mjs` — 15개 구조 테스트 통과
- [x] `App.tsx` + `Home.tsx` — Agricola 라우팅 연결 완료
- [x] `npm run build` — 빌드 성공 (TypeScript 오류 0)
- [x] 한국어 카드명 검증 — 나무위키/코리아보드게임즈 기준 수정 완료

### Phase 1.5: UI 인터랙션 연동 ✅ 완료 (2026-04-16)

- [x] `GamePage.tsx` 완전 재구현 — placeWorker 클릭 연동, 다음 플레이어 자동 전환
- [x] 라운드 진행 흐름 — "게임 시작(1라운드)" → work → "라운드 종료" → 다음 라운드
- [x] 수확 라운드 자동 처리 — `runHarvest()` 자동 실행 (밭 수확 + 식량 공급 + 번식)
- [x] `pending_*` 상태 배너 — 밭갈기/씨뿌리기/집개량/가족늘리기/울타리 각 상황별 안내
- [x] 밭 갈기 (`pending_plow`) — 셀 클릭 → `plowField()` 연동
- [x] 씨 뿌리기 (`pending_sow`) — 밭 클릭 → `sowField()` 연동, 보유 작물 자동 선택
- [x] 집 개량 (`pending_renovate`) — 확인 버튼 → `renovateHouse()` 연동
- [x] 가족 늘리기 (`pending_family_growth`) — 확인 버튼 → `growFamily()` 연동
- [x] 울타리 모드 — `fencingMode` prop으로 FarmBoard에 울타리 오버레이 활성화
- [x] `App.tsx` URL 라우팅 — `?game=agricola` / `?game=agricola-game` 직접 진입 지원
- [x] 브라우저 검증 — ActionBoard, FarmBoard, ResourcePanel 실제 렌더링 확인

### Phase 2: 카드 시스템

- [ ] `card-engine.ts` — triggerEffects, playCard 완성
- [ ] `cards/occupations-a.ts` — A덱 직업 24장 effects 구현
- [ ] `cards/improvements-a.ts` — A덱 소시설 24장 effects 구현
- [ ] `cards/occupations-b.ts` — B덱 직업 23장 effects 구현
- [ ] `cards/improvements-b.ts` — B덱 소시설 24장 effects 구현
- [ ] `CardHand.tsx`, `CardDetail.tsx` — 카드 UI

### Phase 3: 멀티플레이어 (Firebase)

- [ ] `lib/firebase-room.ts` — GameState 저장/구독
- [ ] `pages/PlayerPage.tsx` — 폰 개인 화면
- [ ] Firebase 보안 규칙 설정
- [ ] 실시간 동기화 테스트

### Phase 4: 완성도

- [ ] `i18n.ts` — 한/영/중 완성
- [ ] 모바일 최적화 (44px 터치 타겟)
- [ ] `src/lib/sound.ts` 오디오 효과
- [ ] 튜토리얼 모드
- [ ] `App.tsx` + `src/pages/Home.tsx` 연결

---

## 카드 데이터 현황

| 타입 | 덱 | 데이터 | 구현 |
|------|----|--------|------|
| 직업 | A | ✅ 24/24 (이름+효과 요약) | 0/24 |
| 직업 | B | ⚠️ 23/24 (B096 미확인) | 0/23 |
| 소시설 | A | ✅ 24/24 (이름+비용+효과) | 0/24 |
| 소시설 | B | ✅ 24/24 (이름+비용+효과) | 0/24 |
| 대시설 | - | ✅ 10/10 | 🔶 기본 구조 |

---

## QA 리포트 — Phase 1 — 2026-04-16

| 검증 항목 | 결과 | 비고 |
|---------|------|------|
| TypeScript `npx tsc --noEmit` | ✅ PASS | exit 0 |
| 점수 테스트 (46개) | ✅ PASS | `node scripts/agricola-test-scoring.mjs` |
| 농장 테스트 (63개) | ✅ PASS | `node scripts/agricola-test-farm.mjs` (BFS 목장 계산) |
| 시뮬레이션 (15개) | ✅ PASS | `node scripts/agricola-sim.mjs` (Phase 1 stub 일부) |
| Vite Build | ✅ PASS | `npm run build` 성공 |
| 한국어 용어 검증 | ✅ PASS | A덱/B덱 카드명 나무위키 기준 수정 |

**Critical Issues:** 없음  
**Major Issues:** 없음  
**Minor Issues:**
- B096 카드 존재 여부 미확인 (물리 카드 필요)
- 복잡 행동(울타리/수확/가족 증가) UI는 pending_* roundPhase 신호만 → Phase 1 UI 연동 미완
- HarvestModal.tsx 수확 단계 인터랙션 미구현
- 번식 로직: 집 안 동물 한도 규칙 Phase 2에서 정밀화 필요

---

## 룰 검증 현황

| 항목 | 상태 | 출처 |
|------|------|------|
| 영구 행동 공간 10개 | ✅ 확인 | Unofficial Compendium v4.1 |
| 라운드 카드 14장 순서/효과 | ✅ 확인 | 공식 Appendix + 나무위키 |
| 점수표 수치 전체 | ✅ 확인 | 나무위키 + 공식 Appendix |
| A/B 덱 카드 이름/효과 | ✅ 확인 | Unofficial Compendium v4.1 |
| 인원별 보드 확장 타일 | ✅ 확인 | 공식 Appendix |
| 집 개량 비용 | ✅ 확인 | 공식 룰북 |
| B096 카드 존재 | ⚠️ 미확인 | 물리 카드 확인 필요 |
| Farm Expansion 외양간 비용 | ⚠️ 미확인 | 나무2 추정 |
| Traveling Players 정확한 효과 | ⚠️ 미확인 | 4인 전용 타일 |

---

## 다음 행동

**Phase 2 시작 (바로 가능):**
```
"Phase 2 카드 시스템 구현해줘"
→ card-engine.ts triggerEffects/playCard 완성
→ A/B덱 직업 24+23장 효과 구현
→ A/B덱 소시설 24+24장 효과 구현
```

**Phase 1 UI 마무리 (선택):**
```
"HarvestModal 수확 단계 UI 구현해줘"
"울타리 건설 인터랙션 완성해줘"
"가족 늘리기 UI 연결해줘"
```

**룰 확인 필요 시:**
```
"Farm Expansion 외양간 건설 비용 확인해줘"
→ Researcher: 로컬 문서 → compendium.pdf → 웹 검색
```
