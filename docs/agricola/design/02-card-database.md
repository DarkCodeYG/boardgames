# 아그리콜라 카드 데이터베이스

> Phase 0 설계 문서  
> 대상: Agricola Revised Edition 2016 (Lookout Spiele)  
> 출처: 공식 룰북 + 나무위키 + Unofficial Compendium v4.1  
> ⚠️ 물리 카드 대조 전까지 효과 텍스트는 "초안" 상태

---

## 1. 카드 체계 ✅ (나무위키 확인)

### ❌ 이전 오류: E/I/K 덱 분류 (구판 기준) → 삭제

### ✅ 올바른 덱 체계: A/B/C/D/E 알파벳 덱

| 덱 | 기본판 포함 | 용도 |
|----|-----------|------|
| **A덱** | ✅ (직업 24장 + 보조설비 24장 일부 = 48장) | 기본판 내장 |
| **B덱** | ✅ (직업 24장 + 보조설비 24장 일부 = 48장) | 기본판 내장 |
| C덱 | ❌ 확장팩 | 보조 설비 + 직업 120장 |
| D덱 | ❌ 확장팩 | 보조 설비 + 직업 120장 |
| E덱 | ❌ 확장팩 | 보조 설비 + 직업 168장 (4인까지) |

> **중요:** 기본판은 A덱 전체가 아니라 A/B덱의 **일부 카드 48장씩** 내장  
> 15주년 기념판에는 A/B덱 결번 없이 전체 포함

### 기본판 카드 수량
| 타입 | A덱 | B덱 | 합계 |
|------|-----|-----|------|
| 직업 (Occupation) | 24장 | 24장 | **48장** |
| 보조 설비 (Minor Improvement) | 24장 | 24장 | **48장** |
| **합계** | **48장** | **48장** | **96장** |

### 주요설비 (Major Improvements) - 카드 아님, 공용 보드
| ID | 이름(한) | 이름(영) | 비용 | VP |
|----|---------|---------|------|-----|
| `MAJ_FIREPLACE_2` | 화덕 (점토 2) | Fireplace (2 clay) | 점토 2 | 1 |
| `MAJ_FIREPLACE_3` | 화덕 (점토 3) | Fireplace (3 clay) | 점토 3 | 1 |
| `MAJ_COOKING_HEARTH_4` | 취사장 (점토 4) | Cooking Hearth (4 clay) | 점토 4 | 1 |
| `MAJ_COOKING_HEARTH_5` | 취사장 (점토 5) | Cooking Hearth (5 clay) | 점토 5 | 1 |
| `MAJ_WELL` | 우물 | Well | 갈대 1, 돌 3 | 4 |
| `MAJ_CLAY_OVEN` | 점토 오븐 | Clay Oven | 점토 3, 돌 1 | 2 |
| `MAJ_STONE_OVEN` | 돌 오븐 | Stone Oven | 점토 1, 돌 3 | 3 |
| `MAJ_JOINERY` | 목공소 | Joinery | 나무 2, 돌 2 | 2 |
| `MAJ_POTTERY` | 도예소 | Pottery | 점토 2, 돌 2 | 2 |
| `MAJ_BASKETMAKERS_WORKSHOP` | 바구니 공방 | Basketmaker's Workshop | 갈대 2, 돌 2 | 2 |

---

## 2. 카드 ID 체계 ✅

실물 카드의 ID를 그대로 사용 (예: A086, B019):

```
[덱 알파벳][번호]
A086 = A덱 86번 직업 카드
B019 = B덱 19번 보조 설비 카드
```

### 기본판 수록 카드 ID 전체 목록 (나무위키 확인) ✅

#### 직업 카드 (Occupations) - 48장

**A덱 직업 24장:**
```
A086, A087, A088, A090, A092, A098, A102, A108,
A110, A111, A112, A114, A116, A119, A120, A123,
A125, A133, A138, A143, A147, A155, A160, A165
```

**B덱 직업 24장:**
```
B087, B089, B091, B095, B097, B098, B099, B102,
B104, B107, B108, B109, B114, B118, B121, B123,
B136, B142, B145, B156, B163, B164, B166
```
> ⚠️ B덱은 23개만 확인됨 (B1236은 오타로 추정, 원본 확인 필요)

#### 보조 설비 카드 (Minor Improvements) - 48장

**A덱 보조 설비 24장:**
```
A002, A005, A009, A012, A016, A019, A024, A026,
A032, A033, A038, A044, A050, A053, A055, A056,
A063, A067, A069, A071, A075, A078, A080, A083
```

**B덱 보조 설비 24장:**
```
B002, B008, B010, B013, B016, B019, B024, B025,
B033, B036, B039, B045, B047, B050, B056, B057,
B061, B062, B066, B068, B074, B077, B080, B084
```

---

## 3. 카드 TypeScript 인터페이스 (참조)

```typescript
interface Card {
  id: string;                    // 실물 카드 ID 그대로 사용: "A086", "B019" 등
  type: 'occupation' | 'minor_improvement';
  deck: 'A' | 'B' | 'C' | 'D' | 'E';  // 개정판 알파벳 덱 체계
  nameKo: string;
  nameEn: string;
  cost?: ResourceCost;           // 소시설은 비용 있음, 직업은 보통 없음
  playingCost?: ResourceCost;    // 직업: 플레이 시 추가 비용 (음식 등)
  effects: CardEffect[];
  victoryPoints?: number | ((state: GameState, playerId: PlayerId) => number);
  prerequisites?: string;        // "직업 카드 X장 이상 보유" 등 조건
  clarifications?: string[];
}
```

---

## 4. A-덱 직업 카드 목록 ✅ (Unofficial Compendium v4.1 확인)

| ID | 이름(영) | 비용/조건 | 효과 요약 | VP |
|----|---------|----------|---------|-----|
| `A086` | Animal Tamer | - | 즉시 나무1 또는 밀1 선택 획득. 집 방 1개당 동물 1마리 보관 가능 | - |
| `A087` | Conservator | - | 나무→돌 한 번에 개량 가능 (점토 단계 생략) | - |
| `A088` | Hedge Keeper | - | 울타리 건설 시 3개까지 나무 비용 면제 | - |
| `A090` | Plow Driver | - | 돌집 거주 시, 매 라운드 시작에 음식1 지불→밭 1칸 갈기 | - |
| `A092` | Adoptive Parents | - | 음식1 지불 시 같은 라운드에 태어난 가족 말로 즉시 행동 가능 | - |
| `A098` | Stable Architect | - | 결산 시, 울타리 없는 외양간 1개당 +1점 | - |
| `A102` | Grocer | - | 나무/밀/갈대/돌/채소/점토/갈대/채소 순으로 쌓음. 언제든 음식1→맨 위 자원 구입 | - |
| `A108` | Mushroom Collector | - | 나무 누적 공간 사용 후 즉시: 나무1→음식2 교환 가능 (교환 시 나무는 누적 공간으로) | - |
| `A110` | Roughcaster | - | 점토 방 건설 또는 점토→돌 개량 시마다 음식3 획득 | - |
| `A111` | Wall Builder | - | 방 건설 시 이후 4개 라운드 공간에 음식1씩 배치 | - |
| `A112` | Scythe Worker | - | 즉시 밀1 획득. 수확 밭 단계에서 밀밭 1개당 추가 밀1 수확 | - |
| `A114` | Seasonal Worker | - | 날품팔이 행동 시 밀1 추가 획득. 6라운드부터 채소1로 선택 가능 | - |
| `A116` | Wood Cutter | - | 나무 누적 공간 사용 시 나무1 추가 획득 | - |
| `A119` | Firewood Collector | - | Farmland/Grain Seeds/Grain Utilization/Cultivation 행동 후 나무1 획득 | - |
| `A120` | Clay Hut Builder | - | 나무집 아닌 집 거주 시, 이후 5개 라운드 공간에 점토2씩 배치 | - |
| `A123` | Frame Builder | - | 방 건설/개량 시 한 번, 점토2 또는 돌2를 나무1로 대체 가능 | - |
| `A125` | Priest | - | 점토 방 2개 보유 시 즉시: 점토3 + 갈대2 + 돌2 획득 | - |
| `A133` | Braggart | - | 결산 시, 시설 카드 5/6/7/8/9/10장 이상 보유 시 2/3/4/5/7/9점 보너스 | - |
| `A138` | Harpooner | - | 낚시 행동 시 나무1 지불로 가족 수만큼 음식 + 갈대1 추가 획득 | - |
| `A143` | Stonecutter | - | 모든 시설/방/개량 비용에서 돌1 절감 | - |
| `A147` | Animal Dealer | - | 양/돼지/소 시장 행동 시 음식1 지불로 해당 동물 1마리 추가 구입 | - |
| `A155` | Conjurer | - | 떠돌이 행동 시 나무1 + 밀1 추가 획득 | - |
| `A160` | Lutenist | - | 다른 플레이어가 떠돌이 사용 시 음식1 + 나무1 획득. 이후 즉시 채소1→음식2 구입 가능 | - |
| `A165` | Pig Breeder | - | 즉시 멧돼지1 획득. 12라운드 종료 시 멧돼지 번식 1회 추가 | - |

---

## 5. B-덱 직업 카드 목록 ✅ (Unofficial Compendium v4.1 확인)

> ⚠️ 24번째 카드 B096 (Tree Farm Joiner) 존재 가능성 있음 — 원본 카드 대조 필요

| ID | 이름(영) | 비용/조건 | 효과 요약 | VP |
|----|---------|----------|---------|-----|
| `B087` | Cottager | - | 날품팔이 행동 시 방 건설 또는 집 개량 가능 (비용 별도 지불) | - |
| `B089` | Groom | - | 즉시 나무1. 돌집 거주 시 매 라운드 시작에 나무1→외양간1 건설 가능 | - |
| `B091` | Assistant Tiller | - | 날품팔이 행동 시 밭 1칸 갈기 추가 가능 | - |
| `B095` | Master Bricklayer | - | 주요설비 건설 시 돌 비용 = (초기 집에서 추가 건설한 방 수)만큼 절감 | - |
| `B097` | Scholar | - | 돌집 거주 시, 매 라운드 시작에 음식1로 직업 또는 소시설 1장 플레이 | - |
| `B098` | Organic Farmer | - | 결산 시, 동물 있으면서 수용 여유 3마리 이상인 목장 1개당 +1점 | - |
| `B099` | Tutor | - | 결산 시, 이 카드 이후 플레이한 직업 1장당 +1점 | - |
| `B102` | Consultant | - | 즉시: 1/2/3/4인 게임에서 밀2/점토3/갈대2/양2 중 해당 인원 수량 획득 | - |
| `B104` | Sheep Walker | - | 언제든지 양1→멧돼지1 또는 채소1 또는 돌1로 교환 | - |
| `B107` | Manservant | - | 돌집 거주 시, 남은 라운드 공간마다 음식3 배치 | - |
| `B108` | Oven Firing Boy | - | 나무 누적 공간 사용 시 빵 굽기 행동 1회 추가 | - |
| `B109` | Paper Maker | - | 이후 직업 플레이 직전: 나무1 지불로 보유 직업 수만큼 음식 획득 | - |
| `B114` | Childless | - | 방3개 이상 + 가족2명인 경우, 매 라운드 시작에 음식1 + 밀 또는 채소1 획득 | - |
| `B118` | Small-scale Farmer | - | 방 2개인 동안, 매 라운드 시작에 나무1 획득 | - |
| `B121` | Geologist | - | 큰 숲/갈대 호수 사용 시 점토1 추가. 3인 이상 시 점토 구덩이에도 적용 | - |
| `B123` | Roof Ballaster | - | 즉시 음식1 지불로 보유 방 수만큼 돌 획득 가능 | - |
| `B136` | House Steward | - | 라운드 잔여에 따라 즉시 나무 획득(1/3/6/9 라운드 남음→1/2/3/4나무). 결산 시 방 가장 많은 플레이어에게 +3점 | - |
| `B142` | Greengrocer | - | 곡식 씨앗 행동 시 채소1 추가 획득 | - |
| `B145` | Brushwood Collector | - | 방 건설/개량 시 필요한 갈대1~2개를 나무1로 대체 가능 | - |
| `B156` | Storehouse Keeper | - | 자원 시장 행동 시 점토1 또는 밀1 추가 획득 | - |
| `B163` | Pastor | - | 방2개 집에 유일하게 거주하는 경우 즉시 나무3+점토2+갈대1+돌1 획득 (1회) | - |
| `B164` | Sheep Whisperer | - | 현재+2, +5, +8, +10 라운드 공간에 양1씩 배치, 해당 라운드 시작에 획득 | - |
| `B166` | Cattle Feeder | - | 곡식 씨앗 행동 시 음식1 지불로 소1 구입 가능 | - |

---

## 6. A-덱 소시설 카드 목록 ✅ (Unofficial Compendium v4.1 확인)

| ID | 이름(영) | 비용 | 조건 | 효과 요약 | VP |
|----|---------|------|------|---------|-----|
| `A002` | Shifting Cultivation | 음식2 | - | 즉시 밭 1칸 갈기 | - |
| `A005` | Clay Embankment | 음식1 | - | 즉시 보유 점토 2개당 점토1 추가 획득 | - |
| `A009` | Young Animal Market | 양1 | - | 즉시 소1 획득 (양1↔소1 교환) | - |
| `A012` | Drinking Trough | 점토1 | - | 각 목장(외양간 포함 무관)에 동물 2마리 추가 수용 | - |
| `A016` | Rammed Clay | 무료 | - | 즉시 점토1 획득. 울타리 건설 시 나무 대신 점토 사용 가능 | - |
| `A019` | Handplow | 나무1 | - | (현재 라운드+5)번 라운드 공간에 밭 타일 1개 배치, 해당 라운드 시작에 밭 갈기 가능 | - |
| `A024` | Threshing Board | 나무1 | 직업2장+ | Farmland 또는 Cultivation 행동 시 빵 굽기 행동 1회 추가 | 1 |
| `A026` | Sleeping Corner | 나무1 | 밀밭2개+ | 워커 1명 있는 가족 소원 행동 공간에도 사용 가능 | 1 |
| `A032` | Manger | 나무2 | - | 결산 시, 목장 총 면적 6/7/8/10칸 이상이면 1/2/3/4점 보너스 | - |
| `A033` | Big Country | 무료 | 농장 모든 칸 사용 시 | 즉시 남은 라운드 수만큼 +1점/라운드 + 음식2/라운드 | - |
| `A038` | Wool Blankets | 무료 | 양5마리+ | 결산 시, 나무/점토/돌집이면 3/2/0점 보너스 | - |
| `A044` | Pond Hut | 나무1 | 직업 정확히 2장 | 이후 3개 라운드 공간에 음식1씩 배치 | 1 |
| `A050` | Milk Jug | 점토1 | - | 누군가 소 시장 사용 시: 본인 음식3 획득 + 다른 플레이어 음식1씩 획득 | - |
| `A053` | Claypipe | 점토1 | - | 매 라운드 귀환 시, 일하는 단계에서 건설 자원 7개 이상 획득 시 음식2 | - |
| `A055` | Junk Room | 나무1+점토1 | - | 이 카드 포함, 시설 플레이 시마다 음식1 획득 | - |
| `A056` | Basket | 갈대1 | - | 나무 누적 공간 사용 직후, 나무2→음식3 교환 가능 (교환 시 나무는 누적 공간으로) | - |
| `A063` | Dutch Windmill | 나무2+돌2 | - | 수확 다음 라운드에 빵 굽기 행동 시 음식3 추가 | 2 |
| `A067` | Corn Scoop | 나무1 | - | 곡식 씨앗 행동 시 밀1 추가 획득 | - |
| `A069` | Large Greenhouse | 나무2 | 직업2장+ | 현재+(4,7,9) 라운드 공간에 채소1씩 배치, 해당 라운드 시작에 획득 | - |
| `A071` | Clearing Spade | 나무1 | - | 언제든지 씨앗 2개 이상인 밭에서 씨앗1을 빈 밭으로 이동 | - |
| `A075` | Lumber Mill | 돌2 | 직업3장 이하 | 모든 시설 비용 나무1 절감 | 2 |
| `A078` | Canoe | 나무2 | 직업1장+ | 낚시 행동 시 음식1 + 갈대1 추가 획득 | 1 |
| `A080` | Stone Tongs | 나무1 | - | 돌 누적 공간 사용 시 돌1 추가 획득 | - |
| `A083` | Shepherd's Crook | 나무1 | - | 4칸 이상 목장 울타리 설치 시 즉시 해당 목장에 양2마리 | - |

---

## 7. B-덱 소시설 카드 목록 ✅ (Unofficial Compendium v4.1 확인)

| ID | 이름(영) | 비용 | 조건 | 효과 요약 | VP |
|----|---------|------|------|---------|-----|
| `B002` | Mini Pasture | 음식2 | - | 즉시 나무 비용 없이 한 칸 울타리 목장 만들기 (기존 목장에 인접해야 함) | - |
| `B008` | Market Stall | 밀1 | - | 즉시 채소1 획득 (밀1↔채소1 교환) | - |
| `B010` | Caravan | 나무3+음식3 | - | 이 카드가 방 1개 역할. (실제 방은 아님) | - |
| `B013` | Carpenter's Parlor | 나무1+돌1 | - | 나무 방 건설 비용: 나무2+갈대2로 절감 | - |
| `B016` | Mining Hammer | 나무1 | - | 즉시 음식1. 개량 시마다 나무 추가 지불 없이 외양간1 건설 가능 | - |
| `B019` | Moldboard Plow | 나무2 | 직업1장+ | 이 카드에 밭 타일2개 보관. Farmland 행동 시 추가로 밭1 갈기 가능 (2회 한정) | - |
| `B024` | Lasso | 갈대1 | - | 양/돼지/소 시장 행동 시 2명이 연달아 행동 가능 (한 명이 해당 행동 포함 시) | - |
| `B025` | Bread Paddle | 나무1 | - | 즉시 음식1. 직업 플레이 시마다 빵 굽기 행동 1회 추가 | - |
| `B033` | Mantlepiece | 돌1 | 점토 또는 돌집 | 즉시 남은 라운드 수만큼 +1점. 이후 집 개량 불가 | -3 |
| `B036` | Bottles | 가족 수×(점토1+음식1) | - | 이 카드 플레이 시 가족 수만큼 점토+음식 지불 | 4 |
| `B039` | Loom | 나무2 | 직업2장+ | 수확 밭 단계에서 양 1/4/7마리 이상 시 음식1/2/3. 결산 시 양 3마리당 +1점 | 1 |
| `B045` | Strawberry Patch | 나무1 | 채소밭2개+ | 이후 3개 라운드 공간에 음식1씩 배치 | 2 |
| `B047` | Herring Pot | 점토1 | - | 낚시 행동 시, 이후 3개 라운드 공간에 음식1씩 배치 | - |
| `B050` | Butter Churn | 나무1 | 직업3장 이하 | 수확 시 양 3마리당 음식1 + 소 2마리당 음식1 | 1 |
| `B056` | Brook | 무료 | 낚시 행동 공간에 본인 워커 필요 | 낚시 공간 위 4개 행동 공간 사용 시 음식1 추가 | - |
| `B057` | Scullery | 나무1+점토1 | - | 나무집 거주 중 매 라운드 시작에 음식1 획득 | - |
| `B061` | Three-Field Rotation | 무료 | 직업3장+ | 수확 밭 단계 시작 시, 밀밭1+채소밭1+빈밭1 보유 시 음식3 | - |
| `B062` | Pitchfork | 나무1 | - | 곡식 씨앗 행동 시, Farmland 행동 공간 점유 시 음식3 추가 | - |
| `B066` | Sack Cart | 나무2 | 직업2장+ | 5/8/11/14라운드 공간에 밀1씩 배치, 해당 라운드 시작에 획득 | - |
| `B068` | Beanfield | 음식1 | 직업2장+ | 이 카드 자체가 채소만 심을 수 있는 밭 역할 | 1 |
| `B074` | Thick Forest | 무료 | 점토5개+ 보유 | 남은 짝수 라운드 공간에 나무1씩 배치, 해당 라운드 시작에 획득 | - |
| `B077` | Loam Pit | 음식1 | 직업3장+ | 날품팔이 행동 시 점토3 추가 획득 | 1 |
| `B080` | Hard Porcelain | 점토1 | - | 언제든지 점토2/3/4→돌1/2/3 교환 가능 | - |
| `B084` | Acorns Basket | 갈대1 | 직업3장+ | 이후 2개 라운드 공간에 멧돼지1씩 배치, 해당 라운드 시작에 획득 | - |

---

## 8. 카드 효과 구현 패턴

### 패턴 1: 즉시 효과 (IMMEDIATE)

```typescript
// A086 Animal Tamer: 즉시 나무1 또는 밀1 획득
const animalTamer: Card = {
  id: 'A086',
  type: 'occupation',
  deck: 'A',
  nameKo: '동물 조련사',
  nameEn: 'Animal Tamer',
  effects: [
    {
      trigger: 'IMMEDIATE',
      apply: (state, playerId) => {
        // UI: 플레이어가 나무1 또는 밀1 선택
        return addResources(state, playerId, { wood: 1 }); // or grain: 1
      },
    },
    {
      trigger: 'PASSIVE',
      // 집 방 1개당 동물 1마리 보관 (상시 효과)
      modifyAnimalCapacity: (player) => ({
        inHouseBonus: countRooms(player.farm),
      }),
    },
  ],
};
```

### 패턴 2: 조건부 트리거 (PLACE_WORKER)

```typescript
// A116 Wood Cutter: 나무 누적 공간 사용 시 나무1 추가
const woodCutter: Card = {
  id: 'A116',
  type: 'occupation',
  deck: 'A',
  nameKo: '나무꾼',
  nameEn: 'Wood Cutter',
  effects: [{
    trigger: 'PLACE_WORKER',
    condition: (_state, _player, actionId) => actionId === 'FOREST',
    apply: (state, playerId) => addResources(state, playerId, { wood: 1 }),
  }],
};
```

### 패턴 3: 게임 종료 VP (GAME_END)

```typescript
// B099 Tutor: 이 카드 이후 플레이한 직업 1장당 +1점
const tutor: Card = {
  id: 'B099',
  type: 'occupation',
  deck: 'B',
  nameKo: '개인교사',
  nameEn: 'Tutor',
  effects: [],
  victoryPoints: (state, playerId) => {
    const player = state.players[playerId];
    const tutorIndex = player.playedCards.findIndex(c => c.id === 'B099');
    const cardsAfter = player.playedCards.slice(tutorIndex + 1)
      .filter(c => c.type === 'occupation');
    return cardsAfter.length;
  },
};
```

### 패턴 4: 라운드 공간 예약 (ROUND_SPACE)

```typescript
// B164 Sheep Whisperer: 특정 라운드에 양1 자동 배치
const sheepWhisperer: Card = {
  id: 'B164',
  type: 'occupation',
  deck: 'B',
  nameKo: '양 속삭이는 자',
  nameEn: 'Sheep Whisperer',
  effects: [{
    trigger: 'IMMEDIATE',
    apply: (state, playerId) => {
      const currentRound = state.round;
      const targetRounds = [2, 5, 8, 10].map(offset => currentRound + offset)
        .filter(r => r <= 14);
      // 해당 라운드 공간에 양1 배치
      return placeOnRoundSpaces(state, playerId, targetRounds, { sheep: 1 });
    },
  }],
};
```

---

## 9. 카드 데이터베이스 완성 로드맵

| 단계 | 내용 | 상태 |
|------|------|------|
| Phase 0 | A/B 덱 카드 이름 수집 | ✅ 완료 (Compendium v4.1) |
| Phase 2 시작 전 | A/B 덱 효과 텍스트 한국어화 | 🔶 진행 필요 |
| Phase 2 A-덱 | A-덱 효과 구현 (48장) | 미시작 |
| Phase 2 B-덱 | B-덱 효과 구현 (48장) | 미시작 |
| Phase 3+ | C/D/E-덱 구현 (확장) | 미정 |

### 미확인 카드 ⚠️
- B-덱 직업 24번째 카드: **B096 (Tree Farm Joiner)** — 컴펜디엄에서 확인됐으나 나무위키 원본 ID 목록 누락. 물리 카드 확인 필요.

---

## 8. 향후 확장 (참고)

개정판 확장팩:
- **5-6인 확장**: 직업 48장 + 주요설비 8개 추가
- **Corbarius-Deck**: 테마 확장
- **Artifex-Deck**: 장인 테마
- **Consul Dirigens-Deck**: 지도자 테마

> Phase 1-3는 기본 96장만 구현. 확장은 아키텍처 설계에서 고려만 함.
