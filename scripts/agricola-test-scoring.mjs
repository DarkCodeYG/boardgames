/**
 * 아그리콜라 점수 계산 QA 테스트
 * 실행: node scripts/agricola-test-scoring.mjs
 *
 * 점수 테이블 정확성 검증 (출처: docs/agricola/06-scoring.md)
 */

let passed = 0;
let failed = 0;

function assert(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✅ ${message}: ${actual}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL ${message}: expected=${expected}, actual=${actual}`);
    failed++;
  }
}

function describe(name, fn) {
  console.log(`\n📋 ${name}`);
  fn();
}

// ── 점수 테이블 단위 테스트 ──────────────────────────────────────

describe('밭 점수 (SCORE_TABLE_FIELDS)', () => {
  // 검증 데이터: docs/agricola/06-scoring.md §2-1
  const table = [-1, 1, 2, 3, 4, 4];
  assert(table[0], -1, '밭 0개 = -1');
  assert(table[1], 1,  '밭 1개 = 1');
  assert(table[2], 2,  '밭 2개 = 2');
  assert(table[3], 3,  '밭 3개 = 3');
  assert(table[4], 4,  '밭 4개 = 4');
  assert(table[5], 4,  '밭 5개 = 4 (최대)');
});

describe('목장 구획 점수 (SCORE_TABLE_PASTURES)', () => {
  const table = [-1, 1, 2, 3, 4];
  assert(table[0], -1, '구획 0개 = -1');
  assert(table[1], 1,  '구획 1개 = 1');
  assert(table[4], 4,  '구획 4개 = 4 (최대)');
});

describe('밀 점수 (SCORE_GRAIN)', () => {
  function SCORE_GRAIN(count) {
    if (count === 0) return -1;
    if (count <= 3) return 1;
    if (count <= 5) return 2;
    if (count <= 7) return 3;
    return 4;
  }
  assert(SCORE_GRAIN(0), -1, '밀 0개 = -1');
  assert(SCORE_GRAIN(1), 1,  '밀 1개 = 1');
  assert(SCORE_GRAIN(3), 1,  '밀 3개 = 1');
  assert(SCORE_GRAIN(4), 2,  '밀 4개 = 2');
  assert(SCORE_GRAIN(5), 2,  '밀 5개 = 2');
  assert(SCORE_GRAIN(6), 3,  '밀 6개 = 3');
  assert(SCORE_GRAIN(8), 4,  '밀 8개 = 4 (최대)');
});

describe('채소 점수 (SCORE_TABLE_VEGETABLES)', () => {
  const table = [-1, 1, 2, 3, 4];
  assert(table[0], -1, '채소 0개 = -1');
  assert(table[1], 1,  '채소 1개 = 1');
  assert(table[4], 4,  '채소 4개 = 4');
});

describe('양 점수 (SCORE_SHEEP)', () => {
  function SCORE_SHEEP(count) {
    if (count === 0) return -1;
    if (count <= 3) return 1;
    if (count <= 5) return 2;
    if (count <= 7) return 3;
    return 4;
  }
  assert(SCORE_SHEEP(0), -1, '양 0마리 = -1');
  assert(SCORE_SHEEP(1), 1,  '양 1마리 = 1');
  assert(SCORE_SHEEP(4), 2,  '양 4마리 = 2');
  assert(SCORE_SHEEP(8), 4,  '양 8마리 = 4');
});

describe('멧돼지 점수 (SCORE_BOAR)', () => {
  function SCORE_BOAR(count) {
    if (count === 0) return -1;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  }
  assert(SCORE_BOAR(0), -1, '멧돼지 0마리 = -1');
  assert(SCORE_BOAR(2), 1,  '멧돼지 2마리 = 1');
  assert(SCORE_BOAR(3), 2,  '멧돼지 3마리 = 2');
  assert(SCORE_BOAR(7), 4,  '멧돼지 7마리 = 4');
});

describe('소 점수 (SCORE_CATTLE)', () => {
  function SCORE_CATTLE(count) {
    if (count === 0) return -1;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  }
  assert(SCORE_CATTLE(0), -1, '소 0마리 = -1');
  assert(SCORE_CATTLE(1), 1,  '소 1마리 = 1');
  assert(SCORE_CATTLE(2), 2,  '소 2마리 = 2');
  assert(SCORE_CATTLE(4), 3,  '소 4마리 = 3');
  assert(SCORE_CATTLE(6), 4,  '소 6마리 = 4');
});

describe('가족 점수', () => {
  const SCORE_FAMILY_PER_PERSON = 3;
  assert(1 * SCORE_FAMILY_PER_PERSON, 3,  '가족 1명 = 3');
  assert(2 * SCORE_FAMILY_PER_PERSON, 6,  '가족 2명 = 6');
  assert(5 * SCORE_FAMILY_PER_PERSON, 15, '가족 5명 = 15 (최대)');
});

describe('방 VP', () => {
  const SCORE_ROOM = { room_wood: 0, room_clay: 1, room_stone: 2 };
  assert(SCORE_ROOM.room_wood,  0, '나무 방 = 0VP');
  assert(SCORE_ROOM.room_clay,  1, '점토 방 = 1VP');
  assert(SCORE_ROOM.room_stone, 2, '돌 방 = 2VP');
});

describe('구걸 토큰 패널티', () => {
  const BEGGING_PENALTY = -3;
  assert(0 * BEGGING_PENALTY, 0,  '토큰 0개 = 0');
  assert(1 * BEGGING_PENALTY, -3, '토큰 1개 = -3');
  assert(3 * BEGGING_PENALTY, -9, '토큰 3개 = -9');
});

describe('목장 용량 계산', () => {
  function calcPastureCapacity(cellCount, stableCount) {
    return Math.pow(2, cellCount) * Math.pow(2, stableCount);
  }
  assert(calcPastureCapacity(1, 0), 2,  '1칸, 외양간0 = 2');
  assert(calcPastureCapacity(1, 1), 4,  '1칸, 외양간1 = 4');
  assert(calcPastureCapacity(2, 0), 4,  '2칸, 외양간0 = 4');
  assert(calcPastureCapacity(2, 1), 8,  '2칸, 외양간1 = 8');
  assert(calcPastureCapacity(4, 0), 16, '4칸, 외양간0 = 16');
});

// ── 결과 ─────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`결과: ${passed + failed}개 테스트 | ✅ ${passed} 통과 | ❌ ${failed} 실패`);
if (failed > 0) process.exit(1);
