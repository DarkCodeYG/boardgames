# Boardgames 프로젝트 개발 가이드

## 작업 규칙 (반드시 준수)

- **개발 전 계획 승인:** 비자명한 구현이나 다수 파일 수정 작업은 변경 범위·접근 방식을 먼저 제시하고 사용자 승인 후 개발 시작.
- **커밋/푸시:** 반드시 사용자에게 "커밋+푸시 할까요?" 확인받은 뒤 실행. 자동으로 하지 않는다.
- **설치/파일 생성:** 묻지 않고 자율 진행.
- **기존 파일 변경/삭제:** 사전 확인 후 진행.
- **개발 완료 후:** 빌드 확인 → 자동으로 코드 리뷰 에이전트 실행 → Critical/Major 이슈 즉시 수정 → "커밋+푸시 할까요?" 순서 준수.
- **JW 용어:** 신세계역 최신판(2014 개정판) 표현 사용 (니네베, 올리브산, 코린트, 에페소, 고문주 등).
- **로컬 테스트 먼저:** 코드 변경 후 반드시 로컬에서 테스트 → 사용자 확인 → 커밋/푸시.

## 사용자 정보

- GitHub: DarkCodeYG / Email: langko@naver.com
- 한국어 사용자, JW 관련 테마에 관심
- 기술 수준: AI와 협업하여 프로젝트 진행하는 스타일
- 오프라인 파티 게임 + 아이패드/폰 연동 방식 선호

## 프로젝트 구조

```
boardgames/
├── src/
│   ├── App.tsx                    # 라우터 (URL 파라미터 기반 게임/페이지 전환)
│   ├── pages/Home.tsx             # 게임 선택 홈 화면 (언어 선택 포함)
│   ├── lib/firebase.ts            # Firebase 초기화
│   ├── games/
│   │   ├── codenames/             # 코드네임 (순수 오프라인, 시드 기반)
│   │   │   ├── components/        # Board, Card, GameHeader, GameOverModal, SpymasterKeyPage
│   │   │   ├── lib/               # game-engine, types, i18n, pinyin, words-*.ts
│   │   │   ├── pages/             # HomePage, GamePage
│   │   │   └── store/             # game-store.ts (Zustand, lang 전역 상태도 여기에)
│   │   ├── spyfall/               # 스파이폴 (순수 오프라인, 시드 기반)
│   │   │   ├── components/        # PlayerCard, Timer
│   │   │   ├── lib/               # game-engine, types, locations-standard, locations-jw
│   │   │   ├── pages/             # HomePage, GamePage
│   │   │   └── store/             # game-store.ts
│   │   └── witnesses/             # 중국의 증인들 (Firebase 하이브리드)
│   │       ├── lib/               # game-engine, types, config, i18n, firebase-room
│   │       ├── pages/             # HomePage, OnlineGamePage(아이패드), PlayerPage(폰)
│   │       └── store/             # game-store.ts
│   └── index.css                  # Tailwind 진입점
├── package.json
├── vite.config.ts
└── CLAUDE.md                      # 이 파일
```

## 게임별 아키텍처

### 코드네임 (Codenames)
- **방식:** 순수 오프라인, 시드(seed) 기반. 같은 시드 → 같은 보드
- **아이패드:** 5x5 보드, 카드 선택, 턴 관리. 오프라인 파티 모드 (팀장이 구두로 단서)
- **폰:** QR 스캔 → 팀장 답안(색상맵) 표시
- **단어팩:** Standard / JW, 한/영/중 지원. 중국어는 병음(拼音) 병기 (pinyin.ts)
- **게임 로직:** 자기팀 카드 맞추면 계속, 오답=자동 턴 전환, 암살자=즉시 패배, 수동 턴종료 가능

### 스파이폴 (Spyfall)
- **방식:** 순수 오프라인, 시드 기반
- **아이패드:** 플레이어별 QR코드 배분 → 타이머
- **폰:** QR 스캔 → "플레이어 N, 본인이 맞습니까?" 확인 → 장소+역할 or 스파이 표시
- **장소팩:** Standard 50개 / JW 50개, 한/영/중 지원
- **핵심:** `resolveGame()` 하나로 시드→장소→스파이→역할 결정 (createGame과 getPlayerRole 일관성 보장)

### 중국의 증인들 (Witnesses of China)
- **방식:** Firebase Realtime DB 하이브리드 (오프라인 모임에서 각자 폰 연동)
- **아이패드 (호스트):** 구역 맵(1~5) + 진행 컨트롤만 (결과 확인, 다음 단계 버튼)
- **폰 (플레이어):** QR 스캔/이름 입력 → 역할 확인 → 팀 선택(인도자)/투표/봉사 제출
- **Firebase 경로:** `rooms/{roomCode}/`
- **게임 흐름:**
  1. 로비: 아이패드에 QR 표시 + 수동 이름 입력 가능. 폰에서 QR 스캔하면 이름 입력 후 실시간 반영
  2. 게임 시작 → 30초 역할 확인 (카운트 끝나면 "다음" 버튼 활성화, 자동 넘김 없음)
  3. 구역 1~5 반복:
     - 아이패드: "N번 구역 · 인도자: xxx" 안내 → 인도자 폰에 팀원 선택 자동 활성화
     - 인도자 팀 확정 → 아이패드 🔔 알림 → 전원 폰에 찬반 투표
     - 투표 완료 → 아이패드에 결과 표시
     - 승인 시 → "봉사 시작하시겠습니까?" 확인 → 봉사자 폰에 성공/실패 선택
     - 봉사 완료 → "결과 확인하시겠습니까?" → 결과 + 구역 맵 색상 반영
  4. 종료: 증인 3승 → 당간부 순감 지목 기회, 공안 3승 or 5연속 부결 → 공안 승리
- **팀 구성표:** 5명(3:2) ~ 12명(7:5)
- **특수 직분:** 순회감독자, 장로, 당간부, 교직자, 배교자 (선택 가능)
- **증인은 반드시 성공 카드만 제출** (엔진에서 강제)

## 공통 패턴

### i18n (한/영/중)
- 각 게임별 i18n 파일에 텍스트 정의
- 언어 선택은 홈 화면(Home.tsx)에서 전역 설정
- `useGameStore`의 `lang`을 다른 게임에서도 참조 (codenames store에 위치)
- **TODO:** lang을 공용 store로 분리 필요

### QR 코드
- `qrcode.react`의 `QRCodeSVG` 사용
- URL 파라미터: `game`, `seed`, `player`, `count`, `lang`, `pack`, `room`, `names`, `roles`
- App.tsx의 useEffect에서 URL 파라미터 기반으로 적절한 페이지 자동 라우팅

### 새 게임 추가 방법
1. `src/games/새게임/` 디렉토리 생성 (lib, pages, store, components)
2. `lib/types.ts` — 게임 타입 정의
3. `lib/game-engine.ts` — 게임 로직 (순수 함수, 시드 기반)
4. `pages/HomePage.tsx` — 설정/룰 설명
5. `pages/GamePage.tsx` — 메인 게임 화면 (아이패드용)
6. Firebase 필요 시: `lib/firebase-room.ts` + `pages/PlayerPage.tsx` (폰용)
7. `App.tsx`에 import + Page 타입 + switch case 추가
8. `src/pages/Home.tsx`에 게임 카드 + 텍스트(ko/en/zh) 추가

### 새 게임 추가 시 체크리스트
- **소리 (iOS 포함):** 반드시 `src/lib/sound.ts`의 sfx 함수만 사용. 게임 내에서 직접 `AudioContext`를 생성하지 않는다.
  - iOS AudioContext unlock 및 짧은 소리 150ms 오프셋 수정이 `sound.ts` 모듈 레벨에 적용되어 있어, import만 하면 자동 적용됨.
  - 직접 AudioContext 쓸 경우 iOS에서 소리 안 나는 버그 재발 가능성 있음.
  - **주의 — iOS 백그라운드 복귀 문제:** iOS Safari는 앱이 백그라운드로 가거나 소리가 ~30초 없으면 AudioContext를 자동으로 다시 suspend시킨다. unlock 리스너를 첫 터치 후 제거하면 이후 Firebase 콜백/타이머에서 소리를 낼 때 user gesture 밖이므로 `resume()`이 무시되어 소리가 안 난다. `sound.ts`에는 이미 리스너를 영구 유지하는 방식으로 수정되어 있음 (removeEventListener 없음).

## 개발 명령어

```bash
npm run dev -- --host    # 로컬 개발 (아이패드/폰 같은 네트워크에서 접속 가능)
npm run build            # 프로덕션 빌드 (타입 체크 + Vite 빌드)
npx tsc --noEmit         # 타입 체크만
```

## 배포/인프라

- **Vercel:** https://boardgames-smoky.vercel.app/ (GitHub push → 자동 재배포)
- **Firebase:** 프로젝트 boardgame-373fb
  - DB URL: https://boardgame-373fb-default-rtdb.firebaseio.com
  - 콘솔: https://console.firebase.google.com
  - 보안 규칙: 테스트 모드 (30일 제한, 만료 시 콘솔에서 갱신 필요)
  - 설정 파일: `src/lib/firebase.ts`
- **GitHub:** https://github.com/DarkCodeYG/boardgames

## 알려진 개선 사항 (TODO)

- [ ] lang 전역 store를 codenames에서 분리 → 공용 `src/lib/` 로 이동
- [ ] 코드네임/스파이폴도 Firebase 하이브리드 모드 옵션 추가 가능
- [ ] Firebase 보안 규칙 프로덕션용으로 강화
- [ ] 접근성 개선 (모달 ESC 닫기, focus trap, ARIA)
- [ ] 긴 단어 오버플로우 처리 (카드 내 동적 폰트 크기)
- [ ] 스파이폴 URL 보안 (player 인덱스 난독화)
