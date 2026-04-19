# 아그리콜라 에이전트 작업 매뉴얼

> 에이전트 모드 작업 시 따라야 할 표준 절차.
> 기반 문서: `07-agent-mode.md` (팀 구성), `PHASE-B-PLAN.md` (현 Phase), `CYCLELOG.md` (진행 상황), `POLICY-QUEUE.md` (결정 대기)

---

## 1. 세션 시작 체크리스트

1. `PHASE-B-PLAN.md` 읽기 — 목표·단계 파악
2. `CYCLELOG.md` 맨 위 섹션 확인 — 현재 어느 사이클인지, 산출물 상태
3. `POLICY-QUEUE.md` 의 🟡 항목 확인 — 차단 이슈 있는지
4. `BACKLOG.md` 최근 3 세션 훑기 — 직전 결정·수정 이해
5. `git status` + `git log --oneline -10` — 작업 상태 동기화

---

## 2. 사이클 실행 루프

```
┌─────────────────────────────────────────────────────────┐
│ 1. CYCLELOG.md 에 새 Cycle 섹션 추가 (상단)             │
│    - 목표, 산출물 예정, 결정 사항 공란                   │
│                                                         │
│ 2. 구현 작업                                             │
│    - 에이전트 활용: Researcher, Code, QA, Review         │
│    - 비크리티컬은 자율 진행, 결정은 BACKLOG.md 기록      │
│    - 크리티컬(DB 스키마, 삭제, 외부 서비스, 커밋/푸시)은 │
│      사용자 확인 필요                                    │
│                                                         │
│ 3. 검증 파이프라인                                       │
│    - npx tsc --noEmit                                  │
│    - npm run build                                     │
│    - node scripts/agricola-test-*.mjs (해당 시)        │
│    - 로컬 dev 서버 수동 검증 (온라인 플로우 필수)      │
│                                                         │
│ 4. 코드 리뷰 에이전트 자동 실행 → Critical/Major 수정   │
│                                                         │
│ 5. CYCLELOG.md 해당 Cycle 섹션 완료 표시                │
│    - 완료 시각, 실제 산출물, 검증 결과, 다음 Cycle 참조  │
│                                                         │
│ 6. BACKLOG.md 에 이 세션 작업 요약 추가                 │
│                                                         │
│ 7. 사용자에게 "커밋+푸시 할까요?" 확인 요청              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 문서 사용 규칙

| 문서 | 책임 | 업데이트 시점 | 권한 |
|------|------|--------------|------|
| `PHASE-B-PLAN.md` | Architect | Phase 변경 시 | Architect 만 |
| `CYCLELOG.md` | Architect | 각 사이클 시작/종료 | Architect, Debug |
| `POLICY-QUEUE.md` | Architect | 결정 필요 시 추가, 확정 시 아카이브 | Architect |
| `BACKLOG.md` | All | 자율 결정 사항 기록 | 모든 에이전트 |
| `PROGRESS.md` | Architect | Phase 완료 시 | Architect |
| `RULE-ANALYSIS.md` | Researcher | 룰 갭 발견 시 | Researcher |
| `QA.md` | QA | 버그/이슈 발견 시 | QA, Debug |
| `REVIEW.md` | Review | 코드 리뷰 후 | Review |
| `STATUS.md` | Architect | 일일 / 주간 상태 | Architect |

---

## 4. 에이전트 호출 가이드 (Agent tool)

### 4.1 Researcher — 룰·번역 검증
```
subagent_type: general-purpose
prompt:
  "다음 질문에 대해 /Users/inhwankim/git/boardgames/docs/agricola/ 내의
   규정집(PDF 포함)과 korean-rules/ 를 탐색하여 답변하라.
   질문: <구체적 질문>
   답변 형식: {rule_text, source_file:line, 현재 구현 차이, 제안}"
```

### 4.2 Code Agent — 구현
```
(본 세션에서 직접 실행. 복잡 병렬 작업은 Agent tool 로 분산)
```

### 4.3 QA Agent — 검증
```
검증 순서:
1. npx tsc --noEmit
2. npm run build
3. scripts/ 하위 테스트 스크립트
4. 수동 브라우저 테스트 (localhost:5173)
```

### 4.4 Review Agent — 코드 리뷰
```
subagent_type: general-purpose
prompt:
  "파일 경로 목록 + 변경 의도 + 확인 포인트 를 제공하고
   Critical/Major 만 보고받는다.
   응답 길이 500 단어 이내."
```

---

## 5. 크리티컬 경계 (사용자 확인 필수)

- Firebase 보안 규칙 변경
- Firebase DB URL / 프로젝트 교체
- 기존 라우팅 삭제
- 기존 카드 데이터 삭제
- `git push` / `git commit` / `gh pr create`
- 외부 API 호출
- 비용 발생하는 Firebase 기능 활성화 (Functions 등)

---

## 6. 룰 갭 대응

- Critical 갭: 게임 진행 불가 → 즉시 수정, 사용자 보고
- Major 갭: 스코어/승패 영향 → 다음 사이클 선두에 배치
- Minor 갭: UI/문구 → POLICY-QUEUE 에 등록

---

## 7. 사용자와의 동기화 주기

- Cycle 완료 시마다 요약 보고
- 커밋/푸시 직전 확인
- 3 Cycle 마다 PROGRESS.md 갱신 + 전체 상태 한눈 요약
