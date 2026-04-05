/**
 * Premium Sound Effects System
 * Web Audio API 기반 합성 효과음 — 외부 파일 불필요
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// iOS Safari 오디오 unlock:
// - user gesture 밖에서는 AudioContext를 시작/재개할 수 없음
// - 백그라운드 복귀 또는 ~30초 비활성 후 AudioContext를 자동 suspend시킴
// → 리스너를 유지해 매 터치마다 재unlock, 항상 무음 버퍼로 워밍업.
//   (iOS 13+는 running 상태여도 첫 버퍼 재생 없이 소리 안 나는 경우 있음)
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      if (!ctx) ctx = new AudioContext();
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(); // suspended 상태에서도 resume 후 즉시 재생되도록 인자 없이 호출
    } catch {}
  };
  window.addEventListener('touchstart', unlock, true);
  window.addEventListener('pointerdown', unlock, true);
}

// ── 기본 음 생성 헬퍼 ──────────────────────────────────────

type OscType = OscillatorType;

function note(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  vol: number,
  type: OscType = 'sine',
  dest?: AudioNode,
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // iOS: resume()은 비동기(~50-150ms). 그 사이 예약된 짧은 소리는 currentTime이 이미
  // 지나버려 재생되지 않음. running 상태가 아니면 150ms 여유를 추가해 resume 후 재생 보장.
  const offset = ac.state !== 'running' ? 0.15 : 0;
  const t = ac.currentTime + start + offset;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.015);
  gain.gain.setValueAtTime(vol, t + dur * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(dest ?? ac.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function noise(ac: AudioContext, start: number, dur: number, vol: number, hipass = 3000) {
  const bufSize = ac.sampleRate * dur;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = hipass;
  const gain = ac.createGain();
  const offset = ac.state !== 'running' ? 0.15 : 0;
  const t = ac.currentTime + start + offset;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(hp);
  hp.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

// ── 효과음 함수들 ──────────────────────────────────────────

/** 카드 뒤집기 — 짧고 경쾌한 "틱" */
export function sfxCardFlip() {
  try {
    const ac = getCtx();
    noise(ac, 0, 0.06, 0.12, 4000);
    note(ac, 1200, 0, 0.08, 0.06, 'sine');
    note(ac, 800, 0.03, 0.06, 0.04, 'sine');
  } catch {}
}

/** 정답 — 팀 카드 맞춤 (맑은 2음 차임) */
export function sfxCorrect() {
  try {
    const ac = getCtx();
    note(ac, 880, 0, 0.15, 0.15, 'sine');
    note(ac, 1320, 0.1, 0.25, 0.18, 'sine');
  } catch {}
}

/** 오답 — 상대팀/민간인 카드 (낮은 뭉클한 소리) */
export function sfxWrong() {
  try {
    const ac = getCtx();
    note(ac, 300, 0, 0.2, 0.15, 'triangle');
    note(ac, 250, 0.1, 0.3, 0.12, 'triangle');
  } catch {}
}

/** 암살자 카드 — 극적 충격음 */
export function sfxAssassin() {
  try {
    const ac = getCtx();
    // 낮은 임팩트
    note(ac, 80, 0, 0.5, 0.25, 'sawtooth');
    note(ac, 60, 0.05, 0.6, 0.2, 'sawtooth');
    // 긴장 고음
    note(ac, 440, 0.1, 0.4, 0.08, 'sine');
    note(ac, 466, 0.15, 0.5, 0.1, 'sine');
    // 노이즈 충격
    noise(ac, 0, 0.15, 0.18, 1000);
  } catch {}
}

/** 턴 종료 — 부드러운 슬라이드 */
export function sfxTurnEnd() {
  try {
    const ac = getCtx();
    note(ac, 660, 0, 0.15, 0.1, 'sine');
    note(ac, 550, 0.08, 0.15, 0.1, 'sine');
    note(ac, 440, 0.16, 0.2, 0.08, 'sine');
  } catch {}
}

/** 게임 시작 — 밝은 상승 팡파레 */
export function sfxGameStart() {
  try {
    const ac = getCtx();
    note(ac, 523, 0, 0.15, 0.12, 'sine');      // C5
    note(ac, 659, 0.1, 0.15, 0.14, 'sine');     // E5
    note(ac, 784, 0.2, 0.15, 0.16, 'sine');     // G5
    note(ac, 1047, 0.32, 0.35, 0.2, 'sine');    // C6
    // 하모닉스
    note(ac, 1047, 0.32, 0.35, 0.06, 'triangle');
    note(ac, 1568, 0.35, 0.3, 0.04, 'sine');    // G6 soft overtone
  } catch {}
}

/** 승리 — 화려한 팡파레 */
export function sfxVictory() {
  try {
    const ac = getCtx();
    // 메인 멜로디
    note(ac, 523, 0, 0.12, 0.15, 'sine');
    note(ac, 659, 0.08, 0.12, 0.15, 'sine');
    note(ac, 784, 0.16, 0.12, 0.15, 'sine');
    note(ac, 1047, 0.26, 0.2, 0.2, 'sine');
    note(ac, 1175, 0.38, 0.15, 0.18, 'sine');  // D6
    note(ac, 1319, 0.48, 0.4, 0.22, 'sine');   // E6
    // 하모닉 레이어
    note(ac, 784, 0.26, 0.6, 0.06, 'triangle');
    note(ac, 1047, 0.38, 0.5, 0.05, 'triangle');
  } catch {}
}

/** 패배/암살자로 진 경우 — 하강 + 어두운 톤 */
export function sfxDefeat() {
  try {
    const ac = getCtx();
    note(ac, 440, 0, 0.2, 0.12, 'sine');
    note(ac, 370, 0.15, 0.2, 0.12, 'sine');
    note(ac, 311, 0.3, 0.2, 0.1, 'sine');
    note(ac, 262, 0.45, 0.5, 0.14, 'triangle');
    note(ac, 196, 0.5, 0.6, 0.08, 'triangle');
  } catch {}
}

/** UI 버튼 클릭 — 미세한 틱 */
export function sfxClick() {
  try {
    const ac = getCtx();
    note(ac, 1000, 0, 0.05, 0.06, 'sine');
    noise(ac, 0, 0.03, 0.04, 6000);
  } catch {}
}

/** 토글/선택 — 약간 더 풍성한 클릭 */
export function sfxToggle() {
  try {
    const ac = getCtx();
    note(ac, 880, 0, 0.06, 0.08, 'sine');
    note(ac, 1100, 0.03, 0.08, 0.06, 'sine');
  } catch {}
}

/** 카운터 증가 (+) */
export function sfxCountUp() {
  try {
    const ac = getCtx();
    note(ac, 600, 0, 0.06, 0.08, 'sine');
    note(ac, 900, 0.04, 0.08, 0.06, 'sine');
  } catch {}
}

/** 카운터 감소 (-) */
export function sfxCountDown() {
  try {
    const ac = getCtx();
    note(ac, 900, 0, 0.06, 0.08, 'sine');
    note(ac, 600, 0.04, 0.08, 0.06, 'sine');
  } catch {}
}

/** 스파이 공개 — 극적 서스펜스 */
export function sfxSpyReveal() {
  try {
    const ac = getCtx();
    // 서스펜스 빌드업
    note(ac, 220, 0, 0.3, 0.1, 'sawtooth');
    note(ac, 233, 0.05, 0.3, 0.1, 'sawtooth');
    // 충격 리빌
    note(ac, 440, 0.25, 0.12, 0.18, 'square');
    note(ac, 554, 0.3, 0.12, 0.16, 'square');
    noise(ac, 0.25, 0.1, 0.08, 3000);
    // 여운
    note(ac, 277, 0.4, 0.5, 0.08, 'sine');
  } catch {}
}

/** 역할 카드 공개 — 부드러운 리빌 */
export function sfxRoleReveal() {
  try {
    const ac = getCtx();
    note(ac, 440, 0, 0.1, 0.1, 'sine');
    note(ac, 554, 0.08, 0.1, 0.12, 'sine');
    note(ac, 659, 0.16, 0.2, 0.14, 'sine');
    note(ac, 880, 0.28, 0.3, 0.1, 'sine');
  } catch {}
}

/** 타이머 틱 — 마지막 10초 */
export function sfxTimerTick() {
  try {
    const ac = getCtx();
    note(ac, 1000, 0, 0.05, 0.1, 'sine');
  } catch {}
}

/** 타이머 종료 — 알람벨 */
export function sfxTimerUp() {
  try {
    const ac = getCtx();
    for (let i = 0; i < 3; i++) {
      note(ac, 880, i * 0.2, 0.12, 0.15, 'sine');
      note(ac, 1100, i * 0.2 + 0.08, 0.12, 0.12, 'sine');
    }
  } catch {}
}

/** 모달 열기 — 부드러운 등장 */
export function sfxModalOpen() {
  try {
    const ac = getCtx();
    note(ac, 500, 0, 0.08, 0.06, 'sine');
    note(ac, 750, 0.04, 0.12, 0.08, 'sine');
  } catch {}
}

/** 모달 닫기/취소 */
export function sfxModalClose() {
  try {
    const ac = getCtx();
    note(ac, 700, 0, 0.06, 0.06, 'sine');
    note(ac, 500, 0.04, 0.1, 0.05, 'sine');
  } catch {}
}

/** 턴 전환 — 길고 확실한 턴오버 */
export function sfxTurnOver() {
  try {
    const ac = getCtx();
    // 초기 임팩트 노이즈
    noise(ac, 0, 0.1, 0.1, 3000);
    // 하강 3음 (A5 → E5 → C5)
    note(ac, 880, 0, 0.18, 0.28, 'sine');
    note(ac, 660, 0.15, 0.22, 0.30, 'sine');
    note(ac, 523, 0.32, 0.40, 0.26, 'sine');
    // 하모닉 레이어
    note(ac, 523, 0.32, 0.40, 0.08, 'triangle');
  } catch {}
}

/** 참가자 입장 — 경쾌한 핑 */
export function sfxPlayerJoin() {
  try {
    const ac = getCtx();
    note(ac, 660, 0, 0.08, 0.1, 'sine');
    note(ac, 880, 0.07, 0.12, 0.12, 'sine');
  } catch {}
}

/** 게임 선택 — 풍성한 선택음 */
export function sfxGameSelect() {
  try {
    const ac = getCtx();
    note(ac, 440, 0, 0.08, 0.1, 'sine');
    note(ac, 554, 0.05, 0.08, 0.1, 'sine');
    note(ac, 659, 0.1, 0.08, 0.12, 'sine');
    note(ac, 880, 0.17, 0.2, 0.1, 'sine');
  } catch {}
}
