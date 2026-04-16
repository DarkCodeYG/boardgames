# 아그리콜라 에이전트 백로그

> 에이전트 자율 진행 결정 사항 기록. 크리티컬 변경 아닌 경우 사용자 확인 없이 진행.
> 형식: `[날짜] 작업 — 판단 근거`

---

## 2026-04-16 (세션 2)

### 완료된 작업

- [2026-04-16] **GamePage.tsx 인터랙션 완전 구현** — placeWorker 연동, 라운드 진행 버튼, pending_* 상태 배너, 밭갈기/씨뿌리기/가족늘리기/집개량 핸들러. null narrowing → `const gs = gameState` 캡처 패턴으로 해결.

- [2026-04-16] **브라우저 검증 완료** — `?game=agricola-game` URL 파라미터 직접 1라운드 진입. ActionBoard(영구공간+라운드카드), FarmBoard(3×5), ResourcePanel, 차례 표시 정상 렌더링 확인.

- [2026-04-16] **App.tsx URL 라우팅 추가** — `?game=agricola` → 홈, `?game=agricola-game` → 1라운드 work 상태 직접 진입 (테스트용). 정적 import로 dynamic import 경고 제거.

---

## 2026-04-16 (세션 1)

### 완료된 작업

- [2026-04-16] **한국어 카드명 수정 (A/B덱)** — 나무위키 검색으로 실제 한국어판 명칭 확인. 기존 직역 명칭 14개 → 공식 한국어판 명칭으로 교체 (가축 조련사, 재산 관리인, 산울타리지기 등)

- [2026-04-16] **farm-engine BFS 테스트 63개 작성** — 기존 stub → 실제 로직 JavaScript 재구현. 1×1 목장, 외양간, 다중 목장 분리, 울타리 차단, 방/밭/씨 유효성 전체 커버.

- [2026-04-16] **breedAnimals 구현** — 규칙: 종별 2마리 이상 + 여유 용량 → 새끼 1마리. 배치 우선순위: 같은 종 목장 → 빈 목장 → 집 안.

- [2026-04-16] **인터랙티브 행동 함수 추가** — plowField, sowField, growFamily(requireRoom), renovateHouse, buildFences를 game-engine.ts에 추가. 복잡 행동은 pending_* roundPhase 패턴으로 UI에 신호 전달.

- [2026-04-16] **RoundPhase 확장** — pending_plow, pending_sow, pending_plow_sow, pending_fence, pending_renovate, pending_renovate_fence, pending_family_growth, pending_animal_choice 추가.

- [2026-04-16] **FarmBoard.tsx 구현** — 3×5 그리드, 울타리 오버레이(fencingMode), 셀 클릭 지원. FarmCell.tsx: 방/밭/외양간/목장 동물 시각화.

- [2026-04-16] **ActionBoard.tsx 구현** — 영구 공간 + 라운드 카드 표시, 워커 점 표시, 누적 자원 배지.

- [2026-04-16] **App.tsx + Home.tsx Agricola 연결** — 라우팅 추가, 한/영/중 게임 카드 추가.

- [2026-04-16] **ResourceCost에 동물 자원 추가** — sheep/boar/cattle 필드 추가 (A009 Young Animal Market 비용 타입 오류 수정).

- [2026-04-16] **빌드 통과** — npm run build exit 0. TypeScript 오류 0.

---

## 2026-04-16 (세션 3 — QA 라운드 1)

### 완료된 작업

- [2026-04-16] **QA.md 작성** — 15개 버그 항목 체크리스트 문서화
- [2026-04-16] **B-01 수정** — farm-engine.ts: createInitialFarmBoard() 방 1→2개 (grid[1][0] 추가)
- [2026-04-16] **B-02 수정** — game-engine.ts: 초기 음식 food:0 → P1:2, P2:3, P3:4, P4:5 (차례 보상)
- [2026-04-16] **B-03/04 수정 (Critical)** — placeWorker: 라운드 카드 workerId 미갱신 + 누적 자원 미초기화 동시 수정. 라운드 카드에 중복 배치 가능하던 버그 해결
- [2026-04-16] **B-05 수정 (Critical)** — growFamily requireRoom 미구분: types에 pending_family_growth_urgent 추가, RC_URGENT_WISH → 새 phase, GamePage 핸들러 분리
- [2026-04-16] **B-06 수정** — FARM_EXPANSION: state 그대로 → pending_build_room 상태 설정, buildRoom() 함수 구현 (재료 5 + 갈대 2, 인접 방 필요)
- [2026-04-16] **B-07 수정** — ActionBoard ACTION_INFO: RC_MAJOR_IMP/RC_FENCING/RC_GRAIN_UTIL/RC_BASIC_WISH/RC_HOUSE_RENO/RC_VEG_SEEDS/RC_URGENT_WISH ID 불일치 수정
- [2026-04-16] **UI 개선** — GamePage 전면 재구성: 다른 플레이어 농장 탭, 워커 pip, 플레이어 상태 바(하이라이트), 플레이어 타이머, 시작 전 초기 상태 미리보기
- [2026-04-16] **B-11 수정** — ResourcePanel: 영문 레이블 → 한국어 + 아이콘 + 가족 수 + 구걸 토큰
- [2026-04-16] **B-12 수정** — FarmCell/FarmBoard: hasFamilyMember prop 추가, 방 안 👤 토큰 표시
- [2026-04-16] **B-13 수정** — ActionBoard: 신규 공개 라운드 카드 "NEW" 배지 + 링 강조
- [2026-04-16] **ActionBoard 설명 추가** — 각 행동별 한국어 설명문 + 신규 라운드 카드 강조
- [2026-04-16] **빌드 통과** — npm run build exit 0, TypeScript 오류 0

---

## 대기 중 (Phase 2 대상)

### 고우선순위
- card-engine.ts triggerEffects 완전 구현 (현재 stub)
- A덱 직업 24장 effects 구현
- B덱 직업 23장 effects 구현
- A덱 소시설 24장 effects 구현
- B덱 소시설 24장 effects 구현
- CardHand.tsx + CardDetail.tsx 카드 UI 구현

### 중우선순위
- HarvestModal.tsx 수확 단계 인터랙션 (식량 공급 UI)
- 울타리 건설 UI (FenceGrid 인터랙션)
- 가족 늘리기 UI (방 선택 없이 자동, 조건 검사만)
- 집 개량 UI

### 낮은 우선순위
- 번식 로직 정밀화 (집 안 한도, 외양간 단독 동물 규칙)
- i18n 중국어 완성
- 모바일 44px 터치 타겟 최적화
- 사운드 효과 연동

### 미확인 룰
- B096 카드 존재 여부 (물리 카드 확인 필요)
- Farm Expansion 외양간 건설 비용 (나무 2 추정)
- Traveling Players 정확한 효과 (4인 전용)
