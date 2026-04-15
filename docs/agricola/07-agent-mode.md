# 아그리콜라 에이전트 팀 워크플로우

> Claude Code 에이전트들이 팀을 이루어 아그리콜라를 자율 완성하는 운영 매뉴얼  
> **신규 세션 진입 시**: 이 문서 + `PROGRESS.md` 를 먼저 읽어 현재 상태 파악

---

## 1. 에이전트 팀 구성

| 롤 | 책임 | 자율성 | 활성화 시점 |
|----|------|--------|-------------|
| **🏛️ Architect** | 설계 결정, 타입 정의, 정책 | 사람 승인 필요 | Phase 시작 시 |
| **🔍 Researcher** | 룰 검증, 웹 검색, 번역 | 자율 | 미확인 항목 발견 시 |
| **⚙️ Code Agent** | 엔진/UI 구현 | 자율 | Architect 완료 후 |
| **🧪 QA Agent** | 빌드/테스트/시뮬레이션 | 자율 | Code Agent 완료 후 자동 |
| **📋 Review Agent** | 코드 리뷰, 린트 | 자율 | QA 통과 후 자동 |
| **🐛 Debug Agent** | 버그 진단/수정 | 자율 | 빌드/테스트 실패 시 |

---

## 2. 표준 개발 루프

```
사용자: "Phase N [기능] 구현해줘"
         ↓
[Architect] docs/agricola/*.md + PROGRESS.md 읽기
         → 타입/인터페이스 업데이트 (필요시)
         → 구현 범위 확정 후 보고
         ↓ 자동
[Code Agent] 구현
         → game-engine / farm-engine / components 등
         → 각 함수: "Phase 1 TODO" 주석 제거 + 실제 구현
         ↓ 자동
[QA Agent] 검증 파이프라인 실행:
         1. npx tsc --noEmit (타입 체크)
         2. npm run build (Vite 빌드)
         3. node scripts/agricola-test-scoring.mjs
         4. node scripts/agricola-test-farm.mjs
         5. node scripts/agricola-sim.mjs
         ↓ 실패 시 Debug Agent 자동 호출
[Review Agent] 코드 품질 리뷰
         → Critical/Major 이슈 즉시 수정
         ↓ 완료
[Architect] PROGRESS.md 업데이트
         ↓
사용자에게 "커밋+푸시 할까요?" 보고
```

---

## 3. 에이전트별 역할 상세

### 🏛️ Architect Agent

**읽어야 할 파일:**
```
docs/agricola/PROGRESS.md           ← 현재 진행 상태
docs/agricola/03-architecture.md    ← 타입 시스템
docs/agricola/04-farm-board-design.md
docs/agricola/05-action-spaces.md
docs/agricola/06-scoring.md
docs/agricola/02-card-database.md   ← 카드 데이터
src/games/agricola/lib/types.ts     ← 현재 타입 구현
```

**책임:**
- 새 Phase 시작 전 기존 코드와 설계 문서 일관성 확인
- types.ts 업데이트 (기존 타입 변경 최소화)
- 구현 순서 결정 (의존성 기준: types → constants → farm-engine → game-engine → scoring → UI)
- PROGRESS.md 완료 항목 체크

**금지:**
- 코드 구현 (설계만)
- 기존 타입 삭제 (추가/확장만)

---

### 🔍 Researcher Agent

**역할:** 미확인 룰 검증 + 번역 검증

**자동 실행 조건:** 코드 구현 중 `⚠️` 항목 발견 시

**검색 우선순위:**
1. `docs/agricola/` 로컬 문서 먼저 확인
2. `scripts/agricola-comp-v9.0/` HTML 컴펜디엄
3. 로컬 확인 불가 시 웹 검색: "Agricola revised edition [keyword] rules"

**번역 검증:** 카드 효과 한국어화 시 원문 영문과 의미 일치 확인

**현재 미확인 항목 (PROGRESS.md 참조):**
- B096 카드 존재 여부
- Farm Expansion 외양간 건설 비용
- Traveling Players 정확한 효과

---

### ⚙️ Code Agent

**구현 체크리스트 (매 파일):**
```
□ 순수 함수 (no side effects) — game-engine.ts, farm-engine.ts, scoring-engine.ts
□ TypeScript strict 모드 준수 (any 없음, 모든 타입 명시)
□ 미사용 파라미터: _ 접두사 사용
□ 색상: src/lib/colors.ts 에서 import (직접 문자열 사용 금지)
□ 소리: src/lib/sound.ts 에서 import
□ 모달: src/components/Modal.tsx 사용
□ 이모지: aria-hidden="true" 추가
□ "Phase N TODO" 주석: 구현 완료 후 제거
```

**파일별 구현 의존성:**
```
types.ts ← 변경 최소화
  ↓
constants.ts
  ↓
farm-engine.ts ← 순수 함수
  ↓
scoring-engine.ts ← farm-engine 사용
  ↓
action-spaces.ts + round-cards.ts
  ↓
game-engine.ts ← 위 모두 사용
  ↓
cards/ ← game-engine 사용
  ↓
store/game-store.ts
  ↓
components/*.tsx ← store 사용
  ↓
pages/*.tsx ← components 사용
```

**금지:**
- `any` 타입 사용
- 직접 색상 문자열 ('bg-red-500' 등) 컴포넌트에 하드코딩
- Firebase 수정 (Phase 3 전)
- 설계 문서에 없는 기능 추가

---

### 🧪 QA Agent

**검증 파이프라인 (순서 중요):**

```bash
# Step 1: 타입 체크
npx tsc --noEmit

# Step 2: 프로덕션 빌드
npm run build

# Step 3: 점수 계산 단위 테스트 (46개 케이스)
node scripts/agricola-test-scoring.mjs

# Step 4: 농장 보드 단위 테스트 (Phase 1 이후 의미 있음)
node scripts/agricola-test-farm.mjs

# Step 5: 게임 시뮬레이션 (Phase 1 이후 의미 있음)
node scripts/agricola-sim.mjs
```

**QA 리포트 형식 (PROGRESS.md에 기록):**
```markdown
### QA 리포트 — [Phase N] — [날짜]
| 검증 항목 | 결과 | 비고 |
|---------|------|------|
| TypeScript | ✅ | |
| Vite Build | ✅ | |
| 점수 테스트 46개 | ✅ | |
| 농장 테스트 | ✅ / 🔶 stub | Phase 1 TODO 남음 |
| 시뮬레이션 | ✅ / 🔶 stub | |

Critical: 없음
Major: [있으면 목록]
Minor: [있으면 목록]
```

**중요 게임 로직 시나리오 (Phase 1 이후 반드시 검증):**

| 시나리오 | 예상 결과 |
|---------|---------|
| 초기 보드 (0,0) = room_wood | ✅ |
| 초기 빈 칸 = 14개 | ✅ |
| 1×1 목장 용량 = 2 | ✅ |
| 1×1 목장 + 외양간 용량 = 4 | ✅ |
| 2×2 목장 용량 = 16 | ✅ |
| 수확: 음식 0 → 구걸 토큰 = 가족수×2 | ✅ |
| 14라운드 후 수확 라운드 6회 발생 | ✅ |
| 나무방 VP = 0, 점토방 = 1, 돌방 = 2 | ✅ |
| 가족 5명 × 3 = 15VP | ✅ |
| 구걸 토큰 1개 = -3VP | ✅ |

---

### 📋 Review Agent

**리뷰 기준:**

```
Critical (즉시 수정):
  - 게임 로직 버그 (점수 계산 오류, 울타리 계산 오류)
  - TypeScript any 사용
  - 사이드 이펙트가 있는 엔진 함수
  - 접근성 누락 (aria-hidden 없는 장식 이모지)

Major (이번 Phase 내 수정):
  - 중복 코드 (3회 이상 반복 → 함수 추출)
  - 설계 문서와 불일치하는 타입
  - 미구현 TODO 주석이 있는 함수가 실제 호출됨

Minor (다음 Phase 고려):
  - 성능 최적화 (useMemo, useCallback)
  - 추가 테스트 시나리오
```

---

### 🐛 Debug Agent

**진입 조건:** QA 실패 시 자동 호출

**진단 프로세스:**
1. 에러 메시지 분석
2. 실패한 테스트 케이스 재현
3. 관련 파일 grep (`grep -n "functionName"`)
4. 원인 파악 → 최소한의 수정

**주의:** 설계 변경 없이 구현 버그만 수정. 설계 이슈면 Architect에 에스컬레이션.

---

## 4. Phase별 구현 목표

### Phase 0: 기반 설계 ✅ 완료
- [x] 설계 문서 7개 완성
- [x] types.ts — 완전한 타입 시스템
- [x] constants.ts — 모든 상수
- [x] 전체 스켈레톤 구조 (Phase 1 TODO 표시)
- [x] TypeScript 빌드 통과
- [x] QA 스크립트 3개 (점수 테스트 46개 통과)
- [x] 카드 DB 95장 이름/효과 수록

### Phase 1: 핵심 엔진 (카드 없는 게임)

**목표:** 카드 없이 1-4인 로컬 게임 플레이 가능

**구현 순서:**
```
1. farm-engine.ts 완성:
   - calculatePastures() — BFS 목장 계산 (✅ 구현됨, 테스트 필요)
   - canBuildRoom(), canPlowField(), canSow() 완성
   - validateFences() — 닫힌 형태 검증

2. game-engine.ts 완성:
   - createGameState() — 완전한 초기화
   - placeWorker() — 행동 효과 적용
   - runHarvest() — 밭 수확 + 식량 공급 + 번식
   - breedAnimals() — 동물 번식 로직

3. action-spaces.ts 완성:
   - 나머지 행동 공간 effect 구현
   (FARMLAND, LESSONS, RC_FENCING, RC_GRAIN_UTIL 등)

4. round-cards.ts 완성:
   - 라운드 카드 effect 구현

5. scoring-engine.ts:
   - 이미 완성. farm-engine 연동 후 QA

6. UI 컴포넌트:
   - FarmBoard.tsx — 실제 3×5 렌더링
   - FarmCell.tsx — 셀 타입별 시각화
   - FenceGrid.tsx — 울타리 인터랙션
   - ActionBoard.tsx — 행동 공간 목록
   - HarvestModal.tsx — 수확 단계 UI
```

**Phase 1 완료 기준:**
```
□ npx tsc --noEmit 통과
□ npm run build 통과
□ node scripts/agricola-test-farm.mjs — stub 없이 전체 통과
□ node scripts/agricola-sim.mjs — 14라운드 완주 시뮬레이션 통과
□ 브라우저에서 2인 게임 시작 → 14라운드 진행 → 점수 확인 가능
```

### Phase 2: 카드 시스템

**목표:** A/B 덱 96장 효과 구현, 카드 UI

**구현 순서:**
```
1. card-engine.ts — triggerEffects, playCard 완성
2. cards/occupations-a.ts — A086~A165 효과 구현 (24장)
3. cards/improvements-a.ts — A002~A083 효과 구현 (24장)
4. cards/occupations-b.ts — B087~B166 효과 구현 (23+1장)
5. cards/improvements-b.ts — B002~B084 효과 구현 (24장)
6. CardHand.tsx — 손패 UI
7. CardDetail.tsx — 카드 효과 텍스트 표시
```

**카드 구현 우선순위 (복잡도 낮은 것부터):**
```
쉬움: A116(나무꾼), A114(계절노동자), A091(경작보조), B142(채소가게주인)
중간: A112(낫노동자), A165(돼지사육사), B164(양속삭이는자)
어려움: A133(허풍쟁이), B036(병), B039(베틀)
```

### Phase 3: 멀티플레이어 (Firebase)

```
1. lib/firebase-room.ts — GameState 저장/구독
2. pages/PlayerPage.tsx — 폰 개인 화면
3. Firebase 보안 규칙
4. 실시간 동기화 테스트
```

**Firebase 경로:** `agricola/{roomCode}/state` (GameState 전체)

### Phase 4: 완성도

```
1. i18n.ts 완성 (한/영/중)
2. 모바일 최적화 (44px 터치 타겟)
3. 오디오 효과 (src/lib/sound.ts 사용)
4. 튜토리얼 모드
5. Home.tsx 게임 카드 추가
6. App.tsx 라우팅 연결
```

---

## 5. 사용자 명령 → 에이전트 매핑

| 사용자 명령 | 에이전트 시퀀스 |
|------------|---------------|
| `"Phase 1 구현해줘"` | Architect → Code → QA → Review |
| `"farm-engine 구현해줘"` | Code → QA |
| `"QA 실행해줘"` | QA |
| `"[카드ID] 카드 구현해줘"` | Researcher → Code → QA |
| `"버그 수정해줘"` | Debug → QA |
| `"현재 상태 알려줘"` | PROGRESS.md 읽기 |
| `"코드 리뷰해줘"` | Review |
| `"[룰] 확인해줘"` | Researcher |

---

## 6. 코드 품질 기준 (Golden Rules)

```typescript
// ✅ 올바른 예: 순수 함수, 타입 안전
export function scoreSheep(player: PlayerState): number {
  const count = totalAnimals(player, 'sheep');
  return SCORE_SHEEP(count);
}

// ❌ 잘못된 예: 사이드 이펙트
export function scoreSheep(player: PlayerState): number {
  player.score += 3; // 직접 수정 금지!
  return 3;
}

// ✅ 올바른 예: GameState 불변 업데이트
export function addFood(state: GameState, playerId: PlayerId): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId]!,
        resources: { ...state.players[playerId]!.resources, food: state.players[playerId]!.resources.food + 1 }
      }
    }
  };
}

// ✅ 미사용 파라미터: _ 접두사
effect: (state: GameState, _playerId: PlayerId) => state,
```

---

## 7. PROGRESS.md 업데이트 규칙

- Phase 완료 시: 해당 Phase 모든 체크박스 완료 표시
- 버그 발견 시: "룰북 검증 대기 항목"에 추가
- QA 리포트: Phase 완료 시 PROGRESS.md에 기록
- 새 세션 시작 시: PROGRESS.md 읽어 현재 상태 파악 후 이어서 진행

---

## 8. 현재 파일 구조 (Phase 0 완료 상태)

```
src/games/agricola/
├── lib/
│   ├── types.ts          ✅ 완성 (타입 전체)
│   ├── constants.ts      ✅ 완성 (상수 전체)
│   ├── game-engine.ts    🔶 스켈레톤 (Phase 1)
│   ├── farm-engine.ts    🔶 BFS 구현됨, 테스트 필요 (Phase 1)
│   ├── card-engine.ts    🔶 스켈레톤 (Phase 2)
│   ├── scoring-engine.ts ✅ 완성 (함수 구현됨)
│   ├── action-spaces.ts  🔶 영구 공간 10개 정의됨, effect 일부 미구현
│   ├── round-cards.ts    🔶 14장 정의됨, effect 미구현
│   ├── i18n.ts           🔶 한/영만 (Phase 4)
│   └── cards/
│       ├── index.ts      ✅ 완성
│       ├── occupations-a.ts    🔶 이름만 (Phase 2)
│       ├── occupations-b.ts    🔶 이름만 (Phase 2)
│       ├── improvements-a.ts   🔶 이름+비용 (Phase 2)
│       ├── improvements-b.ts   🔶 이름+비용 (Phase 2)
│       └── major-improvements.ts  🔶 기본 구조 (Phase 1)
├── store/game-store.ts   🔶 스켈레톤 (Phase 1)
├── components/           🔶 스켈레톤 (Phase 1)
└── pages/                🔶 스켈레톤 (Phase 1)

scripts/
├── agricola-test-scoring.mjs  ✅ 46개 테스트 통과
├── agricola-test-farm.mjs     🔶 stub (Phase 1 이후 활성화)
└── agricola-sim.mjs           🔶 stub (Phase 1 이후 활성화)
```
