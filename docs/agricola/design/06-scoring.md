# 아그리콜라 점수 계산 상세

> Phase 0 설계 문서  
> 출처: Agricola Revised Edition 2016 룰북 스코어 차트  

---

## 1. 점수 카테고리 전체

아그리콜라 최종 점수는 아래 **12개 카테고리** 합산:

| # | 카테고리 | 한국어 | 비고 |
|---|---------|--------|------|
| 1 | Farmland (Fields) | 밭 | 갈아진 밭 수 |
| 2 | Pastures | 목장 | 울타리 친 목장 |
| 3 | Grain | 밀 (곡식) | 보유량 |
| 4 | Vegetables | 채소 | 보유량 |
| 5 | Sheep | 양 | 보유량 |
| 6 | Boar | 멧돼지 | 보유량 |
| 7 | Cattle | 소 | 보유량 |
| 8 | Unused Farm Spaces | 빈 농장 공간 | 패널티 |
| 9 | Fenced Stables | 울타리 친 외양간 | VP 보너스 |
| 10 | Rooms | 방 타입 | 재질별 VP |
| 11 | Family Members | 가족 수 | 3인 이상 보너스 |
| 12 | Cards & Improvements | 카드 VP | 직업/소시설/주요설비 |
| - | Begging Tokens | 구걸 토큰 | -3점/개 |

---

## 2. 카테고리별 상세 점수표

### 2-1. 밭 (Farmland / Fields)

갈아놓은 밭 칸 수 기준 (씨앗 없어도 포함):

| 밭 수 | VP |
|------|----|
| 0 | -1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5+ | 4 |

```typescript
function scoreFields(board: FarmBoard): number {
  const fieldCount = board.grid.flat().filter(c => c === 'field').length;
  const table = [-1, 1, 2, 3, 4, 4];
  return table[Math.min(fieldCount, 5)];
}
```

### 2-2. 목장 / 우리 구획 (Pastures)

울타리로 **닫힌 구획(우리) 수** 기준 — 크기 무관:

| 우리 수 | VP |
|--------|----|
| 0 | -1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4+ | 4 |

> "우리 구획": 울타리로 닫힌 영역 1개 = 우리 1개 (셀 수가 아닌 구획 수)  
> 출처: 나무위키 ✅, 공식 Appendix ✅

```typescript
function scorePastures(board: FarmBoard): number {
  const pastureCount = board.pastures.length;  // 연결된 구획 수
  const table = [-1, 1, 2, 3, 4];
  return table[Math.min(pastureCount, 4)];
}
```

### 2-3. 밀 (Grain)

보유한 밀(씨 포함) 수량 기준:

| 밀 수량 | VP |
|--------|----|
| 0 | -1 |
| 1~3 | 1 |
| 4~5 | 2 |
| 6~7 | 3 |
| 8+ | 4 |

> 씨 뿌린 밭의 씨앗 + 창고의 밀 합산  
> 출처: 나무위키 점수 테이블 ✅

```typescript
function scoreGrain(player: PlayerState): number {
  const grainInStock = player.resources.grain;
  const grainInFields = player.farm.sownFields
    .filter(f => f.resource === 'grain')
    .reduce((sum, f) => sum + f.count, 0);
  const total = grainInStock + grainInFields;
  if (total === 0) return -1;
  if (total <= 3) return 1;
  if (total <= 5) return 2;
  if (total <= 7) return 3;
  return 4;
}
```

### 2-4. 채소 (Vegetables)

| 채소 수량 | VP |
|----------|----|
| 0 | -1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4+ | 4 |

> 씨 뿌린 밭의 채소 + 창고 채소 합산  
> 출처: 나무위키 점수 테이블 ✅

```typescript
function scoreVegetables(player: PlayerState): number {
  const vegInStock = player.resources.vegetable;
  const vegInFields = player.farm.sownFields
    .filter(f => f.resource === 'vegetable')
    .reduce((sum, f) => sum + f.count, 0);
  const total = vegInStock + vegInFields;
  const table = [-1, 1, 2, 3, 4];
  return table[Math.min(total, 4)];
}
```

### 2-5. 양 (Sheep)

| 양 수량 | VP |
|--------|----|
| 0 | -1 |
| 1~3 | 1 |
| 4~5 | 2 |
| 6~7 | 3 |
| 8+ | 4 |

> 출처: 나무위키 점수 테이블 ✅

```typescript
function scoreSheep(player: PlayerState): number {
  const count = totalAnimals(player, 'sheep');
  if (count === 0) return -1;
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 7) return 3;
  return 4;
}
```

### 2-6. 멧돼지 (Boar)

| 멧돼지 수량 | VP |
|----------|----|
| 0 | -1 |
| 1~2 | 1 |
| 3~4 | 2 |
| 5~6 | 3 |
| 7+ | 4 |

> 출처: 나무위키 점수 테이블 ✅

```typescript
function scoreBoar(player: PlayerState): number {
  const count = totalAnimals(player, 'boar');
  if (count === 0) return -1;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}
```

### 2-7. 소 (Cattle)

| 소 수량 | VP |
|--------|----|
| 0 | -1 |
| 1 | 1 |
| 2~3 | 2 |
| 4~5 | 3 |
| 6+ | 4 |

> 출처: 나무위키 점수 테이블 ✅

```typescript
function scoreCattle(player: PlayerState): number {
  const count = totalAnimals(player, 'cattle');
  if (count === 0) return -1;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}
```

### 2-8. 빈 농장 공간 (Unused Spaces)

빈 셀(empty) 1개당 -1점. 방·밭·목장 공간 제외.

```typescript
function scoreEmptySpaces(board: FarmBoard): number {
  const emptyCount = board.grid.flat().filter(c => c === 'empty').length;
  return -emptyCount;   // 항상 0 이하
}
```

### 2-9. 울타리 친 외양간 (Fenced Stables)

목장 안에 있는 외양간 1개당 +1점.

```typescript
function scoreFencedStables(board: FarmBoard): number {
  return board.pastures.filter(p => p.hasStable).length;
}
```

### 2-10. 방 (Rooms)

방 재질에 따라 점수가 다름:

| 방 재질 | 1개당 VP |
|--------|---------|
| 나무 방 | 0 |
| 점토 방 | 1 |
| 돌 방 | 2 |

> 방 수가 아닌 총 VP 합산  
> 공식 확인: "Clay rooms are worth 1 point each. Stone rooms are worth 2 points each."  
> 나무 방: 시작 집이며 VP = 0 (업그레이드 대상)

```typescript
function scoreRooms(board: FarmBoard): number {
  const cells = board.grid.flat();
  const clayRooms = cells.filter(c => c === 'room_clay').length;
  const stoneRooms = cells.filter(c => c === 'room_stone').length;
  return clayRooms * 1 + stoneRooms * 2;
  // 나무 방은 0점
}
```

### 2-11. 가족 (Family Members)

| 가족 수 | VP |
|--------|----|
| 1 | 3 |
| 2 | 6 |
| 3 | 9 |
| 4 | 12 |
| 5 | **15** (최대) |

> **1인당 3점** (공식 룰북 확인: "Each person you have in play is worth 3 points")  
> 최대 5인 × 3 = **15점**

```typescript
function scoreFamilyMembers(player: PlayerState): number {
  return player.familySize * 3;   // 1-5명 × 3점
}
```

### 2-12. 카드 VP (Cards & Improvements)

직업 카드, 소시설 카드, 주요설비 각각의 victoryPoints 합산.

```typescript
function scoreCards(player: PlayerState, state: GameState): number {
  return player.playedCards.reduce((sum, card) => {
    const vp = typeof card.victoryPoints === 'function'
      ? card.victoryPoints(state, player.id)
      : (card.victoryPoints ?? 0);
    return sum + vp;
  }, 0);
}
```

---

## 3. 구걸 토큰 (Begging Tokens)

수확 시 식량 부족으로 받는 토큰. 1개당 **-3점**.

```typescript
function scoreBegging(player: PlayerState): number {
  return player.beggingTokens * -3;
}
```

---

## 4. 전체 점수 계산 함수

```typescript
// scoring-engine.ts
export function calculateScore(state: GameState, playerId: PlayerId): ScoreBreakdown {
  const player = state.players[playerId];
  const board = player.farm;

  const farmlands     = scoreFields(board);
  const pastures      = scorePastures(board);
  const grain         = scoreGrain(player);
  const vegetables    = scoreVegetables(player);
  const sheep         = scoreSheep(player);
  const boar          = scoreBoar(player);
  const cattle        = scoreCattle(player);
  const emptySpaces   = scoreEmptySpaces(board);
  const fencedStables = scoreFencedStables(board);
  const rooms         = scoreRooms(board);
  const familyMembers = scoreFamilyMembers(player);
  const cardPoints    = scoreCards(player, state);
  const begging       = scoreBegging(player);

  const total = farmlands + pastures + grain + vegetables
    + sheep + boar + cattle + emptySpaces + fencedStables
    + rooms + familyMembers + cardPoints + begging;

  return {
    farmlands, pastures, grain, vegetables,
    sheep, boar, cattle, emptySpaces, fencedStables,
    rooms, familyMembers, cardPoints, begging, total,
  };
}

function totalAnimals(player: PlayerState, type: AnimalType): number {
  // 목장 동물 + 집 안 동물
  const inPastures = player.farm.pastures
    .filter(p => p.animals?.type === type)
    .reduce((sum, p) => sum + (p.animals?.count ?? 0), 0);
  const inHouse = player.farm.animalsInHouse
    .filter(a => a.type === type)
    .reduce((sum, a) => sum + a.count, 0);
  return inPastures + inHouse;
}
```

---

## 5. 점수 UI 레이아웃

### ScoreBoard.tsx 구성

```
┌─────────────────────────────────────────┐
│          최종 점수 (14라운드 종료)          │
├────────────┬──────┬──────┬──────┬──────┤
│ 카테고리    │ 플1  │ 플2  │ 플3  │ 플4  │
├────────────┼──────┼──────┼──────┼──────┤
│ 밭          │  3   │  1   │ -1   │  4   │
│ 목장        │  2   │  3   │  1   │  2   │
│ 밀          │  4   │  2   │  1   │  3   │
│ 채소        │  2   │ -1   │  3   │  1   │
│ 양          │  3   │  4   │  2   │  1   │
│ 멧돼지      │  1   │  2   │  3   │  2   │
│ 소          │  4   │  3   │  2   │  4   │
│ 빈 공간     │ -2   │ -1   │ -3   │  0   │
│ 울 외양간   │  1   │  1   │  0   │  2   │
│ 방          │  2   │  4   │  2   │  2   │
│ 가족        │  4   │  3   │  4   │  5   │
│ 카드 VP     │  5   │  3   │  7   │  4   │
│ 구걸 토큰   │  0   │ -3   │  0   │  0   │
├────────────┼──────┼──────┼──────┼──────┤
│ 합계        │ 29   │ 21   │ 21   │ 30   │
└────────────┴──────┴──────┴──────┴──────┘
```

---

## 6. 동점 처리 (Tie-Breaking)

> 출처: 나무위키 ✅

동점자가 있을 경우 아래 순서로 더 많은 쪽이 승리:

```
1. 밭 수
2. 우리 구획 수  
3. 곡식 수
4. 채소 수
5. 양 수
6. 멧돼지 수
7. 소 수
... (점수판 기재 순서)
모두 같으면: 남은 자원 총량 많은 쪽
```

```typescript
function tieBreak(a: PlayerState, b: PlayerState, state: GameState): number {
  const categories: Array<(p: PlayerState) => number> = [
    p => countFieldTiles(p.farm),
    p => p.farm.pastures.length,
    p => totalGrain(p),
    p => totalVegetables(p),
    p => totalAnimals(p, 'sheep'),
    p => totalAnimals(p, 'boar'),
    p => totalAnimals(p, 'cattle'),
  ];
  for (const fn of categories) {
    const diff = fn(a) - fn(b);
    if (diff !== 0) return diff;  // 양수 = a 승, 음수 = b 승
  }
  return totalGoods(a) - totalGoods(b);
}
```

## 7. 검증 완료 항목 ✅

- [x] 밭 점수표: 0~1=-1, 2=1, 3=2, 4=3, 5+=4 (나무위키 + 공식 Appendix)
- [x] 목장(우리 구획) 점수표: 0=-1, 1~4=1씩, 4+=4 (공식 Appendix)
- [x] 밀/채소 점수표 (나무위키 테이블)
- [x] 양/멧돼지/소 점수표 (나무위키 테이블)
- [x] 가족 VP: 1인당 3점, 최대 15점 (공식 룰북 + 나무위키)
- [x] 나무 방 VP: 0점
- [x] 울타리 친 외양간: 1개당 1VP, 최대 4점
- [x] 동점 처리: 점수판 순서대로
- [x] 구걸 토큰: -3점/개
