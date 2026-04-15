# 아그리콜라 개발 거버넌스 및 페르소나

> 이 문서는 Claude Agent 기반 협업 개발 워크플로우를 정의합니다.

---

## 1. 개발 페르소나 (역할 정의)

아그리콜라 개발은 한 명의 AI(Claude)가 상황에 따라 다른 역할을 수행하는 **멀티-페르소나 방식**으로 진행합니다.

### 🏛️ Architect (아키텍트)
**책임:** 설계 결정, 데이터 구조 정의, 인터페이스 설계  
**활성화 조건:** 새 시스템/모듈 시작 전, 설계 변경 필요 시  
**산출물:** types.ts, 설계 문서, 데이터 구조 다이어그램  
**판단 기준:** "이 구조가 카드 효과 엔진의 모든 케이스를 처리할 수 있는가?"

```
입력: 기능 요구사항
출력: 타입 정의 + 구조 설명 + 구현 지침
```

### ⚙️ Engine Developer (엔진 개발자)
**책임:** game-engine.ts 순수 함수 구현, 게임 로직  
**활성화 조건:** 아키텍트가 타입 정의 완료 후  
**원칙:** 순수 함수만 작성 (no side effects), Firebase 직접 접근 금지  
**테스트 기준:** 같은 입력 → 항상 같은 출력 (결정론적)

```
입력: 이전 GameState + Action
출력: 새 GameState (불변성 유지)
```

### 🎨 UI Developer (UI 개발자)
**책임:** React 컴포넌트, Tailwind 스타일링, 애니메이션  
**활성화 조건:** 엔진 함수가 정의된 후  
**원칙:** 
- 색상은 colors.ts에서만 import
- 소리는 sound.ts에서만 사용
- 모달은 Modal.tsx 컴포넌트 사용
- 이모지에 aria-hidden 필수

### 🗄️ Firebase Engineer (파이어베이스 엔지니어)
**책임:** firebase-room.ts, DB 스키마, 실시간 동기화  
**활성화 조건:** 엔진 로직 완성 후 멀티플레이어 구현 시  
**원칙:**
- 모든 쓰기는 트랜잭션 기반
- 경로 구조: `agricola/{roomCode}/...`
- 낙관적 업데이트 패턴 적용

### 🔍 QA Engineer (QA 엔지니어)
**책임:** 게임 상태 검증, 엣지 케이스 발견, 빌드 확인  
**활성화 조건:** 각 기능 구현 완료 직후 자동 실행  
**체크리스트:**
- [ ] TypeScript 빌드 통과 (`npm run build`)
- [ ] 게임 엔진 순수 함수 검증 (같은 입력 → 같은 출력)
- [ ] 카드 효과 트리거 시점 정확성
- [ ] 울타리/목장 계산 정확성
- [ ] 수확 순서(밭→식량→번식) 준수

### 📝 Documentarian (문서 담당)
**책임:** 설계 문서 갱신, 카드 데이터베이스 유지  
**활성화 조건:** 구현이 설계를 벗어날 때, Phase 완료 시  
**산출물:** docs/agricola/*.md 갱신, CARD_DATABASE.md 갱신

---

## 2. 개발 거버넌스

### 2-1. 황금 규칙 (Golden Rules)

1. **설계 문서 선행:** 코드 작성 전 반드시 해당 Phase의 설계 완료
2. **카드 데이터베이스 원천:** `docs/agricola/02-card-database.md`가 구현의 유일한 기준
3. **순수 함수 우선:** game-engine.ts는 순수 함수만. 부작용은 firebase-room.ts에만
4. **타입 안전성:** `any` 사용 절대 금지. 새 타입은 types.ts에 먼저 정의
5. **빌드 통과 필수:** 각 기능 완료 시 `npm run build` 통과 확인 후 다음으로

### 2-2. 개발 단계 (Phases)

```
Phase 0: 기반 설계
  → types.ts 완성
  → game-engine.ts 스켈레톤
  → 농장 보드 컴포넌트 (상태 없는 정적 렌더링)
  → 빌드 통과 확인

Phase 1: 핵심 엔진 (카드 없는 완전한 게임)
  → 행동 공간 시스템 (영구 14개 + 라운드 카드)
  → 워커 배치/회수
  → 자원 수집 행동
  → 건설 행동 (방, 울타리, 외양간)
  → 밭 행동 (갈기, 씨뿌리기)
  → 가족 늘리기 행동
  → 수확 로직 (밭→식량→번식)
  → 점수 계산
  → 1-4인 로컬 게임 플레이 가능

Phase 2: 카드 시스템
  → CardEffect 엔진 구현
  → E덱 카드 구현 (가장 단순한 덱 먼저)
  → I덱, K덱 순서로 확장
  → 카드 상호작용 테스트

Phase 3: 멀티플레이어
  → Firebase 스키마 설계
  → 실시간 동기화
  → 워커 배치 경쟁 처리
  → 수확 동시 처리

Phase 4: 완성도
  → 한/영/중 i18n
  → 튜토리얼 모드
  → 모바일 최적화
  → 오디오 효과
```

### 2-3. 코드 품질 기준

```typescript
// ✅ 올바른 게임 엔진 함수
function harvestField(state: GameState, playerId: PlayerId): GameState {
  return {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? applyFieldHarvest(p) : p
    )
  };
}

// ❌ 금지: 부작용 있는 엔진 함수
function harvestField(state: GameState, playerId: PlayerId): void {
  firebase.update(...);  // 금지!
  state.players[0].food = 5;  // 직접 변경 금지!
}
```

### 2-4. 커밋 기준

- 각 Phase 시작 전 설계 문서 커밋
- 빌드 통과 후에만 기능 커밋
- 커밋 전 반드시 사용자 확인 (CLAUDE.md 규칙 준수)
- Phase 완료 시 설계 문서 갱신 커밋

### 2-5. 의사결정 기준

| 상황 | 처리 |
|------|------|
| 카드 효과 해석 모호 | BGG 룰 명확화 포럼 + Unofficial Compendium v4.1 참조 |
| UI 레이아웃 선택 | 모바일(폰) 우선, 아이패드 최적화 |
| 성능 vs 정확성 | 정확성 우선 |
| 새 Phase 시작 | 사용자와 합의 후 진행 |

---

## 3. 카드 데이터베이스 거버넌스

### 데이터 소스 우선순위
1. **공식 룰북 PDF** (최우선)
2. **Unofficial Compendium v4.1** (Scribd/alavigne.net)
3. **BGG Forum** 공식 디자이너 답변
4. **Asmodee Digital** 구현 관찰

### 카드 레코드 형식
```typescript
interface CardRecord {
  id: string;           // "OCC-E-001" (직업-덱-번호)
  type: 'occupation' | 'minor_improvement';
  deck: 'E' | 'I' | 'K';
  nameKo: string;
  nameEn: string;
  cost?: ResourceCost;
  effect: CardEffect;
  victoryPoints?: number;
  clarifications?: string[];  // BGG 공식 루링
}
```

### 변경 관리
- 카드 텍스트 변경 시: 설계 문서 먼저 수정 → 구현 반영
- 카드 추가 시: 데이터베이스에 먼저 등록 → 효과 구현

---

## 4. 테스트 전략

### 게임 엔진 테스트 (최우선)
```
시나리오 1: 기본 게임 진행
  - 2인 게임, E덱만 사용
  - 14라운드 완주
  - 점수 계산 검증

시나리오 2: 수확 엣지 케이스
  - 식량 부족 → 구걸 토큰 확인
  - 동물 0마리 → 번식 없음
  - 동물 2마리 이상 → 1마리 추가

시나리오 3: 울타리/목장
  - 울타리 배치 → 목장 자동 계산
  - 목장 용량 초과 방지
  - 외양간 용량 보너스

시나리오 4: 카드 효과
  - E덱 각 카드 트리거 시점
  - 카드 조합 상호작용
```

### UI 테스트
- 농장 보드: 각 셀 타입 시각적 구분 확인
- 울타리: 선분 렌더링, 목장 영역 하이라이트
- 모바일(폰): 터치 인터랙션, 스크롤
- 아이패드: 전체 보드 가시성

---

## 5. 문서 구조

```
docs/agricola/
├── 00-feasibility.md        ✅ 타당성 분석 (이 문서 이전 작성)
├── 01-personas-governance.md ✅ 거버넌스 (이 문서)
├── 02-card-database.md      📋 카드 데이터베이스 (Phase 2 전 완성)
├── 03-architecture.md       📋 기술 아키텍처 (Phase 0 시작 전 완성)
├── 04-farm-board-design.md  📋 농장 보드 설계 (Phase 0 시작 전 완성)
├── 05-action-spaces.md      📋 행동 공간 전체 목록 (Phase 1 전 완성)
├── 06-scoring.md            📋 점수 계산 상세 (Phase 1 전 완성)
├── 07-agent-mode.md         ✅ 에이전트 자율 개발 모드 설계
└── CHANGELOG.md             📋 변경 이력
```

**📋 = 해당 Phase 시작 전 완성 필요**  
**✅ = 완성**
