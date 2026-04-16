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

## 2026-04-17 (세션 4 — QA 라운드 2)

### 완료된 작업

- [2026-04-17] **한국어 용어 전면 수정** — action-spaces.ts: 숲/흙 채굴장/갈대밭/곡식 종자/농지/방 만들기·외양간 짓기/회합 장소/덤불/수풀/점토 채굴장/유랑극단/가축 시장. round-cards.ts: 주요 설비/울타리/곡식 활용/기본 가족 늘리기/집 개조/채소 종자/급한 가족 소원

- [2026-04-17] **sowField 채소 버그 수정** — count: 3 하드코딩 → grain=3, vegetable=2 (룰 일치)

- [2026-04-17] **ResourcePanel 점토→흙** — 한국어판 공식 명칭 반영

- [2026-04-17] **UX 재설계: 바둑 방식 워커 배치** — FarmCell: familyMemberState('available'/'deployed'/'selected'). FarmBoard: deployedCount/selectedFamilyCell props. GamePage: selectedFamilyCell 상태, handleFamilyMemberClick. ActionBoard: workerReady prop + 녹색 드롭 타겟 강조. 가족 구성원 클릭 → 행동칸 클릭 순서로 배치

- [2026-04-17] **가축 시장 OR 선택 구현** — pending_animal_select 단계 추가. 3종(양+음식1/멧돼지/소+음식1) 중 선택 버튼 UI. getAnimalFromMarket() 함수 구현

- [2026-04-17] **외양간 건설 구현** — pending_build_stable 단계 추가. buildStable() 함수(나무2). FARM_EXPANSION 배너에서 방/외양간 전환 버튼 UI

- [2026-04-17] **소박한 가족 늘리기 활성화** — V2/V34_MODEST_WISH: effect → pending_family_growth 설정. 핸들러에서 5라운드 조건 검사 추가

- [2026-04-17] **한국어 룰 참고 파일 생성** — docs/agricola/korean-rules/01-action-spaces-ko.md, 02-major-improvements-ko.md, 03-resources-ko.md

- [2026-04-17] **OR 조건 행동 검증 에이전트 가동** — 9개 OR 행동 검토: Critical 4개 발견 및 수정

- [2026-04-17] **목장 용량 버그 수정** — calcPastureCapacity: `2^cellCount` → `cellCount × 2` (룰북 기준, 1칸=2마리)

- [2026-04-17] **체스/장기 방식 워커 배치 UX 완성** — 가족 선택 시: 배치 가능 칸에 초록 ● 펄스 표시. 선택된 가족 토큰: 파란 링+펄스 애니메이션. 배치된 워커: 파란 배경+"내 워커" 레이블. 행동 설명 초록색으로 강조. 선택 해제: 같은 셀 재클릭

- [2026-04-17] **빌드 통과** — npm run build exit 0, TypeScript 오류 0

---

## 2026-04-17 (세션 5 — QA 라운드 3)

### 완료된 작업

- [2026-04-17] **UI 일꾼 용어 통일** — ActionBoard, GamePage, i18n.ts: '워커' → '일꾼'/'가족 구성원'. aria-label, 남은 일꾼 tooltip, 모든 일꾼 배치 완료 텍스트, 유랑극단 설명, place_worker i18n key 전부 수정
- [2026-04-17] **대시설 한국어명 전면 수정** — major-improvements.ts: 화덕(점토2/3)→화로(흙2/3), 취사장(점토4/5)→화덕(흙4/5), 점토오븐→흙가마, 돌오븐→돌가마, 목공소→가구제작소, 도예소→그릇제작소, 바구니공방→바구니제작소
- [2026-04-17] **우물 비용 수정** — MAJ_WELL: cost `{reed:1, stone:3}` → `{wood:1, stone:3}` (나무위키 룰 기준)
- [2026-04-17] **buildRoom 에러 메시지** — '점토 부족' → '흙 부족' (용어 일관성)
- [2026-04-17] **문서-구현 정합성 검토 에이전트 가동** — docs/agricola/REVIEW.md 생성. Critical 버그 6개 발견 즉시 수정
- [2026-04-17] **대시설 비용 5개 수정 (Critical)** — 흙가마: clay3+stone1→clay3+reed1, 돌가마: clay1+stone3→stone3+reed1, 가구제작소: wood2+stone2→wood2+reed1+stone1, 그릇제작소: clay2+stone2→clay2+reed1+stone1, 바구니제작소: reed2+stone2→reed2+clay1+stone1
- [2026-04-17] **EXT4_HOLLOW 명칭 수정** — '점토 채굴장' → '흙 채굴장' (흙 용어 통일)
- [2026-04-17] **빌드 통과** — npm run build exit 0, TypeScript 오류 0
- [2026-04-17] **라운드 카드 스테이지 내 셔플** — createGameState: pendingRoundCards Fisher-Yates 셔플 적용 (룰 불일치 수정, 주석 '// Phase 2에서 셔플' 제거)
- [2026-04-17] **RC_MAJOR_IMP 대시설 선택 UI** — pending_major_imp RoundPhase 추가. buildMajorImprovement() 구현 (비용검증·차감·ownerId설정). GamePage에 설비 그리드 선택 배너(비용 충족여부 표시, 건너뜀 가능)
- [2026-04-17] **Undo(되돌리기) 기능** — GamePage history 스택(최대 10). 일꾼 배치·대시설 건설 시 saveAndSet으로 저장. 헤더 ↩ 되돌리기 버튼 (history 있을 때만 표시)
- [2026-04-17] **디자인 P0+P1 적용** — 원판 아그리콜라 느낌 색상 시스템 전면 교체: FarmCell(방색상·나무디스크 토큰·씨앗배지), ActionBoard(amber 팔레트·보드판 컨테이너·섹션레이블), ResourcePanel(크림배경·자원배지), FarmBoard(나무 프레임), GamePage(stone-300 배경)

---

## 2026-04-17 (세션 6 — 4개 에이전트 검증 후 버그픽스)

### 완료된 작업

- [2026-04-17] **4개 에이전트 동시 검증** — QA엔지니어/UI개발자/아키텍트/문서화 페르소나로 Phase 1 전체 검증. Critical 4건, Major 5건 발견.
- [2026-04-17] **buildStable() 버그 수정 (Critical)** — QA에이전트 발견: 밭(field) 셀에 외양간 건설 허용 오류. `cell !== 'empty' && cell !== 'field'` → `cell !== 'empty'` (룰: 빈 칸에만 건설)
- [2026-04-17] **대시설 VP 수정 (Critical)** — 문서에이전트 발견: 화덕(흙4/5) 1점→0점, 흙가마 2점→0점, 돌가마 3점→0점. 룰북 기준 화덕/가마류 VP 없음.
- [2026-04-17] **EXT4_HOLLOW 명칭 중복 해소 (Major)** — 문서에이전트 발견: '흙 채굴장'→'깊은 흙 채굴장' (CLAY_PIT과 동일명 충돌 해소)
- [2026-04-17] **Undo 커버리지 확장 (Major)** — UI에이전트 발견: handleCellClick·handleAnimalSelect의 setGameState → saveAndSet 전환 (방/외양간/밭갈기/씨뿌리기/동물선택 모두 undo 지원)
- [2026-04-17] **빌드 통과** — npm run build exit 0, TypeScript 오류 0

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
