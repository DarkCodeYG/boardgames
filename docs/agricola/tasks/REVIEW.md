# 아그리콜라 문서-구현 정합성 검토

> 에이전트 자동 검토 결과 (2026-04-17 세션 5)
> 검토 기준: docs/agricola/*.md + korean-rules/*.md vs 실제 구현 파일

---

## 즉시 수정 완료 (Critical → Fixed)

| 항목 | 이전 | 수정 후 | 파일 |
|------|------|---------|------|
| MAJ_CLAY_OVEN 비용 | `{clay:3, stone:1}` | `{clay:3, reed:1}` | cards/major-improvements.ts |
| MAJ_STONE_OVEN 비용 | `{clay:1, stone:3}` | `{stone:3, reed:1}` | cards/major-improvements.ts |
| MAJ_JOINERY 비용 | `{wood:2, stone:2}` | `{wood:2, reed:1, stone:1}` | cards/major-improvements.ts |
| MAJ_POTTERY 비용 | `{clay:2, stone:2}` | `{clay:2, reed:1, stone:1}` | cards/major-improvements.ts |
| MAJ_BASKETMAKERS_WORKSHOP 비용 | `{reed:2, stone:2}` | `{reed:2, clay:1, stone:1}` | cards/major-improvements.ts |
| EXT4_HOLLOW nameKo | '점토 채굴장' | '흙 채굴장' | action-spaces.ts |

---

## 정상 구현 확인 (OK)

### 행동 공간 구조
- ✅ 영구 행동 공간 10개 ID + nameKo 일치
- ✅ 라운드 카드 14장 ID + 스테이지별 배치 정확
- ✅ 수확 라운드: [4, 7, 9, 11, 13, 14]
- ✅ 스테이지→라운드 매핑: {1:[1-4], 2:[5-7], 3:[8-9], 4:[10-11], 5:[12-13], 6:[14]}

### 초기 상태
- ✅ 초기 가족 크기: 2명
- ✅ 초기 방 2칸 (나무)
- ✅ 차례 보상 음식: P1=2, P2=3, P3=4, P4=5
- ✅ 초기 농장 보드: 3행×5열

### 건설 비용
- ✅ 나무 방: 나무 5 + 갈대 2
- ✅ 외양간: 나무 2
- ✅ 울타리: 나무 1/칸
- ✅ 집 개조: 흙/돌 1/방 + 갈대 1(전체)

### 목장 용량
- ✅ `cellCount × 2 × 2^stableCount` (1칸=2마리, 외양간 ×2)

### 점수 계산 (scoring-engine.ts)
- ✅ 밭 점수: [-1, 1, 2, 3, 4, 4]
- ✅ 목장 점수: [-1, 1, 2, 3, 4]
- ✅ 밀/채소/양/멧돼지/소 점수 함수 구간 정확
- ✅ 가족 점수: 1인당 3점
- ✅ 방 VP: 나무=0, 흙=1, 돌=2
- ✅ 구걸 토큰: -3점/개

### OR 조건 행동 (구현 완료)
- ✅ 가축 시장 (V2/V34_ANIMAL_MKT): pending_animal_select → 3종 선택 버튼 UI
- ✅ 농장 확장 (FARM_EXPANSION): 방/외양간 전환 버튼 UI
- ✅ RC_GRAIN_UTIL: pending_sow → 씨뿌리기 UI (빵 굽기는 Phase 2)

---

## Phase 2 대상 (미구현 — 알려진 항목)

| 항목 | 설명 | 파일 |
|------|------|------|
| RC_GRAIN_UTIL 빵 굽기 | 화로/화덕 카드 연동 필요 | game-engine.ts |
| LESSONS 직업 카드 플레이 | 비용 차감 + 카드 효과 발동 | action-spaces.ts:91,176,199 |
| EXT4_TRAVEL 임시 일꾼 추가 | 이번 라운드 일꾼 1명 추가 | action-spaces.ts:186 |
| MAJ_WELL 미래 라운드 음식 | 5개 라운드 공간에 음식 배치 | cards/major-improvements.ts:100 |
| 대시설 동물→음식 변환 | 화덕(화로) 동물 즉시 요리 | cards/major-improvements.ts:63 |
| card-engine.ts triggerEffects | 카드 효과 전체 구현 | lib/card-engine.ts |
| A/B덱 직업·소시설 effects | 카드별 효과 함수 연결 | lib/cards/*.ts |
| CardHand.tsx + CardDetail.tsx | 카드 손패 UI | (미생성) |
| HarvestModal.tsx | 수확 단계 식량 공급 UI | (미생성) |
| 울타리 건설 UI | FenceGrid 인터랙션 | (미생성) |

---

## 확인 필요 항목

### 주요 설비 (RC_MAJOR_IMP) 행동칸
- **현황:** `pending_major_imp` RoundPhase 없음. 클릭 시 state 반환만 함
- **설계 질문:** 대시설 목록(화로/화덕/우물/흙가마/돌가마/가구제작소/그릇제작소/바구니제작소) 선택 UI가 Phase 2 대상인지 확인 필요
- **권고:** Phase 2 시 `pending_major_imp` phase 추가 + 건설 가능 설비 목록 모달

### Traveling Players (EXT4_TRAVEL)
- **현황:** 누적 음식만 처리, 임시 일꾼 추가 미구현
- **문서 표기:** ⚠️ 미확인 (룰북 재확인 필요, 4인 전용)

### 소박한 가족 늘리기 라운드 조건
- **action-spaces.ts:** effect에서 라운드 조건 없이 `pending_family_growth` 전환
- **GamePage.tsx:** handlePendingConfirm에서 5라운드 검사 추가됨 ✅
- **개선 고려:** action-spaces.ts effect에서도 조건 검증 추가 시 일관성 향상

### 되돌리기(Undo) 기능
- **현황:** 미구현
- **설계 방향:** 순수 함수 아키텍처(state → state)이므로 undo 스택 구현 용이
  - `useAgricolaStore`에 `history: GameState[]` 추가
  - placeWorker 등 주요 액션 전 history push
  - undo() → history.pop()으로 이전 state 복원

---

## 다음 단계 권고 (Phase 2 진입 전)

### 단기 수정 필요
1. **RC_MAJOR_IMP 행동칸 설계**: 대시설 선택 UI (모달/사이드패널) 기획 확정
2. **소박한 가족 늘리기 조건**: action-spaces.ts effect에서도 round >= 5 검증

### Phase 2 주요 목표
1. card-engine.ts triggerEffects 전체 구현
2. A/B덱 직업 effects 연결 (24+23장)
3. A/B덱 소시설 effects 연결 (24+24장)
4. RC_GRAIN_UTIL 빵 굽기 UI (화로/화덕 연동)
5. HarvestModal 식량 공급 인터랙션
6. Undo 기능 구현
