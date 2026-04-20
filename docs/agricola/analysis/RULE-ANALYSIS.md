# 규정-구현 갭 분석 (Agricola Revised Edition)

> 작성일: 2026-04-19  
> 기준 커밋: 현재 작업 디렉토리  
> 분석 범위: `src/games/agricola/lib/*.ts` vs `docs/agricola/korean-rules/*.md` + `design/05-action-spaces.md`  
> PDF (`en_agricolare.html_Rules_Agricola-RE_EN.pdf`, `Agricola_Revised_Edition_-_Unofficial_Compendium_v4.1.pdf`) 는 직접 파싱 불가로 본 분석에서는 마크다운 규정 문서를 1차 소스로 사용함. 확신 불가 항목은 "검증 필요" 로 표기.

---

## 요약

- 총 갭: **28개**
- Critical (게임 진행 불가 또는 룰 위반): **5개**
- Major (스코어/승패에 영향): **13개**
- Minor (UI/문구/로그 등): **10개**

Critical (요약)
1. 덱 배분·카드 플레이 파이프라인 전체 미구현 (`createGameState`가 손패를 비워둠)
2. 주요 설비 10개 중 7개가 효과 미구현 (`placeholder`)
3. 가축 시장(`V2_ANIMAL_MKT` / `V34_ANIMAL_MKT`) OR-선택 후속 처리 미구현
4. 수확 단계에서 "신생아 1음식" 계산은 맞지만, 같은 라운드에 "번식→요리" 방지 잠금 없음
5. 번식 배치 규칙: "같은 종 목장 여유" 판정 시 **외양간 단독 1마리 규칙**을 무시하고 집 안으로 즉시 fallback 됨

---

## 카테고리별 갭

### 1. 농장 보드 초기 상태

**규정** (docs/agricola/research/research/korean-rules/04-game-rules-ko.md L22-28)
> "각자 개인 농장 판을 받아 앞에 둔다 ... 선 플레이어는 음식 2개, 나머지는 3개로 시작"

정식 룰 (Rules PDF Setup, 한국어 요약 L24): 시작 농장은 **2×1 나무 방**. 외양간/울타리는 초기 배치 없음.

**현재 구현**
- `farm-engine.ts:19-21`: `grid[0][0] = 'room_wood'; grid[1][0] = 'room_wood';` → 2×1 세로 나무 방 배치 ✅
- `farm-engine.ts:22-33`: `fences / pastures / stables / animalsInHouse = []` ✅
- `game-engine.ts:36-41`: `food: 2 + i` (P1=2, P2=3, P3=4, P4=5) ✅ (개정판 4인 기준 맞음)

**갭**: 없음 / **심각도**: N/A

**제안**: 그대로 유지. 단 `constants.ts:15` 주석 "단, 초기 보드는 방1 + 빈칸1" 은 **오기** — 삭제 권장 (Minor).

---

### 2. 영구 행동 공간 10개

**규정** (docs/agricola/design/05-action-spaces.md L13-24, research/korean-rules/01-action-spaces-ko.md L10-21)

10개 공간 각각의 효과.

**현재 구현** (`action-spaces.ts:29-124`)

| ID | 구현 | 갭 |
|----|------|----|
| FOREST (+3나무 누적) | ✅ | 없음 |
| CLAY_PIT (+1흙 누적) | ✅ | 없음 |
| REED_BANK (+1갈대 누적) | ✅ | 없음 |
| FISHING (+1음식 누적) | ✅ | 없음 |
| GRAIN_SEEDS (밀 1, 비누적) | ✅ | 없음 |
| FARMLAND (밭 1칸 갈기) | ⚠️ | `roundPhase: 'pending_plow'` 전이만. UI 연동 검증 필요 (Minor) |
| LESSONS (첫 직업 무료, 이후 음식 1) | ❌ | **첫 무료 / 이후 음식 1 비용 검증 로직 없음.** `pending_play_occupation`만 설정, 비용 계산은 카드 플레이 엔진 Phase 2로 남김 (Major) |
| DAY_LABORER (+음식 2) | ✅ | 없음 |
| FARM_EXPANSION (방/외양간) | ⚠️ | `pending_build_room`만 설정. 외양간 전용 분기, "and/or" 둘 다 허용 로직 검증 필요 (Major) |
| MEETING_PLACE (선플 토큰 **의무** + 소시설 선택) | ✅ | `firstPlayerIndex` 갱신 정상. 단 startingPlayerToken이 "다음 라운드 선턴"인지 "즉시 반영"인지 타이밍 검증 필요 (Minor, 검증 필요) |

**갭**: LESSONS 비용 로직, FARM_EXPANSION and/or 분기 Phase 2에 의존 / **심각도**: Major (2건)

**제안**: 
- `LESSONS.effect` 에서 `occupationsPlayed === 0` 이면 비용 0, 아니면 음식 1 체크 추가.
- `FARM_EXPANSION` 후속 UI를 `pending_build_room | pending_build_stable | pending_build_both` 3상태로 확장.

---

### 3. 인원별 추가 행동 공간

**규정**: 2인은 4칸 타일 중 **1칸 선택 시 나머지 3칸 봉쇄**, 3인/4인은 별도 추가 공간 풀.

**현재 구현** (`action-spaces.ts:126-278`)
- `v2Spaces[4]` 전체가 `permanentSpaces`와 합쳐져 **4개 모두 사용 가능**으로 등록됨 → "1개 선택 시 타일 전체 봉쇄" 규칙 미구현 (`04-game-rules-ko.md` 미언급, `05-action-spaces.md:107`)

**갭**: 2인 타일 선택 봉쇄 / **심각도**: Major (2인 게임 전략 왜곡)

**제안**: 게임 시작 시 2인 모드면 4개 중 1개 id를 UI에서 선택 → 나머지 3개를 `actionSpaces`에서 제거.

**검증 필요**: `V2_COPSE` 누적 시작 시점 (라운드 1 시작 즉시 vs 라운드 종료). 현재 `replenishActionSpaces`는 **라운드 시작 시** 누적 — 이는 정식 룰(라운드 시작 후 공개, 누적은 이번 라운드부터)과 일치.

---

### 4. 라운드 카드 14장

**규정** (`05-action-spaces.md:38-84`): 스테이지별 카드 목록 + 효과.

**현재 구현** (`round-cards.ts:31-130`)

| ID | 효과 | 구현 | 갭 |
|----|------|------|----|
| RC_MAJOR_IMP | 대/소시설 플레이 | ⚠️ | `pending_major_imp`만 전이. 주요설비 건설 엔진(`buildMajorImprovement`)은 존재하나 소시설 엔진 미구현 (Major) |
| RC_FENCING | 울타리 N개 | ✅ | OK |
| RC_GRAIN_UTIL | 씨뿌리기 + 빵굽기 (동시 가능) | ❌ | `pending_sow`만 설정 — 빵 굽기 분기 미제공 (Major) |
| RC_SHEEP_MKT | +1양 누적 | ✅ | OK |
| RC_BASIC_WISH | 가족+1 (방 필요) + 소시설 플레이 | ⚠️ | 가족 증가는 OK, 소시설 후속 미구현 (Major) |
| RC_HOUSE_RENO | 집 개조 + 소시설 플레이 | ⚠️ | `pending_renovate`만, 소시설 후속 미구현 (Major) |
| RC_WEST_QUARRY | +1돌 누적 | ✅ | OK |
| RC_VEG_SEEDS | 채소 1 즉시 | ✅ | OK |
| RC_PIG_MKT | +1멧돼지 누적 | ✅ | OK |
| RC_CATTLE_MKT | +1소 누적 | ✅ | OK |
| RC_EAST_QUARRY | +1돌 누적 | ✅ | OK |
| RC_URGENT_WISH | 가족+1 (방 불필요) | ✅ | OK |
| RC_CULTIVATION | 밭+씨 (스테이지 5) | ✅ | OK (순서 강제 X — 검증 필요) |
| RC_FARM_RENO | 집 개조 + 울타리 | ✅ | `pending_renovate_fence` 있음 (단, 집 개조 없이 울타리만 하는 에러플레이 방지 확인 필요) |

**갭**: RC_GRAIN_UTIL 빵 굽기, RC_MAJOR_IMP 소시설, RC_BASIC_WISH/RC_HOUSE_RENO 후속 소시설, RC_FARM_RENO 집개조 필수 강제 / **심각도**: Major 4건

**공개 타이밍** (`game-engine.ts:127-156`): `startRound`가 `nextStage`의 `pendingRoundCards[stage-1]`에서 첫 장을 `revealedRoundCards`에 추가. **스테이지 내 순서는 create 시점에 셔플(56-64)** — 정식 룰(스테이지 내 임의 순서) 일치 ✅.

---

### 5. 자원 보충 규칙

**규정** (`05-action-spaces.md:186-206`, `04-game-rules-ko.md:34`): 누적 공간은 워커가 없는 경우만 매 라운드 보충.

**현재 구현** (`game-engine.ts:159-175`):
```ts
if (spaceState.workerId !== null) continue;
if (!accumulates || accumulates.length === 0) continue;
// 누적
```
**갭**: 없음 ✅ / **심각도**: N/A

**검증 필요**: 라운드 카드의 경우 `revealedRoundCards` 쪽은 `replenishActionSpaces` 루프에서 제외됨 — **buggy**. 누적형 라운드 카드(RC_SHEEP_MKT/WEST_QUARRY/PIG_MKT/CATTLE_MKT/EAST_QUARRY 5장)가 첫 라운드 이후 누적 안 됨 → **Critical 가능성**.

**확인**: `game-engine.ts:160-175` 은 `state.actionSpaces`만 순회. `state.revealedRoundCards`는 누락. **실제로 매 라운드 스테이지 양/소/돼지/돌 시장에 +1씩 누적이 안 됨** → 게임 밸런스 심각히 왜곡.

**심각도**: **Critical** (신규 Critical #6, 위 요약에 반영)

**제안**: `replenishActionSpaces`에서 `revealedRoundCards`도 동일 로직으로 보충.

---

### 6. 밭·씨·수확

**규정** (`03-resources-ko.md:44-53`):
- 밀 1개 손에서 → 밭에 3개(공급 +2), 채소 1→2
- 씨는 이미 밭인 칸에만, 중복 불가
- 수확 시 밭마다 1개씩

**인접성** (사용자 최근 추가 규칙, `game-engine.ts:498-505`):
- 첫 밭은 어디든, 이후는 직교 인접

**현재 구현**: `sowField` (`game-engine.ts:514-535`) — 수량/조건 모두 일치 ✅. `plowField` — 인접성 구현 ✅. `harvestFields` (`game-engine.ts:261-284`) — 밭마다 `count-1` 1개 수확 ✅.

**갭**: 없음 / **심각도**: N/A

---

### 7. 울타리·목장·외양간

**규정**:
- 울타리 세그먼트당 나무 1, 닫힌 구역만 (`03-resources-ko.md` / `01-action-spaces-ko.md:145-152`)
- 외양간 나무 2 (`01-action-spaces-ko.md:30`)
- 목장 용량: 셀수 × 2, 외양간 1개당 ×2 (`03-resources-ko.md:64-65`)
- **외양간 단독(울타리 없는 곳)** 도 **1마리 수용 가능** (`03-resources-ko.md:62`)
- 연결성: 새 울타리는 기존 울타리와 엔드포인트 공유 필수 (사용자 추가)

**현재 구현**:
- `buildFences` (`game-engine.ts:663-719`): 연결성 ✅, 닫힌 구역 검증 ✅, 비용 1/세그먼트 ✅
- `buildStable` (`game-engine.ts:874-896`): 빈 칸만, 나무 2 ✅
- `calcPastureCapacity` (`constants.ts:216-219`): `cellCount * 2 * 2^stableCount` ✅ (n개 외양간 = 2^n × 2×cells)
- **외양간 단독 1마리 규칙**: ❌ **미구현**

  `canPlaceAnimal` (`farm-engine.ts:191-203`) 은 `pastures`만 순회, `stables`를 독립 수용처로 취급 안 함. `placeAnimalInFarm` (`farm-engine.ts:234-265`) 도 `destination === 'house' | pastureIndex`만 허용 — **"목장 밖 외양간"을 선택지로 주지 않음**.

**갭**:
- 외양간 단독 1마리 미구현 / **심각도**: Major (가축 수용 전략 왜곡)
- `calcPastureCapacity` base `cellCount * 2` 는 2016 개정판 "울타리 친 셀 1칸당 **2마리**" 일치하나, **"외양간 없는 구획은 2마리" vs "외양간 없는 1칸 구획은 2마리"**는 동일 — 검증 필요 (Rules PDF 직접 확인 필요).

**제안**:
- `FarmBoard`에 `stables` 각각의 독립 수용량(최대 1) 추적 필드 추가.
- `placeAnimalInFarm` destination 에 `{ type: 'lone_stable'; index }` 추가.

---

### 8. 가축 시장 / 획득

**규정** (`01-action-spaces-ko.md:41`, `05-action-spaces.md:113`):
- V2_ANIMAL_MKT: **양+음식1 OR 멧돼지 OR 소-음식1** 택1
- V34_ANIMAL_MKT: **양+음식1 OR 멧돼지 OR 소-음식1** 택1

**현재 구현**:
- `action-spaces.ts:213, 256`: 둘 다 `pending_animal_select`만 설정 ✅
- `getAnimalFromMarket` (`game-engine.ts:899-922`): 3가지 분기 전부 구현 ✅
- `replaceAnimalAtLocation`, `cookAnimal` (방금 구현) ✅

**갭**: 후속 UI 연결만 확인하면 됨 / **심각도**: Minor-Major (UI 검증 필요)

**검증 필요**: 실제 UI에서 3 옵션(sheep/boar/cattle) 중 선택 → `getAnimalFromMarket(animalType)` 호출 흐름이 완성되어 있는지. 코드만으로는 판단 불가.

---

### 9. 집 개량 (Renovation)

**규정** (`04-game-rules-ko.md:156-164`, `03-resources-ko.md:90-97`):
- 나무집 → 흙집: 흙 × 방수 + 갈대 1
- 흙집 → 돌집: 돌 × 방수 + 갈대 1
- 일부 개조 불가, 나무 → 돌 직접 불가

**현재 구현** (`game-engine.ts:573-606`):
- 방 재질 검색해서 전체를 다음 재료로 변경 ✅
- 비용: `clay: -rooms, reed: -1` / `stone: -rooms, reed: -1` ✅
- `room_stone` 상태에서 에러 throw ✅
- **갈대 부족 검증 없음** ❌ — 자원 음수 진입 가능성 (Major)
- **각 재료 부족 검증 없음** ❌ — `addResources`는 음수 체크 X (Major)

**갭**: 비용 검증 누락 / **심각도**: Major

**제안**: `renovateHouse`에 `clay/stone/reed` 부족 시 throw 추가.

---

### 10. 방 건설

**규정** (`04-game-rules-ko.md:168-174`, `03-resources-ko.md` 없음 — 한국어판 "나무 5 + 갈대 2" 공식):
- 현재 집 재질에 맞춰 나무/흙/돌 중 하나 × 5 + 갈대 2
- **기존 방에 인접한 빈 칸에만 건설**

**현재 구현** (`game-engine.ts:830-871`):
- 인접 검증 ✅
- 재질별 비용 ✅
- 자원 부족 검증 ✅

**갭**: 없음 / **심각도**: N/A ✅

---

### 11. 가족 늘리기

**규정** (`04-game-rules-ko.md:95-96, 103, 114, 121`):
- RC_BASIC_WISH: 빈 방 필요
- RC_URGENT_WISH: 방 불필요 (스테이지 5)
- V2/V34_MODEST_WISH: 5라운드 이후 + 방 필요

**현재 구현**:
- `growFamily(state, playerId, requireRoom)` (`game-engine.ts:538-570`) ✅
- `growFamilyModest` (`game-engine.ts:968-974`): 5라운드 이상 + 방 필요 ✅
- 최대 5명 ✅
- `hasGrown` 플래그 → 신생아 1음식 계산 트리거 ✅

**갭**:
- `action-spaces.ts:222, 266` V34_MODEST_WISH / V2_MODEST_WISH effect가 `pending_family_growth` 만 설정 — `growFamilyModest` 호출 강제 아님. UI에서 틀린 함수 호출 가능 (Minor)

**제안**: 별도 `pending_family_growth_modest` 라운드페이즈 추가.

---

### 12. 직업/소시설 카드

**규정**:
- LESSONS: 첫 직업 무료, 이후 음식 1 (1-2인 기준) (`05-action-spaces.md:32`)
- EXT3_LESSONS: 음식 2 (`01-action-spaces-ko.md:50`)
- EXT4_LESSONS_A: 음식 2, 첫 2장은 1개씩 (`05-action-spaces.md:98`)
- 소시설: 대부분 무료 플레이 (카드 개별 비용)

**현재 구현**:
- `pending_play_occupation` 상태만 설정 — 비용 로직/카드 효과 전체 미구현
- `card-engine.ts` 존재하나 효과 적용 파이프라인 검증 필요
- 48장 A/B 직업 + 48장 A/B 소시설: 각 카드 `effects: []` (stub) — `cards/occupations-a.ts` 등 실제 구현 확인 필요

**갭**: 직업/소시설 카드 **효과 전체 미구현** / **심각도**: **Critical** (게임 점수·전략에 결정적)

**제안**: Phase 2 별도 작업. 우선순위 높음.

---

### 13. 주요설비 (Major Improvements) 10개

**규정** (`research/korean-rules/02-major-improvements-ko.md`):

| 설비 | 효과 | 구현 |
|------|------|------|
| 화로(흙2/3) | 빵+동물변환 | BAKE_BREAD ✅, ANYTIME `cookAnimal` ✅ |
| 화덕(흙4/5) | 빵+동물변환 | 동일 ✅ |
| 흙가마 | 곡식 1→음식 5 (1회/수확) | BAKE_BREAD 비율만 ✅, **1회 제한 미구현** ❌ (Major) |
| 돌가마 | 곡식 1→음식 4 (2회/수확) | 동일, **2회 제한 미구현** ❌ (Major) |
| 가구 제작소 | 수확 시 나무 1 → 음식 2 | `apply: state => state` (placeholder) ❌ (Major) |
| 그릇 제작소 | 수확 시 흙 1 → 음식 2 | placeholder ❌ (Major) |
| 바구니 제작소 | 수확 시 갈대 1 → 음식 3 | placeholder ❌ (Major) |
| 우물 | 5라운드 음식 1씩 배치 | placeholder, `{food: 0}` ❌ **(Critical — VP 4 설비가 무효)** |

**갭**: 10개 중 **7개 효과 미구현** (돌/흙가마 횟수 + 3 작업장 + 우물) / **심각도**: Critical+Major

**제안**: `bakeBreadForPlayer`에 설비별 `usedThisHarvest` 카운터 추가. 작업장은 `HARVEST_FIELD` 트리거를 `harvestFields`에서 각 플레이어별로 실제 호출하도록 연결. 우물은 `round+1 ~ round+5`의 `actionSpaces` (또는 공용 "미래 라운드 슬롯")에 음식 예약.

---

### 14. 수확 단계 순서

**규정** (`04-game-rules-ko.md:42-68`, `03-resources-ko.md:77-84`):
1. 밭 수확
2. 식량 공급 (가족당 2, 신생아 1, 부족 → 구걸)
3. 번식
- 빵 굽기는 ②에서 가능
- **번식 후 새끼 즉시 음식 변환 불가**

**현재 구현**:
- `runHarvest` (`game-engine.ts:254-259`): 순서 ✅
- `harvestFields` → 밭마다 -1 ✅
- `feedFamily` / `feedFamilyForPlayer` → 음식 차감 + 구걸 토큰 증가 ✅
- `breedAnimals` → ✅
- **빵 굽기 UI 타이밍**: `bakeBreadForPlayer` (`game-engine.ts:322`) 존재 — 언제든 호출 가능. 수확 ②에서만 가능하도록 강제 안 됨 (Major: 수확 외 라운드에 빵 굽기 가능 → 전략 왜곡)
- **번식→요리 금지 잠금**: ❌ `cookAnimal`은 언제든 호출 가능 (Major)

**갭**: 빵 굽기 타이밍, 번식 직후 요리 금지 / **심각도**: Major (수확 단계 룰 위반)

**제안**: `harvestPhase === 'feeding'` 범위에서만 `bakeBread` 허용. 번식 단계에서 `cookAnimal` 금지.

---

### 15. 식량 공급

**규정**: 가족 1명당 음식 2개, 신생아 1개. 1인 플레이는 성인 3, 신생아 1.

**현재 구현** (`game-engine.ts:286-319, 362-380`):
- `calcFoodNeeded`: `playerCount === 1` 분기 ✅
- 성인 × 2 + 신생아 × 1 ✅
- 부족 시 `beggingTokens += deficit` ✅
- `food = max(0, food - needed)` ✅

**갭**: 없음 / **심각도**: N/A ✅

**검증 필요**: `player.hasGrown`이 수확 시점에도 true 상태로 남아있어야 신생아 계산이 작동. `returnWorkers` (`game-engine.ts:242`)에서 `hasGrown: false` 리셋되는 시점이 **수확 전/후** 중 어디인지 검증 필요.

실제 `returnWorkers`는 라운드 종료 직전 호출 — 수확이 그 이후라면 이미 false → 신생아 계산 실패. **흐름 검증 필요** (Critical 가능성).

---

### 16. 번식

**규정** (`03-resources-ko.md:68-73`):
- 2마리 이상 + 공간 있음 → 1마리 추가
- 배치 우선순위: 같은 종 목장 → 빈 목장 → 집 안 (`research/korean-rules/03-resources-ko.md:71`)

**현재 구현** (`game-engine.ts:397-450`):
- 카운트 2 미만: return ✅
- 용량 부족: return ✅
- 1) 같은 종 여유 목장 2) 빈 목장 3) 집 안 ✅

**갭**:
- **집 안 1마리 한계**를 "같은 종이 이미 집에 있으면 스택" 으로 처리 (`:442-447`) → **룰 위반** (집 안은 최대 1마리). `placeAnimalInFarm` (`farm-engine.ts:240-241`)은 "houseTotal >= 1이면 throw" 로 올바르나, `breedAnimalType` 은 그 체크를 우회함 / **심각도**: Major
- **외양간 단독** 배치 선지 미포함 (8번과 연계)

**제안**: `breedAnimalType`도 `placeAnimalInFarm` / `hasAnimalPlacement` 경유하도록 통합.

---

### 17. 점수 계산 (12 카테고리)

**규정** (`04-game-rules-ko.md:178-195`):
- 12 카테고리 + 카드 VP + 구걸 페널티 (-3/개)
- 밭 / 목장 / 곡식 / 채소 / 양 / 멧돼지 / 소 / 빈 공간(-1/칸) / 외양간(+1/개 울타리 안) / 방(흙1, 돌2) / 가족(+3/명) / 카드

**현재 구현** (`scoring-engine.ts:24-164`):
- 각 카테고리별 함수 ✅
- `scoreBegging` ✅
- `SCORE_TABLE_FIELDS = [-1, 1, 2, 3, 4, 4]` ✅
- `SCORE_TABLE_PASTURES = [-1, 1, 2, 3, 4]` ✅
- 밀/양 점수 구간: 1~3/4~5/6~7/8+ = 1/2/3/4 ✅
- 멧돼지 구간: 1~2/3~4/5~6/7+ ✅
- **소 구간**: 현재 `1 | 2~3 | 4~5 | 6+` = 1/2/3/4 ✅ (규정 `04-game-rules-ko.md:188`의 "0/1/2~3/4~5/6+ → -1/1/2/3/4" 일치)

**갭**:
- `scorePastures`는 `board.pastures.length`로 **닫힌 구역만 세야 함** — 현재 `calculatePastures`는 BFS로 구역을 잡으나 **울타리로 완전히 닫혔는지 검증 없음** → 닫히지 않은 구역이 pasture로 점수 계산될 가능성 (Critical)
- `scoreFencedStables`: `p.hasStable` 카운트 — **울타리 친 외양간만** 점수 ✅ (구획 밖 단독 외양간은 pasture에 없으므로 자동 제외)
- **외양간 단독이 목장에 속하지 않는 경우의 점수 0 처리**: 룰상 단독 외양간은 점수 없음 — 현재 구현 일치 ✅
- 구걸 페널티 -3/개 ✅

**검증 필요**: `calculatePastures`가 경계에 울타리가 없는 오픈 셀까지 "pasture"로 취급하는지. `floodFillPasture`는 `canMove` 기반(울타리 있으면 차단) — **열린 경계는 차단 안 됨** → **룰 위반 가능**. `buildFences`에서 `isPastureFullyFenced` 검증을 하지만, 그건 새 울타리 추가 시 "새 닫힌 구역 증가" 체크일 뿐, **결과 pasture 리스트에 열린 구역이 섞일 수 있음**.

**심각도**: **Critical** (점수 계산 오류 가능)

**제안**: `calculatePastures` 말미에 `filter(p => isPastureFullyFenced(p.cells, fences))` 추가.

---

### 18. 동점 처리

**규정** (`04-game-rules-ko.md:198`): "밭 → 우리 → 곡식 → 채소 → 양 → 멧돼지 → 소 → 남은 자원"

정식 Rules PDF: **구걸 토큰 적은 순 먼저** → 이후 나머지 카테고리 많은 순.

**현재 구현** (`scoring-engine.ts:173-192`):
- 순서: 밭 → 목장 → 곡식 → 채소 → 양 → 멧돼지 → 소 → 총자원
- **구걸 토큰 비교가 첫 순위로 없음** — 한국어 나무위키 요약에는 언급 없으나 **정식 룰은 begging 먼저** (검증 필요)

**갭**: 구걸 토큰 우선 비교 누락 가능성 / **심각도**: Major (검증 필요, PDF로 확정)

**제안**: `tieBreak` 첫 comparator를 `(p) => -p.beggingTokens` 로 추가.

---

### 19. 덱 구성 & 초기 배분

**규정** (`constants.ts:181-206`, Unofficial Compendium 기반):
- A덱: 직업 24 + 소시설 24 = 48장
- B덱: 직업 23 (B096 미확인) + 소시설 24 = 47장
- A+B 기본판: 직업 47, 소시설 48

**초기 배분** (`constants.ts:224-229`): 모든 인원 `occupations: 7, improvements: 7`

**정식 룰**: 7장씩 배분 (한국어 요약 확인), 드래프트 옵션 있음 ✅

**현재 구현** (`game-engine.ts:66-68`): `getBaseDeckCards()`로 덱 불러오되 **셔플·플레이어 패로 분배 없음**. `createInitialPlayerState`에서 `hand: { occupations: [], minorImprovements: [] }` — **빈 손** (Critical, 중복 — 위 #12 Critical과 동일 항목)

**갭**: 배분 로직 전체 미구현 / **심각도**: **Critical**

**제안**: `createGameState`에서 `shuffleArray(deck).slice(i*7, i*7+7)` 각 플레이어에 분배.

---

## 추가 발견 (검증 필요)

### A. 라운드 흐름 오케스트레이션 부재
- `startRound` → `replenishActionSpaces` → `work` → `returnWorkers` → `runHarvest`(필요시) → 다음 `startRound` 순서로 순수 함수들은 있으나, **자동 orchestrator 미확인**. UI/상위 레이어에서 호출 순서 실수 가능 (Minor).

### B. `replenishActionSpaces`가 `revealedRoundCards` 미처리 ⚠️ Critical (위 5번 참조)

### C. `returnWorkers` 에서 `hasGrown: false` 리셋 타이밍 ⚠️ Critical 가능 (위 15번 참조)

### D. 농장 개조 (RC_FARM_RENO) — 집 개조 없이 울타리만 불가 강제 미구현 (Major)

### E. 3인 Lessons 비용 음식 2 로직 미구현 (Major, 5번 참조 연속)

### F. Traveling Players 효과 "이번 라운드 워커 추가"는 누적 +1음식만 구현, 워커 추가 로직 없음 (Major)

### G. 외양간 단독 수용 규칙 (위 7번) — FarmBoard 자체가 "독립 외양간 수용량" 필드를 안 가짐 (Major)

### H. 주요설비 "각 플레이어 최대 1개"는 공용보드 `ownerId: null` 체크로 충분 ✅

### I. 우물 (Well) 효과: 5라운드 음식 배치 미구현 (Critical, 13번 참조)

### J. 카드 효과 수확 훅 (`HARVEST_FIELD`, `HARVEST_FEED`, `HARVEST_BREED`) 의 실제 호출 지점 부재 — `runHarvest`가 단일 파이프라인만 실행 (Major)

---

## 우선순위 작업 목록

### 🔴 Critical (즉시 수정)

1. **라운드 카드 누적 자원 보충 버그** — `replenishActionSpaces`에서 `revealedRoundCards` 순회 추가 (게임 진행 가능하지만 양/돼지/소/돌 시장이 **첫 라운드 이후 +1씩 증가 안 함** → 게임 불가능 수준 왜곡). ⏱ 10분
2. **목장 닫힘 검증**: `calculatePastures` 결과에 `isPastureFullyFenced` 필터 추가. 점수 계산 오류 차단. ⏱ 15분
3. **우물 (MAJ_WELL) 효과**: 건설 후 5라운드 음식 배치 로직 구현 (`IMMEDIATE` 트리거에서 `round+1..+5` 공간에 음식 예약). ⏱ 30분
4. **`returnWorkers`의 `hasGrown` 리셋 타이밍** — 수확 `feedFamily`가 `hasGrown` 참조 **전에** 리셋되지 않는지 오케스트레이터에서 검증 + 테스트 추가. ⏱ 20분
5. **카드 파이프라인 전체**: 덱 셔플/배분, 카드 효과 `apply` 실제 호출, LESSONS/Lessons 계열 비용 로직. (Phase 2 전체 대상) ⏱ 수일

### 🟠 Major (스코어/승패 영향)

6. 외양간 단독 1마리 수용 — FarmBoard에 독립 stable 카운터 + `placeAnimalInFarm` 확장. ⏱ 1시간
7. `breedAnimalType`의 집 안 1마리 초과 허용 버그 — `placeAnimalInFarm` 경유로 통합. ⏱ 15분
8. 흙/돌 가마 "수확당 N회" 제한 — `majorImprovements` 상태에 `usedThisHarvest` 추가. ⏱ 30분
9. 작업장 3종 (가구/그릇/바구니) `HARVEST_FIELD` 효과 실제 구현 + `runHarvest`에서 훅 호출. ⏱ 1시간
10. 2인 타일 "1개 선택 → 나머지 봉쇄" 규칙. ⏱ 30분
11. `renovateHouse` 비용 부족 검증 추가 (clay/stone/reed). ⏱ 10분
12. `bakeBreadForPlayer` 수확 feeding 단계 외 호출 차단. ⏱ 15분
13. `cookAnimal` 번식 단계에서 호출 차단. ⏱ 10분
14. RC_GRAIN_UTIL 빵 굽기 분기 UI + 로직. ⏱ 30분
15. RC_BASIC_WISH / RC_HOUSE_RENO 후속 소시설 플레이 슬롯. ⏱ Phase 2
16. RC_FARM_RENO 집 개조 필수 강제 (울타리만 불가). ⏱ 15분
17. `tieBreak`에 `beggingTokens` 우선 비교 추가 (PDF 확정 후). ⏱ 5분
18. Traveling Players 워커 추가 효과. ⏱ 30분

### 🟡 Minor (UI/문구)

19. `constants.ts:15` "방1 + 빈칸1" 주석 삭제 (실제는 방 2칸).
20. FARMLAND / FARM_EXPANSION `pending_*` 상태 전이 후 UI 완전성 확인.
21. V34_MODEST_WISH / V2_MODEST_WISH effect에 전용 `pending_family_growth_modest` 신설.
22. 라운드 카드 누적 보충 로깅 추가 (디버깅용).
23. i18n 용어 정합 (흙 vs 점토) 전 소스 통일.
24. 동물 배치 UI에서 "요리(cookAnimal)"와 "교체배치(replaceAnimalAtLocation)" 구분 확인.
25. 주요 설비 `ANYTIME` 효과의 `apply`가 identity 함수 (`state => state`) — 실효성 없음, 문서화 또는 삭제.
26. 주요설비 점수/비용 표가 `research/korean-rules/02-major-improvements-ko.md`와 일치 — OK.
27. 덱 B096 확인 필요 (B덱 23장, 공식 24장 중 1장 누락).
28. `design/05-action-spaces.md` 문서의 "Traveling Players 정확한 효과"/"Farm Expansion 외양간 비용"/"2인 타일 누적 타이밍" 등 미확인 항목 정식 PDF로 재검증.

---

## 다음 단계 제안

1. 위 Critical 1, 2 를 즉시 패치 (합쳐 30분 이내).
2. Critical 3, 4 는 테스트 포함 1~2시간.
3. Major 6~9 는 외양간/수확 훅 리팩토링과 함께 반일 작업.
4. Critical 5 (카드 파이프라인)는 별도 Phase 2 작업 — 본 갭 분석의 범위 밖으로 분리.
5. PDF 규정 재검증 대상 (표 "검증 필요" 표시) 은 사용자가 PDF 인용 요청 시 개별 재분석.
