# 아그리콜라 행동 공간 전체 목록

> Phase 0 설계 문서  
> **출처: 공식 룰북 + 공식 Appendix PDF (Lookout Games, 2016)**  
> ✅ = 공식 문서로 확인, ⚠️ = 추가 확인 필요

---

## 1. 메인 보드 영구 행동 공간 (항상 가용, 전 인원 공통)

총 **10개** 공간 (Unofficial Compendium v4.1 확인) ✅

| ID | 이름(영) | 이름(한) | 유형 | 효과 | 확인 |
|----|---------|---------|------|------|------|
| `FOREST` | Forest | 큰 숲 | 누적 | +3 나무 | ✅ |
| `CLAY_PIT` | Clay Pit | 점토 구덩이 | 누적 | +1 점토 | ✅ |
| `REED_BANK` | Reed Bank | 갈대 호수 | 누적 | +1 갈대 | ✅ |
| `FISHING` | Fishing | 낚시 | 누적 | +1 음식 | ✅ |
| `GRAIN_SEEDS` | Grain Seeds | 곡식 씨앗 | 영구 | 밀 1개 획득 (비누적, 매 라운드 동일) | ✅ |
| `FARMLAND` | Farmland | 경작지 | 영구 | 밭 1칸 갈기 | ✅ |
| `LESSONS` | Lessons | 교습 | 영구 | 직업 카드 1장 플레이 (첫 번째 무료, 이후 음식 1개) | ✅ |
| `DAY_LABORER` | Day Laborer | 날품팔이 | 영구 | 음식 2개 획득 | ✅ |
| `FARM_EXPANSION` | Farm Expansion | 농장 확장 | 영구 | 방 건설 and/or 외양간 건설 | ✅ |
| `MEETING_PLACE` | Meeting Place | 만남의 장소 | 영구 | **반드시** 선플레이어 토큰 획득 (이후 소시설 1장 플레이 가능) | ✅ |

> **구조 설명:**
> - Forest / Clay Pit / Reed Bank / Fishing: 누적 공간 — 매 라운드 보충, 사용 시 전부 획득
> - 나머지 6개: 영구 행동 공간 — 매 라운드 동일한 효과, 누적 없음
> - 워커 슬롯: 전부 1개
>
> **중요 규칙:**
> - `LESSONS`: 1~2인 게임에서 첫 번째 직업 카드는 무료. 이후 장당 음식 1개. 3인 이상은 전용 타일로 처리.
> - `MEETING_PLACE`: 선플레이어 토큰 획득은 **의무** — 선택적으로 소시설만 플레이할 수 없음.
> - `GRAIN_SEEDS`: 비누적 — 사용하지 않아도 매 라운드 밀 1개 유지되지 않음 (고정 1개)

---

## 2. 라운드 카드 (Round Cards) — 14장, 스테이지별 공개

각 라운드 시작 시 1장씩 보드에 추가됨. 이후 라운드에도 계속 사용 가능.

### 스테이지 1 (라운드 1-4, 4장)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `RC_MAJOR_IMP` | Major Improvement | 대시설 | 대시설 1개 OR 소시설 1장 플레이 | ✅ |
| `RC_FENCING` | Fencing | 울타리 건설 | 울타리 N개 건설 (1나무/개) | ✅ |
| `RC_GRAIN_UTIL` | Grain Utilization | 농업 활용 | 씨뿌리기 and/or 빵 굽기 | ✅ |
| `RC_SHEEP_MKT` | Sheep Market | 양 시장 | 누적 +1 양 | ✅ |

### 스테이지 2 (라운드 5-7, 3장)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `RC_BASIC_WISH` | Basic Wish for Children | 가족 소원 (기본) | 가족 증가(방 필요) + 이후 소시설 플레이 | ✅ |
| `RC_HOUSE_RENO` | House Redevelopment | 집 개량 | 개량 1회 + 이후 대/소시설 플레이 | ✅ |
| `RC_WEST_QUARRY` | Western Quarry | 서쪽 채석장 | 누적 +1 돌 | ✅ |

### 스테이지 3 (라운드 8-9, 2장)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `RC_VEG_SEEDS` | Vegetable Seeds | 채소 씨앗 | 채소 1개 획득 (즉시 심기 불가) | ✅ |
| `RC_PIG_MKT` | Pig Market | 돼지 시장 | 누적 +1 멧돼지 | ✅ |

### 스테이지 4 (라운드 10-11, 2장)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `RC_CATTLE_MKT` | Cattle Market | 소 시장 | 누적 +1 소 | ✅ |
| `RC_EAST_QUARRY` | Eastern Quarry | 동쪽 채석장 | 누적 +1 돌 | ✅ |

### 스테이지 5 (라운드 12-13, 2장)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `RC_URGENT_WISH` | Urgent Wish for Children | 급한 가족 늘리기 | 가족 증가 (방 없어도 가능) | ✅ |
| `RC_CULTIVATION` | Cultivation | 밭 농사 | 밭 1칸 갈기 + 씨 뿌리기 (동시 가능) | ✅ |

### 스테이지 6 (라운드 14, 1장)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `RC_FARM_RENO` | Farm Redevelopment | 농장 개조 | 집 개조 + 울타리 치기 (동시 가능) | ✅ |

---

## 3. 인원별 추가 행동 공간

### 4인 전용 보드 확장 타일 (6개 추가 공간)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `EXT4_COPSE` | Copse | 작은 숲 | 누적 +1 나무 | ✅ |
| `EXT4_GROVE` | Grove | 숲 | 누적 +2 나무 | ✅ |
| `EXT4_HOLLOW` | Hollow | 움푹한 땅 | 누적 +2 점토 | ✅ |
| `EXT4_RES_MKT` | Resource Market | 자원 시장 | 갈대 1 + 돌 1 + 음식 1 즉시 | ✅ |
| `EXT4_LESSONS_A` | Lessons | 교습 A | 직업 1장 플레이 (비용: 음식 2, 첫 2장 1씩) | ✅ |
| `EXT4_TRAVEL` | Traveling Players | 떠돌이 | 누적 +1 음식 + 이번 라운드 워커 추가 가능 | ✅ |

### 3인 전용 보드 확장 타일 (1개 추가)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `EXT3_LESSONS` | Lessons | 교습 | 직업 1장 플레이 (비용: 음식 2) | ✅ |

### 2인 전용 타일 (1장 타일, 4개 공간 중 1개 선택 사용 — 사용 시 타일 전체 봉쇄)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `V2_COPSE` | Copse | 작은 숲 | 누적 +1 나무 | ✅ |
| `V2_RES_MKT` | Resource Market | 자원 시장 | 돌 1 + 음식 1 즉시 | ✅ |
| `V2_ANIMAL_MKT` | Animal Market | 동물 시장 | 양 1+음식 1 OR 멧돼지 1 OR 소 1-음식 1 | ✅ |
| `V2_MODEST_WISH` | Modest Wish for Children | 가족 소원 (소박한) | 라운드 5부터: 가족 증가 (방 필요) | ✅ |

### 3/4인 공용 소형 타일 (2개 공간)

| ID | 이름(영) | 이름(한) | 효과 | 확인 |
|----|---------|---------|------|------|
| `V34_ANIMAL_MKT` | Animal Market | 동물 시장 | 동물 1마리 획득 (양/멧돼지/소 선택) | ✅ |
| `V34_MODEST_WISH` | Modest Wish for Children | 가족 소원 (소박한) | 라운드 5부터: 가족 증가 (방 필요) | ✅ |

---

## 4. TypeScript 상수 정의

```typescript
// constants.ts
export const STAGE_ROUNDS: Record<number, number[]> = {
  1: [1, 2, 3, 4],
  2: [5, 6, 7],
  3: [8, 9],
  4: [10, 11],
  5: [12, 13],
  6: [14],
};

export const HARVEST_ROUNDS = [4, 7, 9, 11, 13, 14] as const;

export const ROUND_CARD_BY_STAGE: Record<number, string[]> = {
  1: ['RC_MAJOR_IMP', 'RC_FENCING', 'RC_GRAIN_UTIL', 'RC_SHEEP_MKT'],
  2: ['RC_BASIC_WISH', 'RC_HOUSE_RENO', 'RC_WEST_QUARRY'],
  3: ['RC_VEG_SEEDS', 'RC_PIG_MKT'],
  4: ['RC_CATTLE_MKT', 'RC_EAST_QUARRY'],
  5: ['RC_URGENT_WISH', 'RC_CULTIVATION'],
  6: ['RC_FARM_RENO'],
};

// 영구 행동 공간 10개 ID 목록
export const PERMANENT_ACTION_SPACES = [
  'FOREST', 'CLAY_PIT', 'REED_BANK', 'FISHING',
  'GRAIN_SEEDS', 'FARMLAND', 'LESSONS', 'DAY_LABORER',
  'FARM_EXPANSION', 'MEETING_PLACE',
] as const;
```

---

## 5. 집 개량 (Renovation) 비용표 ✅

방 재질 업그레이드 비용 (나무위키 확인):

| 현재 → 목표 | 비용 |
|-----------|------|
| 나무 → 점토 | 점토 **1개/방** + 갈대 **1개** (전체) |
| 점토 → 돌 | 돌 **1개/방** + 갈대 **1개** (전체) |

> **예시:** 나무 방 3칸 → 흙집: 흙 3개 + 갈대 1개  
> **제약:** 집 전체를 한 번에 개조해야 함. 일부만 개조 불가.  
> **제약:** 나무 → 돌 한 번에 불가. 반드시 나무 → 점토 → 돌 순서.

---

## 6. 방 건설 비용표

| 방 재질 | 건설 비용 |
|--------|---------|
| 나무 방 | 나무 5 + 갈대 2 (공식 확인) ✅ |
| 점토 방 | ⚠️ 개량으로만 가능 (직접 건설 불가) |
| 돌 방 | ⚠️ 개량으로만 가능 (직접 건설 불가) |

> 시작 시 나무 방 2개 보유. 방 추가는 Farm Expansion 행동 공간에서.

---

## 7. 누적 공간 초기화 규칙

```typescript
// 워커가 없을 때만 매 라운드 자원 누적
// 워커가 있으면 자원 누적 없음 (행동 사용 시 전부 가져가므로)
function replenishActionSpaces(state: GameState): GameState {
  const spaces = { ...state.actionSpaces };
  for (const [id, spaceState] of Object.entries(spaces)) {
    // 워커가 없는 누적 공간에만 자원 추가
    if (spaceState.workerId === null && spaceState.space.accumulates) {
      for (const acc of spaceState.space.accumulates) {
        spaces[id].accumulatedResources = {
          ...spaces[id].accumulatedResources,
          [acc.resource]: spaces[id].accumulatedResources[acc.resource] + acc.amount,
        };
      }
    }
  }
  return { ...state, actionSpaces: spaces };
}
```

---

## 8. 확인 완료 및 미확인 항목

### 확인 완료 ✅
- [x] 영구 행동 공간 10개 전체 목록 (Unofficial Compendium v4.1)
- [x] 스테이지 5 두 번째 라운드 카드: RC_CULTIVATION (밭 농사 — 밭 1칸 갈기 + 씨 뿌리기 동시 가능)
- [x] 스테이지 6 라운드 카드: RC_FARM_RENO (농장 개조 — 집 개조 + 울타리 치기)
- [x] 집 개량 (Renovation) 비용: 점토/돌 1개/방 + 갈대 1개(전체)
- [x] LESSONS: 첫 직업 무료, 이후 음식 1개 (1-2인 기준)
- [x] MEETING_PLACE: 선플레이어 토큰 의무 획득

### 미확인 항목 ⚠️
- [ ] Traveling Players 정확한 효과 (4인 전용 타일 — "Receive 1 Food; place 1 additional person token on an action space" 추정)
- [ ] Farm Expansion 외양간 건설 비용 (나무 2/외양간 vs 나무 1/외양간)
- [ ] 2인 타일의 누적 자원 정확한 초기화 타이밍 (라운드 시작 vs 라운드 종료)
- [ ] 3인 Resource Market 정확한 효과 (갈대1+돌1+음식1 동시 vs 둘 중 선택)
