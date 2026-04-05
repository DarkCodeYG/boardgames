import type { Lang, ResultType } from './types';

type Txt = {
  title: string;
  subtitle: string;
  standard: string;
  standardDesc: string;
  genius: string;
  geniusDesc: string;
  themeLabel: string;
  startGame: string;
  goHome: string;
  roomCode: string;
  qrScanGuide: string;
  playersJoined: (n: number) => string;
  deckRemaining: (n: number) => string;
  minPlayersHint: string;
  yourName: string;
  enterName: string;
  join: string;
  joining: string;
  nameRequired: string;
  roomNotFound: string;
  gameAlreadyStarted: string;
  waitingToStart: string;
  setBtn: string;
  setBtnHint: string;
  gyulBtn: string;
  gyulBtnHint: string;
  yourCards: (n: number) => string;
  bonusPoints: (n: number) => string;
  totalScore: (cards: number, bonus: number) => string;
  turnDeclared: (name: string, type: 'set' | 'gyul') => string;
  yourTurnSet: string;
  yourTurnGyul: string;
  timeLeft: (n: number) => string;
  selectCards: string;
  confirm: string;
  resultText: (type: ResultType, name: string) => string;
  gameOver: string;
  finalRanking: string;
  cardsLabel: string;
  bonusLabel: string;
  totalLabel: string;
  playAgain: string;
  checkingGyul: string;
  tableCards: (n: number) => string;
  creatingRoom: string;
  scanQr: string;
  readyHint: string;
  flashCorrect: string;
  flashWrong: string;
};

export const I18N: Record<Lang, Txt> = {
  ko: {
    title: '셋',
    subtitle: '각 속성이 모두 같거나 모두 다르면 셋!',
    standard: '일반',
    standardDesc: '개수 · 색상 · 모양',
    genius: '지니어스',
    geniusDesc: '내부색 · 외부색 · 도형',
    themeLabel: '테마 선택',
    startGame: '게임 시작',
    goHome: '홈으로',
    roomCode: '방 코드',
    qrScanGuide: 'QR을 스캔해서 참가하세요',
    playersJoined: (n) => `${n}명 참가`,
    deckRemaining: (n) => `덱 ${n}장`,
    minPlayersHint: '최소 2명 필요',
    yourName: '이름',
    enterName: '이름을 입력하세요',
    join: '입장',
    joining: '입장 중...',
    nameRequired: '이름을 입력해주세요',
    roomNotFound: '방을 찾을 수 없습니다',
    gameAlreadyStarted: '게임이 이미 시작됐습니다',
    waitingToStart: '호스트가 게임을 시작할 때까지 기다리세요',
    setBtn: '셋!',
    setBtnHint: '3장이 셋을 이룰 때',
    gyulBtn: '결',
    gyulBtnHint: '테이블에 셋이 없을 때',
    yourCards: (n) => `${n}장`,
    bonusPoints: (n) => `+${n}점`,
    totalScore: (cards, bonus) => `${cards + bonus}점`,
    turnDeclared: (name, type) => `${name}이(가) ${type === 'set' ? '셋' : '결'}을 선언했습니다!`,
    yourTurnSet: '호스트 화면에서 3장을 선택하세요!',
    yourTurnGyul: '결 검증 중...',
    timeLeft: (n) => `${n}초`,
    selectCards: '3장을 선택하고 확정을 누르세요',
    confirm: '확정',
    resultText: (type, name) => {
      switch (type) {
        case 'set_correct': return `✅ ${name} 셋 성공!`;
        case 'set_wrong': return `❌ ${name} 셋 실패 — 카드 1장 반납`;
        case 'set_timeout': return `⏰ ${name} 시간 초과 — 카드 1장 반납`;
        case 'gyul_correct': return `🎯 ${name} 결 성공! +2점`;
        case 'gyul_wrong': return `❌ ${name} 결 실패 — 카드 1장 반납`;
      }
    },
    gameOver: '게임 종료',
    finalRanking: '최종 순위',
    cardsLabel: '카드',
    bonusLabel: '부가점수',
    totalLabel: '합계',
    playAgain: '다시하기',
    checkingGyul: '결 검증 중...',
    tableCards: (n) => `바닥 ${n}장`,
    creatingRoom: '방 생성 중...',
    scanQr: 'QR 스캔 후 이름을 입력하세요',
    readyHint: '셋이 보이면 버튼을 누르세요',
    flashCorrect: '정답',
    flashWrong: '오답',
  },
  en: {
    title: 'Set',
    subtitle: 'All same or all different in each attribute = Set!',
    standard: 'Standard',
    standardDesc: 'Count · Color · Shape',
    genius: 'Genius',
    geniusDesc: 'Inner · Outer · Shape',
    themeLabel: 'Choose Theme',
    startGame: 'Start Game',
    goHome: 'Home',
    roomCode: 'Room Code',
    qrScanGuide: 'Scan QR to join',
    playersJoined: (n) => `${n} players`,
    deckRemaining: (n) => `Deck: ${n}`,
    minPlayersHint: 'Need at least 2 players',
    yourName: 'Name',
    enterName: 'Enter your name',
    join: 'Join',
    joining: 'Joining...',
    nameRequired: 'Please enter a name',
    roomNotFound: 'Room not found',
    gameAlreadyStarted: 'Game already started',
    waitingToStart: 'Waiting for host to start',
    setBtn: 'SET!',
    setBtnHint: 'when 3 cards form a set',
    gyulBtn: 'NO SET',
    gyulBtnHint: 'when no set exists on table',
    yourCards: (n) => `${n} cards`,
    bonusPoints: (n) => `+${n}pts`,
    totalScore: (cards, bonus) => `${cards + bonus}pts`,
    turnDeclared: (name, type) => `${name} called ${type === 'set' ? 'SET' : 'NO SET'}!`,
    yourTurnSet: 'Select 3 cards on the host screen!',
    yourTurnGyul: 'Checking no-set...',
    timeLeft: (n) => `${n}s`,
    selectCards: 'Select 3 cards then confirm',
    confirm: 'Confirm',
    resultText: (type, name) => {
      switch (type) {
        case 'set_correct': return `✅ ${name} got a Set!`;
        case 'set_wrong': return `❌ ${name} wrong Set — return 1 card`;
        case 'set_timeout': return `⏰ ${name} timed out — return 1 card`;
        case 'gyul_correct': return `🎯 ${name} correct No-Set! +2pts`;
        case 'gyul_wrong': return `❌ ${name} wrong No-Set — return 1 card`;
      }
    },
    gameOver: 'Game Over',
    finalRanking: 'Final Rankings',
    cardsLabel: 'Cards',
    bonusLabel: 'Bonus',
    totalLabel: 'Total',
    playAgain: 'Play Again',
    checkingGyul: 'Checking no-set...',
    tableCards: (n) => `Table: ${n}`,
    creatingRoom: 'Creating room...',
    scanQr: 'Scan QR then enter your name',
    readyHint: 'Press the button when you see a Set',
    flashCorrect: 'Correct!',
    flashWrong: 'Wrong!',
  },
  zh: {
    title: '集合',
    subtitle: '每项属性全相同或全不同即为集合！',
    standard: '标准',
    standardDesc: '数量 · 颜色 · 形状',
    genius: '天才',
    geniusDesc: '内色 · 外色 · 图形',
    themeLabel: '选择主题',
    startGame: '开始游戏',
    goHome: '主页',
    roomCode: '房间码',
    qrScanGuide: '扫描二维码加入',
    playersJoined: (n) => `${n}人加入`,
    deckRemaining: (n) => `牌堆: ${n}张`,
    minPlayersHint: '至少需要2名玩家',
    yourName: '名字',
    enterName: '请输入您的名字',
    join: '加入',
    joining: '加入中...',
    nameRequired: '请输入名字',
    roomNotFound: '找不到房间',
    gameAlreadyStarted: '游戏已开始',
    waitingToStart: '等待主持人开始游戏',
    setBtn: '集合！',
    setBtnHint: '发现3张匹配时',
    gyulBtn: '无集合',
    gyulBtnHint: '桌面没有集合时',
    yourCards: (n) => `${n}张`,
    bonusPoints: (n) => `+${n}分`,
    totalScore: (cards, bonus) => `${cards + bonus}分`,
    turnDeclared: (name, type) => `${name}宣告${type === 'set' ? '集合' : '无集合'}！`,
    yourTurnSet: '在主持人屏幕上选择3张牌！',
    yourTurnGyul: '正在检查无集合...',
    timeLeft: (n) => `${n}秒`,
    selectCards: '选择3张牌后确认',
    confirm: '确认',
    resultText: (type, name) => {
      switch (type) {
        case 'set_correct': return `✅ ${name}集合成功！`;
        case 'set_wrong': return `❌ ${name}集合失败 — 还1张牌`;
        case 'set_timeout': return `⏰ ${name}超时 — 还1张牌`;
        case 'gyul_correct': return `🎯 ${name}无集合正确！+2分`;
        case 'gyul_wrong': return `❌ ${name}无集合错误 — 还1张牌`;
      }
    },
    gameOver: '游戏结束',
    finalRanking: '最终排名',
    cardsLabel: '牌',
    bonusLabel: '奖励分',
    totalLabel: '总计',
    playAgain: '再玩一局',
    checkingGyul: '检查无集合...',
    tableCards: (n) => `桌面: ${n}张`,
    creatingRoom: '正在创建房间...',
    scanQr: '扫码后输入名字',
    readyHint: '看到集合时按按钮',
    flashCorrect: '正确！',
    flashWrong: '错误！',
  },
};
